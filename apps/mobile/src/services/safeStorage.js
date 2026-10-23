/**
 * @file safeStorage.js
 * Resilient storage wrapper that falls back to in-memory caching
 * when native AsyncStorage modules are unavailable or not linked in Expo Go.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Persistent in-memory fallback cache across screen navigations
const memoryCache = new Map();

export const safeStorage = {
  /**
   * Safely retrieve a string value
   * @param {string} key
   * @returns {Promise<string|null>}
   */
  async getItem(key) {
    try {
      if (AsyncStorage && typeof AsyncStorage.getItem === 'function') {
        const val = await AsyncStorage.getItem(key);
        if (val !== null && val !== undefined) {
          memoryCache.set(key, val);
          return val;
        }
      }
    } catch (_) {
      // Native module is null or unavailable in Expo Go; fallback silently
    }
    return memoryCache.has(key) ? memoryCache.get(key) : null;
  },

  /**
   * Safely set a key-value string pair
   * @param {string} key
   * @param {string} value
   * @returns {Promise<void>}
   */
  async setItem(key, value) {
    const stringVal = String(value);
    memoryCache.set(key, stringVal);
    try {
      if (AsyncStorage && typeof AsyncStorage.setItem === 'function') {
        await AsyncStorage.setItem(key, stringVal);
      }
    } catch (_) {
      // Native module is null or unavailable; fallback to memory store
    }
  },

  /**
   * Safely remove a key
   * @param {string} key
   * @returns {Promise<void>}
   */
  async removeItem(key) {
    memoryCache.delete(key);
    try {
      if (AsyncStorage && typeof AsyncStorage.removeItem === 'function') {
        await AsyncStorage.removeItem(key);
      }
    } catch (_) {
      // Silently fallback
    }
  },

  /**
   * Safely clear all entries
   * @returns {Promise<void>}
   */
  async clear() {
    memoryCache.clear();
    try {
      if (AsyncStorage && typeof AsyncStorage.clear === 'function') {
        await AsyncStorage.clear();
      }
    } catch (_) {
      // Silently fallback
    }
  },
};

export default safeStorage;
