/**
 * @file directoryService.js
 * Real-time student directory service (Phase 4).
 * Joins /faculty/* with live /status/* subscriptions over WebSockets.
 */

import { ref, onValue, off } from 'firebase/database';
import { db } from './firebase';
import { STATUS_KEYS, STATUS_CONFIG } from '@profping/shared';

const MOCK_DIRECTORY = [];

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

        // Base mapping with institutional faculty members
        const facultyMap = {};
        MOCK_DIRECTORY.forEach((item) => {
          facultyMap[item.uid] = { ...item };
        });

        // Overlay with Firebase faculty entries if any exist
        Object.keys(facultyCache).forEach((uid) => {
          facultyMap[uid] = { ...(facultyMap[uid] || {}), ...facultyCache[uid], uid };
        });

        // Map live status from Firebase statusCache
        const list = Object.values(facultyMap).map((fac) => {
          const email = (fac.email || '').toLowerCase().trim();

          // Find any user in usersCache with matching email that has a status entry
          const matchedUserUid = Object.keys(usersCache).find((uId) => {
            const uEmail = (usersCache[uId]?.email || '').toLowerCase().trim();
            return uEmail === email && statusCache[uId] !== undefined;
          });

          // Multi-key live status resolution:
          // 1. Direct UID match in status/
          // 2. Auth UID from users/
          // 3. Explicit authUid property if present on faculty record
          // 4. Any status entry matching email
          let liveStatus =
            statusCache[fac.uid] ||
            (matchedUserUid && statusCache[matchedUserUid]) ||
            (fac.authUid && statusCache[fac.authUid]);

          if (!liveStatus) {
            const found = Object.values(statusCache).find(
              (st) => (st?.email || '').toLowerCase().trim() === email
            );
            if (found) liveStatus = found;
          }

          if (!liveStatus) {
            const fallbackUserUid = Object.keys(usersCache).find(
              (uId) => (usersCache[uId]?.email || '').toLowerCase().trim() === email
            );
            if (fallbackUserUid && statusCache[fallbackUserUid]) {
              liveStatus = statusCache[fallbackUserUid];
            }
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
