/**
 * @file dashboardService.js
 * Admin Web telemetry and analytics data provider (Phase 6 & 7).
 * Connects to Firebase Realtime Database or returns structured mock data with desk-hour computations.
 */

import { ref, onValue, off, get } from 'firebase/database';
import { db } from './firebase';
import { STATUS_KEYS, STATUS_CONFIG, calculateDailyDeskHours, DEPARTMENTS } from '@profping/shared';

// Comprehensive mock faculty dataset across all academic departments
const ALL_FACULTY_DATA = [
  {
    uid: 'demo-faculty-cmpn-01',
    name: 'Prof. Snehal Kulkarni',
    department: 'CMPN',
    designation: 'Assistant Professor',
    email: 'faculty.snehal@sfit.ac.in',
    status: {
      state: STATUS_KEYS.AVAILABLE,
      message: 'Available in Lab 304',
      updatedAt: Date.now() - 1000 * 60 * 15,
    },
    sampleLogs: [
      { state: STATUS_KEYS.AVAILABLE, timestamp: new Date().setHours(8, 30, 0, 0) },
      { state: STATUS_KEYS.IN_LECTURE, timestamp: new Date().setHours(10, 30, 0, 0) },
      { state: STATUS_KEYS.AVAILABLE, timestamp: new Date().setHours(12, 30, 0, 0) },
      { state: STATUS_KEYS.BUSY, timestamp: new Date().setHours(15, 0, 0, 0) },
      { state: STATUS_KEYS.AVAILABLE, timestamp: new Date().setHours(16, 0, 0, 0) },
    ],
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
    sampleLogs: [
      { state: STATUS_KEYS.AVAILABLE, timestamp: new Date().setHours(9, 0, 0, 0) },
      { state: STATUS_KEYS.IN_LECTURE, timestamp: new Date().setHours(10, 30, 0, 0) },
      { state: STATUS_KEYS.BUSY, timestamp: new Date().setHours(13, 0, 0, 0) },
      { state: STATUS_KEYS.AVAILABLE, timestamp: new Date().setHours(14, 30, 0, 0) },
    ],
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
    sampleLogs: [
      { state: STATUS_KEYS.AVAILABLE, timestamp: new Date().setHours(8, 30, 0, 0) },
      { state: STATUS_KEYS.BUSY, timestamp: new Date().setHours(11, 0, 0, 0) },
      { state: STATUS_KEYS.AVAILABLE, timestamp: new Date().setHours(14, 0, 0, 0) },
    ],
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
    sampleLogs: [
      { state: STATUS_KEYS.AVAILABLE, timestamp: new Date().setHours(9, 0, 0, 0) },
      { state: STATUS_KEYS.IN_LECTURE, timestamp: new Date().setHours(11, 30, 0, 0) },
      { state: STATUS_KEYS.AVAILABLE, timestamp: new Date().setHours(13, 30, 0, 0) },
    ],
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
    sampleLogs: [
      { state: STATUS_KEYS.AVAILABLE, timestamp: new Date().setHours(8, 30, 0, 0) },
      { state: STATUS_KEYS.BUSY, timestamp: new Date().setHours(10, 0, 0, 0) },
    ],
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
    sampleLogs: [
      { state: STATUS_KEYS.OFF_CAMPUS, timestamp: new Date().setHours(8, 30, 0, 0) },
    ],
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
    sampleLogs: [
      { state: STATUS_KEYS.AVAILABLE, timestamp: new Date().setHours(9, 0, 0, 0) },
      { state: STATUS_KEYS.IN_LECTURE, timestamp: new Date().setHours(11, 0, 0, 0) },
    ],
  },
];

/**
 * Computes desk hours for all faculty in list using Section 9 algorithm
 */
export function enrichWithDeskHours(facultyList) {
  return facultyList.map((faculty) => {
    const logs = faculty.sampleLogs || [];
    const telemetry = calculateDailyDeskHours(logs, new Date());
    return {
      ...faculty,
      deskHours: telemetry.deskHours,
      stateDurations: telemetry.stateDurationsHours,
      compliance: telemetry.deskHours >= 3.0 ? 'COMPLIANT' : 'BELOW_TARGET',
    };
  });
}

/**
 * Returns faculty list scoped by department (for HOD) or campus-wide (for Principal)
 *
 * @param {string | null} department - Department code to scope by, or null for all
 * @returns {Array} Enriched faculty array
 */
export function getScopedFaculty(department = null) {
  const filtered = department
    ? ALL_FACULTY_DATA.filter((f) => f.department === department)
    : ALL_FACULTY_DATA;

  return enrichWithDeskHours(filtered);
}
