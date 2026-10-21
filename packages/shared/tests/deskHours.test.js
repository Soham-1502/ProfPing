/**
 * @file deskHours.test.js
 * Test suite for Section 9 Desk-Hour Computation Engine
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDailyDeskHours } from '../src/deskHours.js';
import { STATUS_KEYS } from '../src/constants.js';

test('Returns zero hours when log array is empty or null', () => {
  const result1 = calculateDailyDeskHours([], '2026-10-21');
  assert.equal(result1.deskHours, 0);
  assert.equal(result1.logCount, 0);

  const result2 = calculateDailyDeskHours(null, '2026-10-21');
  assert.equal(result2.deskHours, 0);
});

test('Correctly computes single continuous available interval within work hours', () => {
  const targetDate = new Date(2026, 9, 21); // Oct 21 2026
  const start = new Date(targetDate).setHours(9, 30, 0, 0); // 9:30 AM
  const end = new Date(targetDate).setHours(12, 30, 0, 0);   // 12:30 PM (3 hours)

  const logs = [
    { state: STATUS_KEYS.AVAILABLE, timestamp: start },
    { state: STATUS_KEYS.OFF_CAMPUS, timestamp: end },
  ];

  const result = calculateDailyDeskHours(logs, targetDate);
  assert.equal(result.deskHours, 3.0);
  assert.equal(result.stateDurationsHours[STATUS_KEYS.AVAILABLE], 3.0);
});

test('Clips intervals that start before or extend past working hours (8:30 AM to 5:30 PM)', () => {
  const targetDate = new Date(2026, 9, 21);
  const earlyMorning = new Date(targetDate).setHours(7, 0, 0, 0); // 7:00 AM (starts 1.5h before 8:30)
  const afterWork = new Date(targetDate).setHours(19, 0, 0, 0);   // 7:00 PM (ends 1.5h after 17:30)

  const logs = [
    { state: STATUS_KEYS.AVAILABLE, timestamp: earlyMorning },
    { state: STATUS_KEYS.OFF_CAMPUS, timestamp: afterWork },
  ];

  const result = calculateDailyDeskHours(logs, targetDate);
  // Full working day is 8:30 AM to 5:30 PM = 9.0 hours
  assert.equal(result.deskHours, 9.0);
});

test('Merges consecutive duplicate status logs without double counting', () => {
  const targetDate = new Date(2026, 9, 21);
  const t1 = new Date(targetDate).setHours(10, 0, 0, 0);
  const t2 = new Date(targetDate).setHours(11, 0, 0, 0); // Duplicate available
  const t3 = new Date(targetDate).setHours(12, 0, 0, 0); // Still available
  const t4 = new Date(targetDate).setHours(13, 0, 0, 0); // Switches to busy

  const logs = [
    { state: STATUS_KEYS.AVAILABLE, timestamp: t1 },
    { state: STATUS_KEYS.AVAILABLE, timestamp: t2 },
    { state: STATUS_KEYS.AVAILABLE, timestamp: t3 },
    { state: STATUS_KEYS.BUSY, timestamp: t4 },
  ];

  const result = calculateDailyDeskHours(logs, targetDate);
  // 10:00 AM to 1:00 PM available = 3 hours
  assert.equal(result.stateDurationsHours[STATUS_KEYS.AVAILABLE], 3.0);
});

test('Correctly sorts out-of-order server timestamps', () => {
  const targetDate = new Date(2026, 9, 21);
  const t1 = new Date(targetDate).setHours(9, 0, 0, 0);
  const t2 = new Date(targetDate).setHours(10, 0, 0, 0);
  const t3 = new Date(targetDate).setHours(12, 0, 0, 0);

  // Delivered out of order
  const logs = [
    { state: STATUS_KEYS.IN_LECTURE, timestamp: t2 },
    { state: STATUS_KEYS.AVAILABLE, timestamp: t1 },
    { state: STATUS_KEYS.OFF_CAMPUS, timestamp: t3 },
  ];

  const result = calculateDailyDeskHours(logs, targetDate);
  // 9:00 to 10:00 available = 1 hr
  // 10:00 to 12:00 in_lecture = 2 hrs
  assert.equal(result.stateDurationsHours[STATUS_KEYS.AVAILABLE], 1.0);
  assert.equal(result.stateDurationsHours[STATUS_KEYS.IN_LECTURE], 2.0);
});
