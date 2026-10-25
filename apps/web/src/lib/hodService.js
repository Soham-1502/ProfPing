/**
 * @file hodService.js (Web)
 * Real-time Firebase operations for HOD Command Center, Faculty Directory CRUD,
 * Student Access Control (Kill Switch), and Department Settings.
 */

import { ref, onValue, get, set, update, remove, off } from 'firebase/database';
import { db } from './firebase';
import { STATUS_KEYS } from '@profping/shared';

/**
 * 1. LIVE COMMAND CENTER: Subscribe to live faculty roster for a department
 */
export function subscribeToDepartmentFaculty(department, callback) {
  const facultyRef = ref(db, 'faculty');
  const unsubscribe = onValue(
    facultyRef,
    (snapshot) => {
      const facultyMap = snapshot.val() || {};
      const list = Object.values(facultyMap).filter(
        (f) => !department || department === 'ALL' || (f.department || '').toUpperCase() === (department || '').toUpperCase()
      );
      callback(list);
    },
    (error) => {
      console.warn('Faculty snapshot listener note:', error.message);
      callback([]);
    }
  );

  return () => unsubscribe();
}

/**
 * 2. FACULTY DIRECTORY CRUD
 */
export async function addFacultyMember(facultyData, caller = {}) {
  try {
    const res = await fetch('/api/admin/faculty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_faculty',
        callerEmail: caller.email,
        callerRole: caller.role || 'hod',
        callerDepartment: caller.department || facultyData.department,
        facultyData,
      }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to add faculty member');
    return result.faculty;
  } catch (apiErr) {
    console.warn('API add faculty fallback to direct RTDB write:', apiErr.message);
    const facultyId = facultyData.uid || `faculty-${(facultyData.department || 'CMPN').toLowerCase()}-${Date.now()}`;
    const payload = {
      ...facultyData,
      uid: facultyId,
      role: 'faculty',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      preapproved: true,
      status: {
        state: STATUS_KEYS.OFF_CAMPUS,
        message: 'New Faculty Provisioned',
        updatedAt: Date.now(),
      },
    };

    await set(ref(db, `faculty/${facultyId}`), payload);
    await set(ref(db, `users/${facultyId}`), payload);
    if (facultyData.email) {
      const sanitizedKey = facultyData.email.replace(/\./g, '_').replace(/@/g, '_at_');
      await set(ref(db, `preapproved_users/${sanitizedKey}`), payload);
    }
    return payload;
  }
}

export async function updateFacultyMember(facultyId, updates, caller = {}) {
  try {
    const res = await fetch('/api/admin/faculty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_faculty',
        callerEmail: caller.email,
        callerRole: caller.role || 'hod',
        callerDepartment: caller.department || updates.department,
        facultyUid: facultyId,
        facultyData: updates,
      }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to update faculty member');
    return result.faculty;
  } catch (apiErr) {
    console.warn('API update faculty fallback to direct RTDB write:', apiErr.message);
    const payload = {
      ...updates,
      updatedAt: Date.now(),
    };

    await update(ref(db, `faculty/${facultyId}`), payload);
    await update(ref(db, `users/${facultyId}`), payload);
    return payload;
  }
}

export async function deleteFacultyMember(facultyId, facultyEmail, caller = {}) {
  try {
    const res = await fetch('/api/admin/faculty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete_faculty',
        callerEmail: caller.email,
        callerRole: caller.role || 'hod',
        callerDepartment: caller.department,
        facultyUid: facultyId,
        facultyData: { email: facultyEmail },
      }),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || 'Failed to delete faculty member');
    return true;
  } catch (apiErr) {
    console.warn('API delete faculty fallback to direct RTDB delete:', apiErr.message);
    await remove(ref(db, `faculty/${facultyId}`));
    await remove(ref(db, `users/${facultyId}`));
    if (facultyEmail) {
      const sanitizedKey = facultyEmail.replace(/\./g, '_').replace(/@/g, '_at_');
      await remove(ref(db, `preapproved_users/${sanitizedKey}`));
    }
    return true;
  }
}

/**
 * 3. STUDENT ACCESS CONTROL: Scoped to self-declared department with Kill Switch
 */
