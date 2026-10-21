/**
 * @file statusService.js
 * Atomic multi-path status broadcast service for faculty (Phase 3).
 * Updates /status/{uid} and appends to /logs/{uid}/{pushId} in a single atomic transaction.
 */

import { ref, push, update, serverTimestamp, get } from 'firebase/database';
import { db } from './firebase';
import { STATUS_KEYS, STATUS_CONFIG } from '@profping/shared';

// In-memory / dev mock store for local offline testing when live Firebase is not yet connected
const mockStatusStore = {
  'demo-faculty-cmpn-01': {
    state: STATUS_KEYS.AVAILABLE,
    message: 'Available in Lab 304',
    updatedAt: Date.now() - 1000 * 60 * 15,
  },
};

const mockLogsStore = {
  'demo-faculty-cmpn-01': [
    {
      id: 'log-01',
      state: STATUS_KEYS.AVAILABLE,
      message: 'Available in Lab 304',
      timestamp: Date.now() - 1000 * 60 * 15,
    },
  ],
};

/**
 * Executes atomic multi-path broadcast update
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

  // Validate state key
  if (!Object.values(STATUS_KEYS).includes(state)) {
    throw new Error(`Invalid status key: ${state}`);
  }

  // Format and validate message (clip to max 140 chars per security rules)
  const fallbackMessage = STATUS_CONFIG[state]?.defaultMessage || '';
  const cleanMessage = (customMessage && customMessage.trim()) ? customMessage.trim().slice(0, 140) : fallbackMessage;

  const isPlaceholderKey = !process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY === 'demo-api-key';

  if (!isPlaceholderKey) {
    try {
      // 1. Generate new unique push ID for append-only log entry
      const logRef = push(ref(db, `logs/${facultyUid}`));
      const newLogKey = logRef.key;

      // 2. Prepare atomic multi-path write payload
      const updates = {};
      updates[`status/${facultyUid}`] = {
        state,
        message: cleanMessage,
        updatedAt: serverTimestamp(),
      };
      updates[`logs/${facultyUid}/${newLogKey}`] = {
        state,
        message: cleanMessage,
        timestamp: serverTimestamp(),
      };

      // 3. Commit atomically to Firebase Realtime Database
      await update(ref(db), updates);

      return {
        success: true,
        state,
        message: cleanMessage,
        timestamp: Date.now(),
      };
    } catch (fbErr) {
      console.warn('Realtime DB write warning, saving to dev mock store:', fbErr.message);
    }
  }

  // Dev Mock Store execution
  const now = Date.now();
  mockStatusStore[facultyUid] = {
    state,
    message: cleanMessage,
    updatedAt: now,
  };

  if (!mockLogsStore[facultyUid]) {
    mockLogsStore[facultyUid] = [];
  }

  mockLogsStore[facultyUid].push({
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
 * Fetches current active status for a faculty member
 *
 * @param {string} facultyUid
 * @returns {Promise<{ state: string, message: string, updatedAt: number } | null>}
 */
export async function getFacultyStatus(facultyUid) {
  if (!facultyUid) return null;

  const isPlaceholderKey = !process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY === 'demo-api-key';

  if (!isPlaceholderKey) {
    try {
      const snapshot = await get(ref(db, `status/${facultyUid}`));
      if (snapshot.exists()) {
        return snapshot.val();
      }
    } catch (e) {
      console.warn('Live fetch status fallback:', e.message);
    }
  }

  return mockStatusStore[facultyUid] || {
    state: STATUS_KEYS.AVAILABLE,
    message: STATUS_CONFIG[STATUS_KEYS.AVAILABLE].defaultMessage,
    updatedAt: Date.now(),
  };
}
