import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@profping_starred_faculty_v1';

/**
 * Loads the current student's starred faculty UIDs from local persistent storage.
 * Defaults to an empty Set (no mock faculty by default).
 * @returns {Promise<Set<string>>}
 */
export async function getStarredFacultyUids() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch (e) {
    return new Set();
  }
}

/**
 * Toggles a faculty UID in the starred list and persists the result.
 * @param {string} uid
 * @returns {Promise<Set<string>>} Updated Set of starred UIDs
 */
export async function toggleStarredFacultyUid(uid) {
  try {
    const current = await getStarredFacultyUids();
    if (current.has(uid)) {
      current.delete(uid);
    } else {
      current.add(uid);
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(current)));
    return new Set(current);
  } catch (e) {
    return new Set();
  }
}