export function subscribeToStudents(department, callback) {
  const usersRef = ref(db, 'users');
  const studentAccessRef = ref(db, 'studentAccess');

  let usersCache = {};
  let accessCache = {};

  const processAndEmit = () => {
    const studentMap = new Map();

    // 1. Overlay studentAccess entries (written by mobile app)
    Object.entries(accessCache).forEach(([uid, acc]) => {
      if (!acc) return;
      studentMap.set(uid, {
        uid,
        name: acc.name || 'Student',
        email: acc.email || '',
        department: (acc.department || '').toUpperCase(),
        lastSeen: acc.lastSeen || Date.now(),
        is_active: acc.revoked !== true,
        revoked: acc.revoked === true,
      });
    });

    // 2. Overlay users table
    Object.entries(usersCache).forEach(([uid, u]) => {
      if (!u) return;
      const isStudent = u.role === 'student' || (u.email && u.email.endsWith('@student.sfit.ac.in'));
      if (isStudent) {
        const existing = studentMap.get(uid) || {};
        const isRevoked = u.is_active === false || u.revoked === true || u.status === 'revoked';
        studentMap.set(uid, {
          uid,
          name: u.displayName || u.name || existing.name || 'Student',
          email: u.email || existing.email || '',
          department: (u.department || existing.department || '').toUpperCase(),
          lastSeen: u.lastLoginAt || existing.lastSeen || u.claimedAt || Date.now(),
          is_active: !isRevoked,
          revoked: isRevoked,
          rollNo: u.rollNo || existing.rollNo || '',
        });
      }
    });

    // 3. Filter strictly by HOD's department if specified
    const targetDept = (department || '').toUpperCase();
    const allStudents = Array.from(studentMap.values());
    const filtered = allStudents.filter((s) => {
      if (!targetDept || targetDept === 'ALL') return true;
      return s.department === targetDept || s.department.includes(targetDept);
    });

    callback(filtered);
  };

  const unsubUsers = onValue(
    usersRef,
    (snap) => {
      usersCache = snap.val() || {};
      processAndEmit();
    },
    (err) => {
      console.warn('Student users snapshot note:', err.message);
    }
  );

  const unsubAccess = onValue(
    studentAccessRef,
    (snap) => {
      accessCache = snap.val() || {};
      processAndEmit();
    },
    (err) => {
      console.warn('Student access snapshot note:', err.message);
    }
  );

  return () => {
    off(usersRef);
    off(studentAccessRef);
  };
}

export async function toggleStudentAccess(studentUid, currentActiveStatus) {
  const newActiveStatus = !currentActiveStatus;
  const isRevoked = !newActiveStatus;

  // Multi-path update: update /users/{uid} and /studentAccess/{uid}
  const updates = {};
  updates[`users/${studentUid}/is_active`] = newActiveStatus;
  updates[`users/${studentUid}/revoked`] = isRevoked;
  updates[`users/${studentUid}/statusModifiedAt`] = Date.now();
  updates[`studentAccess/${studentUid}/revoked`] = isRevoked;
  updates[`studentAccess/${studentUid}/lastModifiedAt`] = Date.now();

  await update(ref(db), updates);
  return newActiveStatus;
}

/**
 * 4. GLOBAL DEPARTMENT SETTINGS
 */
export async function getDepartmentSettings(department = 'CMPN') {
  try {
    const snap = await get(ref(db, `departments/${department}/settings`));
    if (snap.exists()) {
      return snap.val();
    }
  } catch (err) {
    console.warn('Settings get note:', err.message);
  }

  // Fallback default settings
  return {
    department,
    departmentName: department === 'ECS' ? 'Electronics & Computer Science' : 'Computer Engineering',
    hoursStart: '08:30',
    hoursEnd: '17:30',
    autoResetOffCampus: true,
    autoResetTime: '17:01',
    allowCustomStatusNotes: true,
    requireIntercomOnDesk: true,
    hodOffice: 'Room 301, 3rd Floor Main Building',
    hodIntercom: 'Ext. 3010',
    updatedAt: Date.now(),
  };
}

export async function updateDepartmentSettings(department, settings) {
  const payload = {
    ...settings,
    department,
    updatedAt: Date.now(),
  };
  await set(ref(db, `departments/${department}/settings`), payload);
  return payload;
}
