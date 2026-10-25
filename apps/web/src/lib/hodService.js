/**
 * @file hodService.js (Web)
 * Real-time Firebase operations for HOD Command Center, Faculty Directory CRUD,
 * Student Access Control (Kill Switch), and Department Settings.
 */

import { ref, onValue, get, set, update, remove } from 'firebase/database';
import { db } from './firebase';
import { STATUS_KEYS } from '@profping/shared';

// Initial faculty directory (empty clean state)
const INITIAL_FACULTY_SEED = {};

/**
 * 1. LIVE COMMAND CENTER: Subscribe to live faculty roster for a department
 */
export function subscribeToDepartmentFaculty(department, callback) {
  const facultyRef = ref(db, 'faculty');
  const unsubscribe = onValue(facultyRef, (snapshot) => {
    const facultyMap = snapshot.val() || {};
    const list = Object.values(facultyMap).filter(
      (f) => !department || department === 'ALL' || f.department === department
    );
    callback(list);
  }, (error) => {
    console.warn('Faculty snapshot listener note:', error.message);
    callback([]);
  });

  return () => unsubscribe();
}

/**
 * 2. FACULTY DIRECTORY CRUD
 */
export async function addFacultyMember(facultyData) {
  const facultyId = facultyData.uid || `faculty-${Date.now()}`;
  const payload = {
    ...facultyData,
    uid: facultyId,
    role: 'faculty',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: {
      state: STATUS_KEYS.OFF_CAMPUS,
      message: 'New Faculty Provisioned',
      updatedAt: Date.now(),
    },
  };

  // Write to both /faculty/{id} and /users/{id}
  await set(ref(db, `faculty/${facultyId}`), payload);
  await set(ref(db, `users/${facultyId}`), payload);
  return payload;
}

export async function updateFacultyMember(facultyId, updates) {
  const payload = {
    ...updates,
    updatedAt: Date.now(),
  };

  await update(ref(db, `faculty/${facultyId}`), payload);
  await update(ref(db, `users/${facultyId}`), payload);
  return payload;
}

export async function deleteFacultyMember(facultyId) {
  await remove(ref(db, `faculty/${facultyId}`));
  await remove(ref(db, `users/${facultyId}`));
  return true;
}

/**
 * 3. STUDENT ACCESS CONTROL: Searchable Audit Log and Kill Switch
 */
export function subscribeToStudents(callback) {
  const usersRef = ref(db, 'users');
  const unsubscribe = onValue(usersRef, (snapshot) => {
    const allUsers = snapshot.val() || {};
    const students = Object.values(allUsers).filter(
      (u) => u.role === 'student' || (u.email && u.email.endsWith('@student.sfit.ac.in'))
    );

    // If no students yet in database, provide sample demo audit log
    if (students.length === 0) {
      callback([
        {
          uid: 'student-demo-01',
          name: 'Soham Tamhankar',
          email: 'student@sfit.ac.in',
          rollNo: '21102B0045',
          department: 'CMPN',
          year: 'TE CMPN A',
          is_active: true,
          lastLoginAt: Date.now() - 1000 * 60 * 18,
          createdAt: Date.now() - 1000 * 60 * 60 * 24 * 30,
        },
        {
          uid: 'student-demo-02',
          name: 'Aditi Sharma',
          email: 'aditi.sharma@student.sfit.ac.in',
          rollNo: '21102B0012',
          department: 'CMPN',
          year: 'TE CMPN B',
          is_active: true,
          lastLoginAt: Date.now() - 1000 * 60 * 60 * 2,
          createdAt: Date.now() - 1000 * 60 * 60 * 24 * 45,
        },
        {
          uid: 'student-demo-03',
          name: 'Rohan Verma',
          email: 'rohan.verma@student.sfit.ac.in',
          rollNo: '20102A0088',
          department: 'ECS',
          year: 'BE ECS',
          is_active: false,
          lastLoginAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
          createdAt: Date.now() - 1000 * 60 * 60 * 24 * 90,
        },
      ]);
      return;
    }

    callback(students);
  }, (err) => {
    console.warn('Student snapshot listener note:', err.message);
  });

  return () => unsubscribe();
}

export async function toggleStudentAccess(studentUid, currentStatus) {
  const newStatus = !currentStatus;
  await update(ref(db, `users/${studentUid}`), {
    is_active: newStatus,
    statusModifiedAt: Date.now(),
  });
  return newStatus;
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
    hoursEnd: '17:00',
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
