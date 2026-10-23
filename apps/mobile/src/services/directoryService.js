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
    uid: 'demo-faculty-ecs-01',
    name: 'Dr. Anjali Mehta',
    department: 'ECS',
    designation: 'Associate Professor • ECS Dept',
    cabin: 'Hall No. 301 • Table 1',
    email: 'anjali.mehta@sfit.ac.in',
    isVerified: true,
    photo: 'faculty-anjali.jpg',
    lastActive: '2 mins ago',
    deskNum: 'DESK 01',
    status: {
      state: STATUS_KEYS.AVAILABLE,
      message: 'Office hours open. Project review & guidance consult...',
      updatedAt: Date.now() - 1000 * 60 * 2,
    },
  },
  {
    uid: 'demo-faculty-ecs-02',
    name: 'Mr. Arjun Kulkarni',
    shortName: 'Prof. Arjun',
    department: 'ECS',
    designation: 'Assistant Professor • ECS Dept',
    cabin: 'Hall No. 301 • Table 2',
    email: 'faculty.arjun@sfit.ac.in',
    deskNum: 'DESK 02',
    deskStatus: 'Viva Duty',
    status: {
      state: STATUS_KEYS.BUSY,
      message: 'Conducting final year viva • Expected free at 2:00 PM',
      updatedAt: Date.now() - 1000 * 60 * 14,
    },
    queueCount: 5,
  },
  {
    uid: 'demo-faculty-cmpn-04',
    name: 'Prof. Rohan Patil',
    shortName: 'Prof. Patil',
    department: 'CMPN',
    deptTag: 'Comp Sci',
    designation: 'Associate Professor • Comp Sci',
    cabin: 'Hall No. 204 • Table 4',
    lectureRoom: 'Lecture Room 302',
    deskNum: 'DESK 03',
    deskStatus: 'Room 302',
    email: 'faculty.rohan@sfit.ac.in',
    status: {
      state: STATUS_KEYS.IN_LECTURE,
      message: 'CS304: Distributed Operating Systems (until 12:30 PM)',
      updatedAt: Date.now() - 1000 * 60 * 25,
    },
  },
  {
    uid: 'demo-faculty-robotics-01',
    name: 'Dr. Sunita Sharma',
    shortName: 'Dr. Sunita',
    department: 'Robotics',
    deptTag: 'Robotics',
    designation: 'Professor • Robotics Dept',
    cabin: 'Hall No. 301 • Table 3',
    email: 'faculty.sunita@sfit.ac.in',
    status: {
      state: STATUS_KEYS.IN_LECTURE,
      message: 'Robotics & Automation Lab (Room 402)',
      updatedAt: Date.now() - 1000 * 60 * 35,
    },
  },
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
