/**
 * @file directoryService.js
 * Real-time student directory service (Phase 4).
 * Joins /faculty/* with live /status/* subscriptions over WebSockets.
 */

import { ref, onValue, off } from 'firebase/database';
import { db } from './firebase';
import { STATUS_KEYS, STATUS_CONFIG } from '@profping/shared';

// Institutional Department HODs across all SFIT engineering departments
export const ALL_DEPT_HODS = [
  {
    uid: 'hod-cmpn-dr-kavita-sonawane',
    name: 'Dr. Kavita Sonawane',
    department: 'CMPN',
    designation: 'Professor & HOD',
    email: 'hod.cmpn@sfit.ac.in',
    cabin: 'Room 401',
    floor: '4th Floor',
    wing: 'Main Wing',
    intercom: 'Ext. 4010',
    officeHours: '10:00 AM - 01:00 PM',
    isHod: true,
    role: 'hod',
    isVerified: true,
  },
  {
    uid: 'hod-inft-dr-joanne-gomes',
    name: 'Dr. Joanne Gomes',
    department: 'INFT',
    designation: 'Professor & HOD',
    email: 'hod.inft@sfit.ac.in',
    cabin: 'Room 402',
    floor: '4th Floor',
    wing: 'IT Wing',
    intercom: 'Ext. 4020',
    officeHours: '09:30 AM - 12:30 PM',
    isHod: true,
    role: 'hod',
    isVerified: true,
  },
  {
    uid: 'hod-ecs-dr-nitika-rai',
    name: 'Dr. Nitika Rai',
    department: 'ECS',
    designation: 'Professor & HOD',
    email: 'nitika.rai@sfit.ac.in',
    cabin: 'Room 301',
    floor: '3rd Floor',
    wing: 'Academic Wing B',
    intercom: 'Ext. 3010',
    officeHours: '10:00 AM - 12:00 PM',
    isHod: true,
    role: 'hod',
    isVerified: true,
  },
  {
    uid: 'hod-extc-dr-gautam-shah',
    name: 'Dr. Gautam Shah',
    department: 'EXTC',
    designation: 'Professor & HOD',
    email: 'hod.extc@sfit.ac.in',
    cabin: 'Room 201',
    floor: '2nd Floor',
    wing: 'Telecom Wing',
    intercom: 'Ext. 2010',
    officeHours: '11:00 AM - 02:00 PM',
    isHod: true,
    role: 'hod',
    isVerified: true,
  },
];

const MOCK_DIRECTORY = [...ALL_DEPT_HODS];

/**
 * Subscribes to live faculty list joined with live status
 *
 * @param {function(Array):void} onUpdate - Callback receiving joined faculty list
 * @returns {function():void} Unsubscribe function
 */
