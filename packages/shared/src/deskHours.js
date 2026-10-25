/**
 * @file deskHours.js
 * Desk-hour computation engine based on Section 9 of Implementation Plan.
 * Calculates duration delta-t for faculty statuses clipped to working hours.
 */

import { STATUS_KEYS, INSTITUTION, DEFAULT_INSTITUTION_SETTINGS } from './constants.js';

/**
 * @typedef {Object} StatusLog
 * @property {string} state - The status state ('available' | 'busy' | 'in_lecture' | 'off_campus')
 * @property {number} timestamp - Epoch timestamp in milliseconds
 * @property {string} [message] - Optional status message
 */

function parseTime(timeStr, defaultHour, defaultMinute) {
  if (!timeStr || typeof timeStr !== 'string') return { hour: defaultHour, minute: defaultMinute };
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  return {
    hour: isNaN(h) ? defaultHour : h,
    minute: isNaN(m) ? defaultMinute : m,
  };
}

/**
 * Clips an interval [start, end] to a specific date's institution working hours window.
 *
 * @param {number} startMs - Interval start epoch ms
 * @param {number} endMs - Interval end epoch ms
 * @param {Date} dateObj - The reference date
 * @param {Object} [settings] - Institution settings with workStart and workEnd
 * @returns {number} Duration in milliseconds within working hours (0 if outside)
 */
function clipToWorkingHours(startMs, endMs, dateObj, settings = DEFAULT_INSTITUTION_SETTINGS) {
  if (startMs >= endMs) return 0;

  const startConfig = parseTime(settings?.workStart, INSTITUTION.WORK_DAY_START_HOUR, INSTITUTION.WORK_DAY_START_MINUTE);
  const endConfig = parseTime(settings?.workEnd, INSTITUTION.WORK_DAY_END_HOUR, INSTITUTION.WORK_DAY_END_MINUTE);

  const windowStart = new Date(dateObj);
  windowStart.setHours(startConfig.hour, startConfig.minute, 0, 0);

  const windowEnd = new Date(dateObj);
  windowEnd.setHours(endConfig.hour, endConfig.minute, 0, 0);

  const effectiveStart = Math.max(startMs, windowStart.getTime());
  const effectiveEnd = Math.min(endMs, windowEnd.getTime());

  if (effectiveStart < effectiveEnd) {
    return effectiveEnd - effectiveStart;
  }
  return 0;
}

/**
 * Calculates desk hours and state durations for a single day.
 *
 * @param {StatusLog[]} logs - Raw status logs for the faculty member
 * @param {string | Date} targetDate - Date to compute (YYYY-MM-DD or Date object)
 * @param {Object} [options]
 * @param {number} [options.currentTimeMs] - Override for current time (used when computing for today)
 * @param {Object} [options.settings] - Institutional settings (workStart, workEnd, deskTargetHours)
 * @returns {{ deskHours: number, stateDurationsHours: Record<string, number>, logCount: number }}
 */
