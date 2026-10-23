import React, { createContext, useContext, useState, useEffect } from 'react';
import safeStorage from '../services/safeStorage';
import { useAuth } from './AuthContext';
import {
  subscribeToFacultyStatus,
  subscribeToFacultyStatusHistory,
  broadcastStatus,
  getCachedFacultyStatus,
} from '../services/statusService';

export const TIME_PRESETS = [
  { id: '15m', label: '15m', minutes: 15 },
  { id: '30m', label: '30m', minutes: 30 },
  { id: '1h', label: '1h', minutes: 60 },
  { id: 'custom', label: 'Custom', minutes: 120 },
];

const FacultyContext = createContext({
  selectedStatusId: 'busy',
  setSelectedStatusId: () => {},
  customNote: '',
  setCustomNote: () => {},
  lastUpdatedTime: Date.now(),
  lastUpdatedText: 'Just now',
  statusLoaded: false,
  logs: [],
  logsLoaded: false,
  statusCount: 0,
  broadcastStatusToFirebase: async () => {},
  autoResetEnabled: false,
  setAutoResetEnabled: () => {},
  selectedPreset: '1h',
  setSelectedPreset: () => {},
  customRevertDate: null,
  setCustomRevertDate: () => {},
  revertTime: '4:00 PM',
});

const STORAGE_KEY_AUTO_RESET = '@profping_faculty_auto_reset';
const STORAGE_KEY_PRESET = '@profping_faculty_preset';
const STORAGE_KEY_STATUS = '@profping_faculty_status_state';
const STORAGE_KEY_NOTE = '@profping_faculty_status_note';
const STORAGE_KEY_TIME = '@profping_faculty_status_time';

