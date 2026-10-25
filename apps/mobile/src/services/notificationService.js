import { ref, set, remove, onValue, off } from 'firebase/database';
import { db } from './firebase';

/**
 * Subscribes to notify requests placed by a specific student.
 * Calls callback with a Set of faculty UIDs.
 */
export function subscribeToStudentNotifyRequests(studentUid, callback) {
  if (!studentUid) {
    callback(new Set());
    return () => {};
  }

  const notifyRootRef = ref(db, 'notifyRequests');
  const unsub = onValue(notifyRootRef, (snapshot) => {
    const data = snapshot.val() || {};
    const requestedFaculty = new Set();

    Object.entries(data).forEach(([facultyUid, studentMap]) => {
      if (studentMap && studentMap[studentUid]) {
        requestedFaculty.add(facultyUid);
      }
    });

    callback(requestedFaculty);
  }, () => {
    callback(new Set());
  });

  return () => {
    if (typeof unsub === 'function') unsub();
    else off(notifyRootRef);
  };
}

/**
 * Toggles a Notify When Free request for a student on a faculty member.
 */
export async function toggleNotifyWhenFree(facultyUid, studentUid, pushToken = 'expo-demo-token') {
  if (!facultyUid || !studentUid) return false;

  const targetRef = ref(db, `notifyRequests/${facultyUid}/${studentUid}`);
  try {
    const isCurrentlySet = await checkIsRequested(facultyUid, studentUid);
    if (isCurrentlySet) {
      await remove(targetRef);
      return false; // Cancelled
    } else {
      await set(targetRef, {
        studentUid,
        facultyUid,
        pushToken,
        createdAt: Date.now(),
      });
      return true; // Created
    }
  } catch (err) {
    console.warn('Toggle notify request note:', err.message);
    return false;
  }
}

async function checkIsRequested(facultyUid, studentUid) {
  try {
    const { get } = await import('firebase/database');
    const snap = await get(ref(db, `notifyRequests/${facultyUid}/${studentUid}`));
    return snap.exists();
  } catch {
    return false;
  }
}
