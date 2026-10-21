/**
 * @file firebase.js (Mobile)
 * Firebase client initialization for Expo Mobile App
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-profping.firebaseapp.com',
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || 'https://demo-profping-default-rtdb.firebaseio.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'demo-profping',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-profping.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:1234567890:android:abcdef',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getDatabase(app);

// Connect to emulators if configured
if (process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  try {
    // 10.0.2.2 is Android emulator host loopback, localhost works for iOS / web
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectDatabaseEmulator(db, 'localhost', 9000);
  } catch (err) {
    console.warn('Firebase emulator connection note:', err.message);
  }
}

export { app, auth, db };
