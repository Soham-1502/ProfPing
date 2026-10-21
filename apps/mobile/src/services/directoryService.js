/**
 * @file directoryService.js
 * Real-time student directory service (Phase 4).
 * Joins /faculty/* with live /status/* subscriptions over WebSockets.
 */

import { ref, onValue, off } from 'firebase/database';
import { db } from './firebase';
import { STATUS_KEYS, STATUS_CONFIG } from '@profping/shared';

const MOCK_DIRECTORY = [
  {
    uid: 'demo-faculty-cmpn-01',
    name: 'Prof. Snehal Kulkarni',
    department: 'CMPN',
    designation: 'Assistant Professor',
    email: 'faculty.snehal@sfit.ac.in',
    status: {
      state: STATUS_KEYS.AVAILABLE,
      message: 'Available in Lab 304',
      updatedAt: Date.now() - 1000 * 60 * 12,
    },
  },
  {
    uid: 'demo-faculty-cmpn-02',
    name: 'Dr. Rahul Joshi',
    department: 'CMPN',
    designation: 'Associate Professor',
    email: 'faculty.rahul@sfit.ac.in',
    status: {
      state: STATUS_KEYS.IN_LECTURE,
      message: 'Delivering Operating Systems (TE CMPN A)',
      updatedAt: Date.now() - 1000 * 60 * 45,
    },
  },
  {
    uid: 'demo-faculty-cmpn-03',
    name: 'Dr. Kavita Sonawane',
    department: 'CMPN',
    designation: 'HOD Computer Engineering',
    email: 'hod.cmpn@sfit.ac.in',
    status: {
      state: STATUS_KEYS.BUSY,
      message: 'Academic Council Committee Meeting',
      updatedAt: Date.now() - 1000 * 60 * 20,
    },
  },
  {
    uid: 'demo-faculty-inft-01',
    name: 'Prof. Priya Shah',
    department: 'INFT',
    designation: 'Assistant Professor',
    email: 'faculty.priya@sfit.ac.in',
    status: {
      state: STATUS_KEYS.AVAILABLE,
      message: 'Available in Cabin 408',
      updatedAt: Date.now() - 1000 * 60 * 5,
    },
  },
  {
    uid: 'demo-faculty-inft-02',
    name: 'Dr. Joanne Gomes',
    department: 'INFT',
    designation: 'HOD Information Technology',
    email: 'hod.inft@sfit.ac.in',
    status: {
      state: STATUS_KEYS.BUSY,
      message: 'NBA Accreditation Review',
      updatedAt: Date.now() - 1000 * 60 * 30,
    },
  },
  {
    uid: 'demo-faculty-extc-01',
    name: 'Dr. Amit Patel',
    department: 'EXTC',
    designation: 'Professor & Dean R&D',
    email: 'faculty.amit@sfit.ac.in',
    status: {
      state: STATUS_KEYS.OFF_CAMPUS,
      message: 'Attending University Syndicate meeting',
      updatedAt: Date.now() - 1000 * 60 * 180,
    },
  },
  {
    uid: 'demo-faculty-elec-01',
    name: 'Prof. Rajesh Kadam',
    department: 'ELEC',
    designation: 'Assistant Professor',
    email: 'faculty.rajesh@sfit.ac.in',
    status: {
      state: STATUS_KEYS.IN_LECTURE,
      message: 'Electrical Machines Lab',
      updatedAt: Date.now() - 1000 * 60 * 15,
    },
  },
];

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
        const list = Object.keys(facultyCache).map((uid) => {
          const fac = facultyCache[uid] || {};
          const st = statusCache[uid] || {
            state: STATUS_KEYS.OFF_CAMPUS,
            message: STATUS_CONFIG[STATUS_KEYS.OFF_CAMPUS].defaultMessage,
            updatedAt: Date.now(),
          };
          return {
            uid,
            name: fac.name || 'Faculty Member',
            department: fac.department || 'CMPN',
            designation: fac.designation || 'Faculty',
            email: fac.email || '',
            status: st,
          };
        });
        onUpdate(list);
      };

      const unsubFaculty = onValue(facultyRef, (snapshot) => {
        if (snapshot.exists()) {
          facultyCache = snapshot.val() || {};
          computeJoinedList();
        }
      });

      const unsubStatus = onValue(statusRef, (snapshot) => {
        if (snapshot.exists()) {
          statusCache = snapshot.val() || {};
          computeJoinedList();
        }
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
