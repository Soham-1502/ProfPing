import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { STATUS_CONFIG, STATUS_KEYS } from '@profping/shared';
import { broadcastStatus, getFacultyStatus } from '../../src/services/statusService';

const QUICK_NOTES = [
  'Available in cabin',
  'Lab 304 (Practical session)',
  'Lecture Hall 202',
  'Faculty meeting in progress',
  'Project evaluation',
  'Off campus today',
];

export default function FacultyHomeScreen() {
  const { user, role, department, logout } = useAuth();
  const router = useRouter();

  const [currentStatus, setCurrentStatus] = useState(STATUS_KEYS.AVAILABLE);
  const [currentMessage, setCurrentMessage] = useState('Available in cabin');
  const [customNote, setCustomNote] = useState('');
  const [lastUpdated, setLastUpdated] = useState(Date.now());
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Load existing status on mount
  useEffect(() => {
    async function loadStatus() {
      if (!user?.uid) return;
      const res = await getFacultyStatus(user.uid);
      if (res) {
        setCurrentStatus(res.state || STATUS_KEYS.AVAILABLE);
        setCurrentMessage(res.message || STATUS_CONFIG[res.state]?.defaultMessage || '');
        setLastUpdated(res.updatedAt || Date.now());
      }
    }
    loadStatus();
  }, [user?.uid]);

  const handleStatusTap = async (statusKey) => {
    if (!user?.uid) return;
    setBroadcasting(true);
    setBroadcastSuccess(false);

    try {
      // Use custom note if typed, otherwise smart default for that status
      const messageToBroadcast = customNote.trim() || STATUS_CONFIG[statusKey].defaultMessage;

      const res = await broadcastStatus(user.uid, statusKey, messageToBroadcast);
      if (res.success) {
        setCurrentStatus(statusKey);
        setCurrentMessage(res.message);
        setLastUpdated(res.timestamp);
        setBroadcastSuccess(true);
        setCustomNote(''); // clear note input after successful broadcast
      }
    } catch (err) {
      console.error('Broadcast failed:', err);
      Alert.alert('Broadcast Error', 'Failed to update status. Please try again.');
    } finally {
      setBroadcasting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const activeCfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG[STATUS_KEYS.AVAILABLE];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.profileBadge}>
          <Text style={styles.profileInitial}>
            {(user?.displayName || user?.email || 'F')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileMeta}>
          <Text style={styles.name}>{user?.displayName || user?.email?.split('@')[0]}</Text>
          <Text style={styles.dept}>
            Faculty • Department of {department || 'CMPN'}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Live Active Status Hero Banner */}
      <View style={[styles.activeStatusCard, { borderColor: activeCfg.borderColor }]}>
        <View style={styles.activeTopRow}>
          <View style={styles.liveIndicator}>
            <View style={[styles.pulseDot, { backgroundColor: activeCfg.color }]} />
            <Text style={[styles.liveText, { color: activeCfg.color }]}>LIVE AVAILABILITY</Text>
          </View>
          <Text style={styles.updatedTime}>
            {broadcastSuccess ? 'Just updated!' : 'Active'}
          </Text>
        </View>

        <Text style={[styles.activeStatusTitle, { color: activeCfg.color }]}>
          {activeCfg.label}
        </Text>
        <Text style={styles.activeStatusMessage}>
          "{currentMessage}"
        </Text>

        <View style={styles.telemetryBadge}>
          <Text style={styles.telemetryText}>
            ✓ Atomic sync to /status/{user?.uid?.slice(0, 8)} & append-only /logs
          </Text>
        </View>
      </View>

      {/* 1-Tap Status Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tap to Change Status (1-Tap Broadcast):</Text>
        <View style={styles.statusGrid}>
          {Object.values(STATUS_CONFIG).map((cfg) => {
            const isCurrent = currentStatus === cfg.key;
            return (
              <TouchableOpacity
                key={cfg.key}
                disabled={broadcasting}
                onPress={() => handleStatusTap(cfg.key)}
                style={[
                  styles.statusButton,
                  { borderColor: cfg.borderColor, backgroundColor: isCurrent ? cfg.bgColor : '#0f172a' },
                  isCurrent && styles.statusButtonActive,
                ]}
              >
                <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.statusLabel, isCurrent && { color: '#0f172a' }]}>
                    {cfg.label}
                  </Text>
                  <Text style={[styles.statusDesc, isCurrent && { color: '#334155' }]}>
                    {cfg.defaultMessage}
                  </Text>
                </View>
                {isCurrent && (
                  <View style={[styles.activeCheck, { backgroundColor: cfg.color }]}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Custom Note & Quick Presets */}
      <View style={styles.section}>
        <View style={styles.noteHeaderRow}>
          <Text style={styles.sectionTitle}>Optional Custom Message</Text>
          <Text style={[styles.charCount, customNote.length > 130 && { color: '#ef4444' }]}>
            {customNote.length}/140
          </Text>
        </View>

        <TextInput
          style={styles.noteInput}
          placeholder="e.g. In Room 402 for tutorial until 11:30 AM..."
          placeholderTextColor="#64748b"
          value={customNote}
          onChangeText={(txt) => setCustomNote(txt.slice(0, 140))}
          maxLength={140}
        />

        {/* Quick Suggestion Chips */}
        <Text style={styles.quickLabel}>Quick Note Suggestions:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {QUICK_NOTES.map((note) => (
            <TouchableOpacity
              key={note}
              style={styles.chip}
              onPress={() => setCustomNote(note)}
            >
              <Text style={styles.chipText}>{note}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Broadcast in progress indicator */}
      {broadcasting && (
        <View style={styles.broadcastingOverlay}>
          <ActivityIndicator color="#ffffff" size="small" />
          <Text style={styles.broadcastingText}>Broadcasting atomic update to campus...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#090d16',
    minHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileInitial: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  profileMeta: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  dept: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  logoutText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  activeStatusCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    marginBottom: 24,
  },
  activeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  updatedTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  activeStatusTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  activeStatusMessage: {
    fontSize: 14,
    color: '#cbd5e1',
    marginTop: 6,
    fontStyle: 'italic',
  },
  telemetryBadge: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  telemetryText: {
    fontSize: 11,
    color: '#10b981',
    fontFamily: 'monospace',
  },
  section: {
    marginBottom: 22,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusGrid: {
    gap: 12,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  statusButtonActive: {
    transform: [{ scale: 1.02 }],
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 14,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  statusDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  activeCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  noteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  charCount: {
    fontSize: 11,
    color: '#64748b',
  },
  noteInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    padding: 14,
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 12,
  },
  quickLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 8,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
  },
  chipText: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  broadcastingOverlay: {
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    borderColor: '#3b82f6',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  broadcastingText: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '600',
  },
});
