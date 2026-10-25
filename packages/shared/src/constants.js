/**
 * @file constants.js
 * Shared constants for ProfPing (Roles, Statuses, Departments, Work Hours)
 */

export const ROLES = Object.freeze({
  STUDENT: 'student',
  FACULTY: 'faculty',
  HOD: 'hod',
  PRINCIPAL: 'principal',
});

export const STATUS_KEYS = Object.freeze({
  AVAILABLE: 'available',
  BUSY: 'busy',
  IN_LECTURE: 'in_lecture',
  OFF_CAMPUS: 'off_campus',
});

export const STATUS_CONFIG = Object.freeze({
  [STATUS_KEYS.AVAILABLE]: {
    key: STATUS_KEYS.AVAILABLE,
    label: 'Available',
    color: '#10B981', // Emerald green
    bgColor: '#D1FAE5',
    borderColor: '#059669',
    description: 'At desk and available for consultation',
    defaultMessage: 'Available in cabin',
  },
  [STATUS_KEYS.BUSY]: {
    key: STATUS_KEYS.BUSY,
    label: 'Busy',
    color: '#EF4444', // Red
    bgColor: '#FEE2E2',
    borderColor: '#DC2626',
    description: 'Engaged in meeting / evaluation',
    defaultMessage: 'In a meeting',
  },
  [STATUS_KEYS.IN_LECTURE]: {
    key: STATUS_KEYS.IN_LECTURE,
    label: 'In Lecture',
    color: '#3B82F6', // Blue
    bgColor: '#DBEAFE',
    borderColor: '#2563EB',
    description: 'Conducting class or practical lab',
    defaultMessage: 'Taking lecture / lab',
  },
  [STATUS_KEYS.OFF_CAMPUS]: {
    key: STATUS_KEYS.OFF_CAMPUS,
    label: 'Off Campus',
    color: '#6B7280', // Gray
    bgColor: '#F3F4F6',
    borderColor: '#4B5563',
    description: 'Out of campus / on leave',
    defaultMessage: 'Off campus today',
  },
});

export const DEPARTMENTS = Object.freeze([
  { id: 'CMPN', name: 'Computer Engineering' },
  { id: 'INFT', name: 'Information Technology' },
  { id: 'EXTC', name: 'Electronics & Telecommunication' },
  { id: 'ELEC', name: 'Electrical Engineering' },
  { id: 'MECH', name: 'Mechanical Engineering' },
  { id: 'ASH', name: 'Applied Science & Humanities' },
]);

export const INSTITUTION = Object.freeze({
  EMAIL_DOMAIN: '@sfit.ac.in',
  // Standard institution hours: 8:30 AM to 5:30 PM
  WORK_DAY_START_HOUR: 8,
  WORK_DAY_START_MINUTE: 30,
  WORK_DAY_END_HOUR: 17,
  WORK_DAY_END_MINUTE: 30,
});

export const DEFAULT_INSTITUTION_SETTINGS = Object.freeze({
  workStart: '08:30',
  workEnd: '17:30',
  deskTargetHours: 3.0,
  resetTime: '17:01',
  resetEnabled: true,
});

