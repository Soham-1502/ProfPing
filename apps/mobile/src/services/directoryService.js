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

      let facultyCache = {};
      let statusCache = {};

      const computeJoinedList = () => {
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
          const liveStatus = statusCache[fac.uid] || fac.status || {
            state: STATUS_KEYS.AVAILABLE,
            message: STATUS_CONFIG[STATUS_KEYS.AVAILABLE].defaultMessage,
            updatedAt: Date.now(),
          };
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

      return () => {
        off(facultyRef);
        off(statusRef);
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