export function FacultyProvider({ children }) {
  const { user } = useAuth();
  const facultyUid = user?.uid || 'demo-faculty-ecs-01';

  // Instant synchronous cache read - never displays outdated mock initializers
  const initialCache = getCachedFacultyStatus(facultyUid);

  const [selectedStatusId, setSelectedStatusId] = useState(initialCache?.state || 'busy');
  const [customNote, setCustomNote] = useState(initialCache?.message || 'Tutorial Checking in Room 528');
  const [lastUpdatedTime, setLastUpdatedTime] = useState(initialCache?.updatedAt || Date.now());
  const [statusLoaded, setStatusLoaded] = useState(false);

  const [logs, setLogs] = useState([]);
  const [logsLoaded, setLogsLoaded] = useState(false);

  const [autoResetEnabled, setAutoResetEnabledState] = useState(false);
  const [selectedPreset, setSelectedPresetState] = useState('1h');
  const [customRevertDate, setCustomRevertDate] = useState(null);
  const [revertTime, setRevertTime] = useState('4:00 PM');

  // Compute friendly relative time
  const [lastUpdatedText, setLastUpdatedText] = useState('Just now');
  useEffect(() => {
    const updateTimeText = () => {
      const diffSec = Math.floor((Date.now() - lastUpdatedTime) / 1000);
      if (diffSec < 60) {
        setLastUpdatedText('Just now');
      } else if (diffSec < 3600) {
        setLastUpdatedText(`${Math.floor(diffSec / 60)}m ago`);
      } else {
        setLastUpdatedText(`${Math.floor(diffSec / 3600)}h ago`);
      }
    };
    updateTimeText();
    const interval = setInterval(updateTimeText, 30000);
    return () => clearInterval(interval);
  }, [lastUpdatedTime]);

  // Load persisted user preferences and cached status on mount
  useEffect(() => {
    async function loadPersistedSettings() {
      try {
        const storedReset = await safeStorage.getItem(STORAGE_KEY_AUTO_RESET);
        if (storedReset !== null) {
          setAutoResetEnabledState(JSON.parse(storedReset));
        }
        const storedPreset = await safeStorage.getItem(STORAGE_KEY_PRESET);
        if (storedPreset !== null) {
          setSelectedPresetState(storedPreset);
        }
        const storedStatus = await safeStorage.getItem(STORAGE_KEY_STATUS);
        if (storedStatus) {
          setSelectedStatusId(storedStatus);
        }
        const storedNote = await safeStorage.getItem(STORAGE_KEY_NOTE);
        if (storedNote !== null) {
          setCustomNote(storedNote);
        }
        const storedTime = await safeStorage.getItem(STORAGE_KEY_TIME);
        if (storedTime) {
          setLastUpdatedTime(Number(storedTime));
        }
      } catch (_) {
        // Fall back gracefully to cache and state
      }
    }
    loadPersistedSettings();
  }, []);

  // Real-time live status subscription from Firebase RTDB
  useEffect(() => {
    let unsubStatus = null;
    try {
      unsubStatus = subscribeToFacultyStatus(facultyUid, (val) => {
        if (val) {
          if (val.state) {
            setSelectedStatusId(val.state);
            safeStorage.setItem(STORAGE_KEY_STATUS, val.state);
          }
          if (typeof val.message === 'string') {
            setCustomNote(val.message);
            safeStorage.setItem(STORAGE_KEY_NOTE, val.message);
          }
          if (val.updatedAt) {
            setLastUpdatedTime(val.updatedAt);
            safeStorage.setItem(STORAGE_KEY_TIME, String(val.updatedAt));
          }
          setStatusLoaded(true);
        }
      });
    } catch (_) {}

    return () => {
      if (typeof unsubStatus === 'function') unsubStatus();
    };
  }, [facultyUid]);

  // Real-time live history logs subscription from Firebase RTDB
  useEffect(() => {
    let unsubLogs = null;
    try {
      unsubLogs = subscribeToFacultyStatusHistory(facultyUid, (liveLogs) => {
        if (Array.isArray(liveLogs)) {
          setLogs(liveLogs);
          setLogsLoaded(true);
        }
      });
    } catch (_) {}

    return () => {
      if (typeof unsubLogs === 'function') unsubLogs();
    };
  }, [facultyUid]);

  // Update autoResetEnabled and persist
  const setAutoResetEnabled = (val) => {
    setAutoResetEnabledState(val);
    safeStorage.setItem(STORAGE_KEY_AUTO_RESET, JSON.stringify(val));
  };

  // Update preset and persist
  const setSelectedPreset = (val) => {
    setSelectedPresetState(val);
    safeStorage.setItem(STORAGE_KEY_PRESET, val);
  };

  // Dynamic revert time computation
  useEffect(() => {
    let future;
    if (selectedPreset === 'custom' && customRevertDate) {
      future = customRevertDate;
    } else {
      const presetObj = TIME_PRESETS.find((p) => p.id === selectedPreset);
      const mins = presetObj ? presetObj.minutes : 60;
      future = new Date(Date.now() + mins * 60 * 1000);
    }
    const formatted = future.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    setRevertTime(formatted);
  }, [selectedPreset, customRevertDate]);

  // Atomic broadcast function that updates local state instantly and syncs to Firebase
  const broadcastStatusToFirebase = async (backendState, message) => {
    // 1. Optimistic instant local update
    setSelectedStatusId(backendState);
    setCustomNote(message);
    const now = Date.now();
    setLastUpdatedTime(now);
    safeStorage.setItem(STORAGE_KEY_STATUS, backendState);
    safeStorage.setItem(STORAGE_KEY_NOTE, message);
    safeStorage.setItem(STORAGE_KEY_TIME, String(now));

    // 2. Network broadcast to Firebase RTDB
    return await broadcastStatus(facultyUid, backendState, message);
  };

  return (
    <FacultyContext.Provider
      value={{
        selectedStatusId,
        setSelectedStatusId,
        customNote,
        setCustomNote,
        lastUpdatedTime,
        lastUpdatedText,
        statusLoaded,
        logs,
        logsLoaded,
        statusCount: logs.length,
        broadcastStatusToFirebase,
        autoResetEnabled,
        setAutoResetEnabled,
        selectedPreset,
        setSelectedPreset,
        customRevertDate,
        setCustomRevertDate,
        revertTime,
      }}
    >
      {children}
    </FacultyContext.Provider>
  );
}

export const useFaculty = () => useContext(FacultyContext);
