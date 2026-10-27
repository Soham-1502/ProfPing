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
  const statusRef = ref(db, 'status');
  const usersRef = ref(db, 'users');
  const logsRef = ref(db, 'logs');

  let facultyCache = {};
  let statusCache = {};
  let usersCache = {};
  let logsCache = {};

  const emitJoinedFaculty = () => {
    const list = Object.entries(facultyCache).map(([facUid, fac]) => {
      const email = (fac.email || '').toLowerCase().trim();

      // Find any user in usersCache with matching email that has a status entry
      const matchedUserUid = Object.keys(usersCache).find((uId) => {
        const uEmail = (usersCache[uId]?.email || '').toLowerCase().trim();
        return uEmail === email && statusCache[uId] !== undefined;
      });

      // Find any user in usersCache with matching email that has logs
      const matchedLogsUserUid = Object.keys(usersCache).find((uId) => {
        const uEmail = (usersCache[uId]?.email || '').toLowerCase().trim();
        return uEmail === email && logsCache[uId] !== undefined;
      });

      // Multi-key live status resolution:
      // 1. Direct UID match in status/
      // 2. Auth UID match from users/
      // 3. Explicit authUid property if present on faculty record
      // 4. Any status entry matching email
      let liveStatus =
        statusCache[facUid] ||
        (matchedUserUid && statusCache[matchedUserUid]) ||
        (fac.authUid && statusCache[fac.authUid]);

      if (!liveStatus) {
        const found = Object.values(statusCache).find(
          (st) => (st?.email || '').toLowerCase().trim() === email
        );
        if (found) liveStatus = found;
      }

      if (!liveStatus) {
        // Fallback to any user UID matching email even if status entry was absent
        const fallbackUserUid = Object.keys(usersCache).find(
          (uId) => (usersCache[uId]?.email || '').toLowerCase().trim() === email
        );
        if (fallbackUserUid && statusCache[fallbackUserUid]) {
          liveStatus = statusCache[fallbackUserUid];
        }
      }

      if (!liveStatus) {
        liveStatus = fac.status || {
          state: STATUS_KEYS.OFF_CAMPUS,
          message: 'Off campus',
          updatedAt: fac.updatedAt || Date.now(),
        };
      }

      // Resolve live telemetry logs
      const rawLogs =
        logsCache[facUid] ||
        (matchedLogsUserUid && logsCache[matchedLogsUserUid]) ||
        (matchedUserUid && logsCache[matchedUserUid]) ||
        (fac.authUid && logsCache[fac.authUid]) ||
        fac.sampleLogs ||
        [];
      const sampleLogs = Array.isArray(rawLogs) ? rawLogs : Object.values(rawLogs);

      return {
        ...fac,
        uid: facUid,
        status: liveStatus,
        sampleLogs: sampleLogs.length > 0 ? sampleLogs : fac.sampleLogs || [],
      };
    }).filter((f) => {
      if (!department || department === 'ALL') return true;
      return (f.department || '').toUpperCase() === department.toUpperCase();
    });

    callback(list);
  };

  const unsubFaculty = onValue(
    facultyRef,
    (snapshot) => {
      facultyCache = snapshot.val() || {};
      emitJoinedFaculty();
    },
    (error) => {
      console.warn('Faculty snapshot listener note:', error.message);
    }
  );

  const unsubStatus = onValue(
    statusRef,
    (snapshot) => {
      statusCache = snapshot.val() || {};
      emitJoinedFaculty();
    },
    (error) => {
      console.warn('Status snapshot listener note:', error.message);
    }
  );

  const unsubUsers = onValue(
    usersRef,
    (snapshot) => {
      usersCache = snapshot.val() || {};
      emitJoinedFaculty();
    },
    (error) => {
      console.warn('Users snapshot listener note:', error.message);
    }
  );

  const unsubLogs = onValue(
    logsRef,
    (snapshot) => {
      logsCache = snapshot.val() || {};
      emitJoinedFaculty();
    },
    (error) => {
      console.warn('Logs snapshot listener note:', error.message);
    }
  );

  return () => {
    if (typeof unsubFaculty === 'function') unsubFaculty();
    if (typeof unsubStatus === 'function') unsubStatus();
    if (typeof unsubUsers === 'function') unsubUsers();
    if (typeof unsubLogs === 'function') unsubLogs();
  };
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
        name: acc.name || acc.displayName || 'Student',
        email: acc.email || '',
        department: (acc.department || '').toUpperCase(),
        lastSeen: acc.lastSeen || Date.now(),
        is_active: acc.revoked !== true,
        revoked: acc.revoked === true,
        rollNumber: acc.rollNumber || acc.rollNo || '',
        pid: acc.pid || '',
        photoURL: acc.photoURL || null,
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
          rollNumber: u.rollNumber || u.rollNo || existing.rollNumber || existing.rollNo || '',
          pid: u.pid || existing.pid || '',
          photoURL: u.photoURL || existing.photoURL || null,
        });
      }
    });

    // 3. Deduplicate by student email so multiple sessions never create duplicate rows
    const deduplicatedByEmail = new Map();
    studentMap.forEach((s) => {
      const emailKey = (s.email || '').toLowerCase().trim();
      if (!emailKey) {
        deduplicatedByEmail.set(s.uid, s);
        return;
      }
      if (!deduplicatedByEmail.has(emailKey)) {
        deduplicatedByEmail.set(emailKey, s);
      } else {
        const prev = deduplicatedByEmail.get(emailKey);
        deduplicatedByEmail.set(emailKey, {
          ...prev,
          ...s,
          name: s.name && s.name !== 'Student' ? s.name : prev.name,
          rollNumber: s.rollNumber || prev.rollNumber || '',
          rollNo: s.rollNo || prev.rollNo || '',
          pid: s.pid || prev.pid || '',
          photoURL: s.photoURL || prev.photoURL || null,
          lastSeen: Math.max(s.lastSeen || 0, prev.lastSeen || 0),
          is_active: prev.is_active && s.is_active,
          revoked: prev.revoked || s.revoked,
        });
      }
    });

    // 4. Filter strictly by HOD's department if specified
    const targetDept = (department || '').toUpperCase();
    const allStudents = Array.from(deduplicatedByEmail.values());
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
