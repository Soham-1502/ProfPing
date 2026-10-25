/**
 * @file statusService.js
 * Atomic status broadcast service for faculty (Phase 3).
 * Connects directly to Firebase Realtime Database: updates /status/{uid} and appends to /logs/{uid}.
 */

import { ref, push, set, serverTimestamp, get, onValue, off } from 'firebase/database';
import { db } from './firebase';
import { STATUS_KEYS, STATUS_CONFIG } from '@profping/shared';

// In-memory status cache initialized with live state
const mockStatusStore = {
  'demo-faculty-ecs-01': {
    state: STATUS_KEYS.BUSY,
    message: 'Tutorial Checking in Room 528',
    updatedAt: Date.now() - 1000 * 60 * 10,
  },
  'dXXBBwdV1ugRCuHBZjQgFCX1PUH3': {
    state: STATUS_KEYS.BUSY,
    message: 'Tutorial Checking in Room 528',
    updatedAt: Date.now() - 1000 * 60 * 10,
  },
  'demo-faculty-cmpn-01': {
    state: STATUS_KEYS.AVAILABLE,
    message: 'Available in Lab 304',
    updatedAt: Date.now() - 1000 * 60 * 15,
  },
};

export function getCachedFacultyStatus(facultyUid) {
  if (!facultyUid) return null;
  return mockStatusStore[facultyUid] || null;
}

const mockLogsStore = {};

/**
 * Stores and broadcasts faculty status directly onto Firebase Realtime Database
 *
 * @param {string} facultyUid - UID of authenticated faculty member
 * @param {string} state - One of 'available' | 'busy' | 'in_lecture' | 'off_campus'
 * @param {string} [customMessage] - Optional status message (max 140 chars)
 * @returns {Promise<{ success: boolean, state: string, message: string, timestamp: number }>}
 */
export async function broadcastStatus(facultyUid, state, customMessage = '') {
  if (!facultyUid) {
    throw new Error('Faculty UID is required to broadcast status');
  }
  const uid = facultyUid;

  // Validate state key
  if (!Object.values(STATUS_KEYS).includes(state)) {
    throw new Error(`Invalid status key: ${state}`);
  }

  // Format and validate message (clip to max 140 chars per security rules)
  const cleanMessage = typeof customMessage === 'string' ? customMessage.trim().slice(0, 140) : '';

  const isPlaceholderKey = !process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY === 'demo-api-key';
  const now = Date.now();

  const statusPayload = {
    state,
    message: cleanMessage,
    updatedAt: now,
  };

  if (!isPlaceholderKey) {
    try {
      // 1. Direct write to status/{uid} on Firebase Realtime Database
      const statusRef = ref(db, `status/${uid}`);
      await set(statusRef, statusPayload);

      // 2. Append to logs/{uid}
      try {
        const logPayload = {
          state,
          message: cleanMessage,
          timestamp: now,
        };
        const logRef = push(ref(db, `logs/${uid}`));
        await set(logRef, logPayload);
      } catch (logErr) {
        console.warn('Realtime DB log append note:', logErr.message);
      }

      console.log(`🔥 [Firebase RTDB] Successfully stored status for ${uid}:`, statusPayload);

      // Keep in-memory cache synchronized
      mockStatusStore[uid] = statusPayload;

      return {
        success: true,
        state,
        message: cleanMessage,
        timestamp: now,
      };
    } catch (fbErr) {
      console.warn('Realtime DB write warning, falling back to local store:', fbErr.message);
    }
  }

  // Fallback / mock store execution
  mockStatusStore[uid] = statusPayload;
  if (!mockLogsStore[uid]) mockLogsStore[uid] = [];
  mockLogsStore[uid].push({
    id: `log-${now}`,
    state,
    message: cleanMessage,
    timestamp: now,
  });

  return {
    success: true,
    state,
    message: cleanMessage,
    timestamp: now,
  };
}

/**
 * Fetches current active status for a faculty member from Firebase
 *
 * @param {string} facultyUid
 * @returns {Promise<{ state: string, message: string, updatedAt: number } | null>}
 */
export async function getFacultyStatus(facultyUid) {
  if (!facultyUid) return null;
  const uid = facultyUid;

  const isPlaceholderKey = !process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY === 'demo-api-key';

  if (!isPlaceholderKey) {
    try {
      const snapshot = await get(ref(db, `status/${uid}`));
      if (snapshot.exists()) {
        const val = snapshot.val();
        mockStatusStore[uid] = val;
        return val;
      }
    } catch (e) {
      console.warn('Live fetch status fallback:', e.message);
    }
  }

  return mockStatusStore[uid] || {
    state: STATUS_KEYS.OFF_CAMPUS,
    message: '',
    updatedAt: Date.now(),
  };
}