export function subscribeToLiveDirectory(onUpdate) {
  const isPlaceholderKey = !process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY === 'demo-api-key';

  if (!isPlaceholderKey) {
    try {
      const facultyRef = ref(db, 'faculty');
      const statusRef = ref(db, 'status');
      const usersRef = ref(db, 'users');

      let facultyCache = {};
      let statusCache = {};
      let usersCache = {};

      const computeJoinedList = () => {
        // Build email to user UID map from users table
        const emailToUserUid = {};
        Object.entries(usersCache).forEach(([uid, u]) => {
          const email = (u?.email || '').toLowerCase().trim();
          if (email) emailToUserUid[email] = uid;
        });

        // Base mapping with institutional HODs across all departments
        const facultyMap = {};
        ALL_DEPT_HODS.forEach((item) => {
          facultyMap[item.uid] = { ...item };
        });

        // Overlay with Firebase faculty entries if any exist
        Object.keys(facultyCache).forEach((uid) => {
          const fac = facultyCache[uid];
          if (!fac) return;
          const facEmail = (fac.email || '').toLowerCase().trim();
          // Check if an existing HOD matches by email
          const existingKey = Object.keys(facultyMap).find(
            (k) => (facultyMap[k]?.email || '').toLowerCase().trim() === facEmail
          );
          if (existingKey) {
            facultyMap[existingKey] = {
              ...facultyMap[existingKey],
              ...fac,
              uid: existingKey,
              authUid: uid,
            };
          } else {
            facultyMap[uid] = { ...fac, uid };
          }
        });

        // Also incorporate any user from users/ with role 'hod' or 'faculty'
        Object.entries(usersCache).forEach(([uid, u]) => {
          if (!u) return;
          const uRole = (u.role || '').toLowerCase();
          const uEmail = (u.email || '').toLowerCase().trim();
          if (uRole === 'hod' || uRole === 'faculty' || uEmail.startsWith('hod.') || uEmail.includes('nitika.rai')) {
            const existingKey = Object.keys(facultyMap).find(
              (k) => (facultyMap[k]?.email || '').toLowerCase().trim() === uEmail
            );
            if (existingKey) {
              facultyMap[existingKey] = {
                ...facultyMap[existingKey],
                name: u.displayName || u.name || facultyMap[existingKey].name,
                photoURL: u.photoURL || u.photoUrl || facultyMap[existingKey].photoURL,
                department: (u.department || facultyMap[existingKey].department || 'CMPN').toUpperCase(),
                authUid: uid,
                isHod: uRole === 'hod' || facultyMap[existingKey].isHod,
              };
            } else {
              facultyMap[uid] = {
                uid,
                authUid: uid,
                name: u.displayName || u.name || (u.email ? u.email.split('@')[0] : 'Faculty'),
                email: u.email,
                department: (u.department || 'CMPN').toUpperCase(),
                designation: uRole === 'hod' ? 'Professor & HOD' : 'Associate Professor',
                cabin: u.cabin || 'Faculty Cabin',
                floor: u.floor || '3rd Floor',
                wing: u.wing || 'Academic Wing',
                intercom: u.intercom || 'Ext. N/A',
                officeHours: u.officeHours || '09:00 AM - 05:00 PM',
                photoURL: u.photoURL || u.photoUrl || null,
                isHod: uRole === 'hod' || uEmail.startsWith('hod.') || uEmail.includes('nitika.rai'),
                role: uRole === 'hod' ? 'hod' : 'faculty',
                isVerified: true,
              };
            }
          }
        });

        // Map live status from Firebase statusCache
        const list = Object.values(facultyMap).map((fac) => {
          const email = (fac.email || '').toLowerCase().trim();

          // Multi-key live status resolution:
          // 1. Direct UID match in status/
          // 2. Auth UID match in status/
          // 3. User UID matching faculty email in users/
          // 4. Any status entry matching email
          let liveStatus =
            statusCache[fac.uid] ||
            (fac.authUid && statusCache[fac.authUid]);

          if (!liveStatus && emailToUserUid[email]) {
            liveStatus = statusCache[emailToUserUid[email]];
          }

          if (!liveStatus) {
            const found = Object.values(statusCache).find(
              (st) => (st?.email || '').toLowerCase().trim() === email
            );
            if (found) liveStatus = found;
          }

          if (!liveStatus) {
            liveStatus = fac.status || {
              state: STATUS_KEYS.AVAILABLE,
              message: STATUS_CONFIG[STATUS_KEYS.AVAILABLE].defaultMessage,
              updatedAt: Date.now(),
            };
          }

          return {
            ...fac,
            status: liveStatus,
          };
        });

        // Sort with HODs first within departments, then alphabetically by name
        list.sort((a, b) => {
          if (a.isHod && !b.isHod) return -1;
          if (!a.isHod && b.isHod) return 1;
          return (a.name || '').localeCompare(b.name || '');
        });

        onUpdate(list);
      };

      const unsubFaculty = onValue(facultyRef, (snapshot) => {
        facultyCache = snapshot.exists() ? (snapshot.val() || {}) : {};
        computeJoinedList();
      });

      const unsubStatus = onValue(statusRef, (snapshot) => {
        statusCache = snapshot.exists() ? (snapshot.val() || {}) : {};
        computeJoinedList();
      });

      const unsubUsers = onValue(usersRef, (snapshot) => {
        usersCache = snapshot.exists() ? (snapshot.val() || {}) : {};
        computeJoinedList();
      });

      return () => {
        if (typeof unsubFaculty === 'function') unsubFaculty();
        if (typeof unsubStatus === 'function') unsubStatus();
        if (typeof unsubUsers === 'function') unsubUsers();
      };
    } catch (e) {
      console.warn('Realtime subscription error, using mock directory:', e.message);
    }
  }

  // Provide initial mock data
  onUpdate(MOCK_DIRECTORY);

  // Return no-op cleanup for mock
  return () => {};
}
