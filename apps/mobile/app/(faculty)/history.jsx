import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
  StatusBar,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { useAuth } from '../../src/context/AuthContext';
import { useFaculty } from '../../src/context/FacultyContext';
import {
  getFacultyStatusHistory,
} from '../../src/services/statusService';
import { STATUS_KEYS } from '@profping/shared';

// Status Theme Configurations
const STATUS_CONFIG = {
  available: {
    label: 'Available',
    color: '#059669',
    bg: '#ECFDF5',
    border: '#A7F3D0',
    icon: 'checkmark-circle',
    iconFamily: 'Ionicons',
  },
  busy: {
    label: 'Busy (DND)',
    color: '#D97706',
    bg: '#FFFBEB',
    border: '#FDE68A',
    icon: 'remove-circle',
    iconFamily: 'Ionicons',
  },
  in_lecture: {
    label: 'In Lecture / Lab',
    color: '#0284C7',
    bg: '#F0F9FF',
    border: '#BAE6FD',
    icon: 'school',
    iconFamily: 'Ionicons',
  },
  off_campus: {
    label: 'Off Campus / Absent',
    color: '#64748B',
    bg: '#F8FAFC',
    border: '#E2E8F0',
    icon: 'moon',
    iconFamily: 'Ionicons',
  },
  unavailable: {
    label: 'Unavailable',
    color: '#DC2626',
    bg: '#FEF2F2',
    border: '#FECACA',
    icon: 'close-circle',
    iconFamily: 'Ionicons',
  },
};