export function calculateDailyDeskHours(logs, targetDate, options = {}) {
  const settings = options.settings || DEFAULT_INSTITUTION_SETTINGS;
  const target = new Date(targetDate);
  const startOfDay = new Date(target);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(target);
  endOfDay.setHours(23, 59, 59, 999);

  const endConfig = parseTime(settings?.workEnd, INSTITUTION.WORK_DAY_END_HOUR, INSTITUTION.WORK_DAY_END_MINUTE);
  const defaultWorkEnd = new Date(target);
  defaultWorkEnd.setHours(endConfig.hour, endConfig.minute, 0, 0);

  const nowMs = options.currentTimeMs || Date.now();
  const isToday = new Date().toDateString() === target.toDateString();

  const stateDurationsMs = {
    [STATUS_KEYS.AVAILABLE]: 0,
    [STATUS_KEYS.BUSY]: 0,
    [STATUS_KEYS.IN_LECTURE]: 0,
    [STATUS_KEYS.OFF_CAMPUS]: 0,
  };

  if (!logs || !Array.isArray(logs) || logs.length === 0) {
    return {
      deskHours: 0,
      stateDurationsHours: {
        [STATUS_KEYS.AVAILABLE]: 0,
        [STATUS_KEYS.BUSY]: 0,
        [STATUS_KEYS.IN_LECTURE]: 0,
        [STATUS_KEYS.OFF_CAMPUS]: 0,
      },
      logCount: 0,
    };
  }

  // 1. Sort logs by timestamp ascending
  const sorted = [...logs]
    .filter((l) => l && typeof l.timestamp === 'number')
    .sort((a, b) => a.timestamp - b.timestamp);

  // 2. Filter logs relevant to targetDate (including last log prior to day start if any)
  const priorLogs = sorted.filter((l) => l.timestamp < startOfDay.getTime());
  const dayLogs = sorted.filter((l) => l.timestamp >= startOfDay.getTime() && l.timestamp <= endOfDay.getTime());

  // Effective logs starting from beginning of day
  const effectiveDayLogs = [];
  if (priorLogs.length > 0 && (dayLogs.length === 0 || dayLogs[0].timestamp > startOfDay.getTime())) {
    const carryOver = priorLogs[priorLogs.length - 1];
    effectiveDayLogs.push({
      ...carryOver,
      timestamp: startOfDay.getTime(),
    });
  }
  effectiveDayLogs.push(...dayLogs);

  // 3. Deduplicate / merge consecutive entries with same state
  const deduplicated = [];
  for (const entry of effectiveDayLogs) {
    if (deduplicated.length === 0) {
      deduplicated.push(entry);
    } else {
      const prev = deduplicated[deduplicated.length - 1];
      if (prev.state !== entry.state) {
        deduplicated.push(entry);
      }
    }
  }

  if (deduplicated.length === 0) {
    return {
      deskHours: 0,
      stateDurationsHours: {
        [STATUS_KEYS.AVAILABLE]: 0,
        [STATUS_KEYS.BUSY]: 0,
        [STATUS_KEYS.IN_LECTURE]: 0,
        [STATUS_KEYS.OFF_CAMPUS]: 0,
      },
      logCount: 0,
    };
  }

  // 4. Compute intervals Δt = t_end - t_start clipped to working hours
  for (let i = 0; i < deduplicated.length; i++) {
    const current = deduplicated[i];
    let intervalEnd;

    if (i < deduplicated.length - 1) {
      intervalEnd = deduplicated[i + 1].timestamp;
    } else {
      // Last entry of the day
      if (isToday) {
        intervalEnd = Math.min(nowMs, defaultWorkEnd.getTime());
      } else {
        intervalEnd = defaultWorkEnd.getTime();
      }
    }

    const durationMs = clipToWorkingHours(current.timestamp, intervalEnd, target, settings);
    if (stateDurationsMs[current.state] !== undefined) {
      stateDurationsMs[current.state] += durationMs;
    }
  }

  const msToHours = (ms) => Math.round((ms / (1000 * 60 * 60)) * 100) / 100;

  const stateDurationsHours = {
    [STATUS_KEYS.AVAILABLE]: msToHours(stateDurationsMs[STATUS_KEYS.AVAILABLE]),
    [STATUS_KEYS.BUSY]: msToHours(stateDurationsMs[STATUS_KEYS.BUSY]),
    [STATUS_KEYS.IN_LECTURE]: msToHours(stateDurationsMs[STATUS_KEYS.IN_LECTURE]),
    [STATUS_KEYS.OFF_CAMPUS]: msToHours(stateDurationsMs[STATUS_KEYS.OFF_CAMPUS]),
  };

  return {
    deskHours: stateDurationsHours[STATUS_KEYS.AVAILABLE],
    stateDurationsHours,
    logCount: deduplicated.length,
  };
}