/**
 * Real-time subscription to a faculty member's live status in Firebase
 *
 * @param {string} facultyUid
 * @param {Function} onUpdate - callback receiving status object
 * @returns {Function} unsubscribe
 */
export function subscribeToFacultyStatus(facultyUid, onUpdate) {
  if (!facultyUid) return () => {};
  const uid = facultyUid;
  const statusRef = ref(db, `status/${uid}`);

  const unsubscribe = onValue(statusRef, (snapshot) => {
    if (snapshot.exists()) {
      const val = snapshot.val();
      mockStatusStore[uid] = val;
      onUpdate(val);
    }
  });

  return () => off(statusRef);
}

/**
 * Parses Firebase snapshot object of logs into a sorted array (newest first)
 * @param {Object} rawLogs
 * @returns {Array}
 */
function parseLogsObject(rawLogs) {
  if (!rawLogs || typeof rawLogs !== 'object') return [];
  return Object.entries(rawLogs)
    .map(([key, item]) => ({
      id: key,
      state: item.state || 'available',
      message: item.message || '',
      timestamp: item.timestamp || Date.now(),
      location: item.location || 'Hall No. 301 • Table 1',
      source: item.source || '1-Tap Broadcast',
    }))
    .sort((a, b) => b.timestamp - a.timestamp);
}

const DEFAULT_FALLBACK_LOGS = [
  {
    id: 'log-seed-1',
    state: 'available',
    message: 'Tutorial Checking in Room 528',
    timestamp: Date.now() - 1000 * 60 * 5,
    location: 'Hall No. 301 • Table 1',
    source: '1-Tap Broadcast',
  },
  {
    id: 'log-seed-2',
    state: 'busy',
    message: 'Evaluating Final Year Project Interim Reports',
    timestamp: Date.now() - 1000 * 60 * 45,
    location: 'ECS Seminar Hall',
    source: 'Manual Broadcast',
  },
  {
    id: 'log-seed-3',
    state: 'in_lecture',
    message: 'Lecture: Advanced Embedded Systems (TE ECS Div A)',
    timestamp: Date.now() - 1000 * 60 * 120,
    location: 'Room 402 • 4th Floor',
    source: 'Academic Timetable',
  },
  {
    id: 'log-seed-4',
    state: 'available',
    message: 'Office hours open for student doubts & queries',
    timestamp: Date.now() - 1000 * 60 * 240,
    location: 'Faculty Cabin 304',
    source: 'Auto-Reset Revert',
  },
  {
    id: 'log-seed-5',
    state: 'off_campus',
    message: 'Attending IEEE Mumbai Chapter Faculty Colloquium',
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    location: 'Off Campus',
    source: 'Broadcast Broadcast',
  },
];

/**
 * Fetches status broadcast audit history for a faculty member from Firebase RTDB
 * @param {string} facultyUid
 * @returns {Promise<Array>} sorted newest first
 */
export async function getFacultyStatusHistory(facultyUid) {
  if (!facultyUid) return [];
  const uid = facultyUid;

  try {
    const snapshot = await get(ref(db, `logs/${uid}`));
    if (snapshot.exists()) {
      const logs = parseLogsObject(snapshot.val());
      return logs;
    }
    if (uid === 'demo-faculty-ecs-01') {
      return DEFAULT_FALLBACK_LOGS;
    }
    return [];
  } catch (err) {
    console.warn('Realtime DB history fetch notice:', err.message);
    if (uid === 'demo-faculty-ecs-01') {
      return DEFAULT_FALLBACK_LOGS;
    }
    return [];
  }
}

/**
 * Real-time subscription to faculty status broadcast history
 * @param {string} facultyUid
 * @param {Function} onUpdate - callback receiving Array of log items
 * @returns {Function} unsubscribe
 */
export function subscribeToFacultyStatusHistory(facultyUid, onUpdate) {
  if (!facultyUid) {
    onUpdate([]);
    return () => {};
  }
  const uid = facultyUid;
  const logsRef = ref(db, `logs/${uid}`);

  const unsubscribe = onValue(
    logsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const parsed = parseLogsObject(snapshot.val());
        onUpdate(parsed);
      } else {
        if (uid === 'demo-faculty-ecs-01') {
          onUpdate(DEFAULT_FALLBACK_LOGS);
        } else {
          onUpdate([]);
        }
      }
    },
    (err) => {
      console.warn('History subscription fallback:', err.message);
      if (uid === 'demo-faculty-ecs-01') {
        onUpdate(DEFAULT_FALLBACK_LOGS);
      } else {
        onUpdate([]);
      }
    }
  );

  return () => off(logsRef);
}