export default function FacultyHistoryScreen() {
  const { user } = useAuth();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const { logs: contextLogs, logsLoaded } = useFaculty();
  const [localLogs, setLocalLogs] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('ALL');

  const logs = localLogs !== null ? localLogs : (contextLogs || []);
  const loading = !logsLoaded && logs.length === 0;

  const facultyUid = user?.uid || null;

  const onRefresh = async () => {
    if (!facultyUid) return;
    setRefreshing(true);
    try {
      const refreshedLogs = await getFacultyStatusHistory(facultyUid);
      setLocalLogs(refreshedLogs);
    } catch (e) {
      console.error('Refresh failed:', e);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter Chips config
  const filterChips = [
    { id: 'ALL', label: 'All Updates' },
    { id: 'available', label: 'Available' },
    { id: 'busy', label: 'Busy' },
    { id: 'in_lecture', label: 'In Lecture' },
    { id: 'off_campus', label: 'Off Campus' },
  ];

  // Filtered logs
  const filteredLogs = useMemo(() => {
    if (activeFilter === 'ALL') return logs;
    return logs.filter((item) => {
      const s = (item.state || '').toLowerCase();
      if (activeFilter === 'available') return s === 'available';
      if (activeFilter === 'busy') return s === 'busy';
      if (activeFilter === 'in_lecture') return s === 'in_lecture';
      if (activeFilter === 'off_campus') return s === 'off_campus' || s === 'unavailable';
      return true;
    });
  }, [logs, activeFilter]);

  // Compute stats
  const stats = useMemo(() => {
    const total = logs.length;
    const availableCount = logs.filter((l) => (l.state || '').toLowerCase() === 'available').length;
    const pct = total > 0 ? Math.round((availableCount / total) * 100) : 0;
    return {
      total,
      availablePct: pct,
    };
  }, [logs]);

  // Format timestamp helper (Consolidated absolute time: e.g. "1:28 AM • Today")
  const formatTime = (ts) => {
    if (!ts) return 'Unknown time';
    const date = new Date(ts);
    const now = new Date();

    const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    const isToday = now.toDateString() === date.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = yesterday.toDateString() === date.toDateString();

    let datePrefix = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    if (isToday) datePrefix = 'Today';
    else if (isYesterday) datePrefix = 'Yesterday';

    return `${timeStr} • ${datePrefix}`;
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF8FE" />
        <ActivityIndicator size="small" color="#4326B6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8FE" />

      {/* ── 1. TOP HEADER (Campus Clarity System) ─────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/profping-logo.png')}
            style={styles.headerLogoImage}
            resizeMode="contain"
          />
          <Text style={styles.headerSubtitle}>FACULTY BROADCASTER • AUDIT LOGS</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBody}>
          <ActivityIndicator size="small" color="#4326B6" />
          <Text style={styles.loadingText}>Loading Broadcast History...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4326B6']}
            tintColor="#4326B6"
          />
        }
      >
        {/* ── 2. EXECUTIVE METRICS BAR (2-COLUMN BALANCED) ─────────────── */}
        <View style={styles.metricsRow}>
          {/* Total Broadcasts */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="radio-outline" size={18} color="#4326B6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.metricValue}>{stats.total}</Text>
              <Text style={styles.metricLabel}>Total Broadcasts</Text>
            </View>
          </View>

          {/* Availability Ratio */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#15803D" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.metricValue}>{stats.availablePct}%</Text>
              <Text style={styles.metricLabel}>Available Rate</Text>
            </View>
          </View>
        </View>

        {/* ── 3. FILTER CHIPS ─────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filterChips.map((chip) => {
            const isSelected = activeFilter === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setActiveFilter(chip.id)}
                activeOpacity={0.75}
              >
                <Text
                  style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── 4. STATUS HISTORY CARDS LIST ────────────────────────────── */}
        <View style={styles.listContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Status Timeline</Text>
            <Text style={styles.sectionCount}>{filteredLogs.length} Records</Text>
          </View>

          {filteredLogs.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="file-tray-outline" size={40} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Status Updates</Text>
              <Text style={styles.emptyDesc}>
                No broadcast history found matching the selected filter.
              </Text>
            </View>
          ) : (
            filteredLogs.map((item, index) => {
              const stateKey = (item.state || 'available').toLowerCase();
              const cfg = STATUS_CONFIG[stateKey] || STATUS_CONFIG.available;
              const exactTime = formatTime(item.timestamp);

              return (
                <View key={item.id || `log-${index}`} style={styles.historyCard}>
                  {/* Left Color-Coded Accent Strip */}
                  <View style={[styles.cardAccentStrip, { backgroundColor: cfg.color }]} />

                  <View style={styles.cardMain}>
                    {/* Top Row: Status badge & Consolidated Absolute Timestamp */}
                    <View style={styles.cardHeaderRow}>
                      <View style={[styles.statusBadge, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                        <Ionicons name={cfg.icon} size={13} color={cfg.color} style={{ marginRight: 5 }} />
                        <Text style={[styles.statusBadgeText, { color: cfg.color }]}>
                          {cfg.label}
                        </Text>
                      </View>

                      <View style={styles.timeTag}>
                        <Ionicons name="time-outline" size={12} color="#64748B" style={{ marginRight: 4 }} />
                        <Text style={styles.exactTimeText}>{exactTime}</Text>
                      </View>
                    </View>

                    {/* Context Message: simple, italicized Muted Plum-Gray (#4B4757) text */}
                    {item.message ? (
                      <Text style={styles.cardNoteText}>
                        {item.message}
                      </Text>
                    ) : null}

                    {/* Location Row (if specified) */}
                    {item.location ? (
                      <View style={styles.cardLocationRow}>
                        <Ionicons name="location-outline" size={11} color="#64748B" style={{ marginRight: 4 }} />
                        <Text style={styles.cardLocationText}>{item.location}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8FE', // Whisper Violet Canvas
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAF8FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBody: {
    flex: 1,
    backgroundColor: '#FAF8FE',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  loadingText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#64748B',
    marginTop: 10,
  },

  // 1. Header
  header: {
    backgroundColor: '#FAF8FE',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 62 : 46,
    paddingBottom: 12,
  },
  headerLeft: {
    justifyContent: 'center',
  },
  headerLogoImage: {
    width: 128,
    height: 28,
  },
  headerSubtitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 9,
    color: '#64748B',
    letterSpacing: 1.2,
    marginTop: 2,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 88,
  },

  // 2. Metrics Row (2-Column Balanced)
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#F1F0F7',
    shadowColor: '#4326B6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  metricIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontFamily: 'Inter_800ExtraBold',
    fontSize: 16,
    color: '#1E1B4B',
  },
  metricLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // 3. Filter Chips
  filterScroll: {
    paddingBottom: 14,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#4326B6',
    borderColor: '#4326B6',
  },
  filterChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  // 4. History Cards List
  listContainer: {
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#1E1B4B',
  },
  sectionCount: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#64748B',
  },

  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F0F7',
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#4326B6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardAccentStrip: {
    width: 5,
  },
  cardMain: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
  },
  statusBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exactTimeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11.5,
    color: '#64748B',
  },
  cardNoteText: {
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    fontSize: 13,
    color: '#4B4757',
    marginTop: 8,
    marginBottom: 4,
    lineHeight: 19,
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  cardLocationText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#64748B',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F0F7',
    marginTop: 10,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#1E1B4B',
    marginTop: 12,
  },
  emptyDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
});
