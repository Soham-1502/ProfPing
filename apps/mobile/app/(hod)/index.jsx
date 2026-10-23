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
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { useAuth } from '../../src/context/AuthContext';
import { ref, onValue, off, get } from 'firebase/database';
import { db } from '../../src/services/firebase';
import { STATUS_KEYS, STATUS_CONFIG } from '@profping/shared';
import LogoutModal from '../../src/components/LogoutModal';

// Department Fallback Faculty Registry
const SEED_DEPT_FACULTY = {
  CMPN: [
    {
      uid: 'demo-faculty-cmpn-01',
      name: 'Prof. Snehal Kulkarni',
      department: 'CMPN',
      designation: 'Assistant Professor • CMPN Dept',
      cabin: 'Hall No. 304 • Table 1',
      email: 'faculty.snehal@sfit.ac.in',
      compliance: 'COMPLIANT',
    },
    {
      uid: 'demo-faculty-cmpn-02',
      name: 'Dr. Rahul Joshi',
      department: 'CMPN',
      designation: 'Associate Professor • CMPN Dept',
      cabin: 'Hall No. 304 • Table 2',
      email: 'faculty.rahul@sfit.ac.in',
      compliance: 'COMPLIANT',
    },
    {
      uid: 'demo-faculty-cmpn-04',
      name: 'Prof. Rohan Patil',
      department: 'CMPN',
      designation: 'Associate Professor • Comp Sci',
      cabin: 'Hall No. 204 • Table 4',
      email: 'faculty.rohan@sfit.ac.in',
      compliance: 'COMPLIANT',
    },
  ],
  ECS: [
    {
      uid: 'demo-faculty-ecs-01',
      name: 'Dr. Anjali Mehta',
      department: 'ECS',
      designation: 'Associate Professor • ECS Dept',
      cabin: 'Hall No. 301 • Table 1',
      email: 'anjali.mehta@sfit.ac.in',
      compliance: 'COMPLIANT',
    },
    {
      uid: 'demo-faculty-ecs-02',
      name: 'Mr. Arjun Kulkarni',
      department: 'ECS',
      designation: 'Assistant Professor • ECS Dept',
      cabin: 'Hall No. 301 • Table 2',
      email: 'faculty.arjun@sfit.ac.in',
      compliance: 'COMPLIANT',
    },
  ],
  INFT: [
    {
      uid: 'demo-faculty-inft-01',
      name: 'Prof. Priya Shah',
      department: 'INFT',
      designation: 'Assistant Professor • INFT Dept',
      cabin: 'Hall No. 202 • Table 3',
      email: 'faculty.priya@sfit.ac.in',
      compliance: 'COMPLIANT',
    },
  ],
};

const STATUS_BADGE_CONFIG = {
  available: {
    label: 'Available',
    color: '#15803D',
    bg: '#DCFCE7',
    border: '#86EFAC',
    icon: 'check-circle',
  },
  busy: {
    label: 'Busy',
    color: '#D97706',
    bg: '#FEF3C7',
    border: '#FDE68A',
    icon: 'clock',
  },
  in_lecture: {
    label: 'In Lecture',
    color: '#2563EB',
    bg: '#DBEAFE',
    border: '#BFDBFE',
    icon: 'graduation-cap',
  },
  off_campus: {
    label: 'Off Campus',
    color: '#DC2626',
    bg: '#FEE2E2',
    border: '#FECACA',
    icon: 'door-open',
  },
};

export default function HodDashboardScreen() {
  const router = useRouter();
  const { user, department, logout } = useAuth();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const effectiveDept = department || 'CMPN';
  const hodName = user?.displayName || 'Dr. Kavita Sonawane';

  const [liveStatuses, setLiveStatuses] = useState({});
  const [facultyRoster, setFacultyRoster] = useState(SEED_DEPT_FACULTY[effectiveDept] || SEED_DEPT_FACULTY.CMPN);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // 1. Subscribe in real time to live Firebase RTDB statuses
  useEffect(() => {
    const statusRef = ref(db, 'status');
    const unsubscribe = onValue(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        setLiveStatuses(snapshot.val() || {});
      }
    });

    // Query database for custom faculty in this department
    get(ref(db, 'faculty'))
      .then((snap) => {
        if (snap.exists()) {
          const allF = snap.val() || {};
          const deptFaculty = Object.entries(allF)
            .map(([uid, f]) => ({ uid, ...f }))
            .filter((f) => (f.department || '').toUpperCase() === effectiveDept.toUpperCase());
          if (deptFaculty.length > 0) {
            setFacultyRoster(deptFaculty);
          }
        }
      })
      .catch(() => {});

    return () => off(statusRef);
  }, [effectiveDept]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const snap = await get(ref(db, 'status'));
      if (snap.exists()) {
        setLiveStatuses(snap.val() || {});
      }
    } catch (_) {}
    setRefreshing(false);
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const handleConfirmLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
    router.replace('/(auth)/login');
  };

  // Compute departmental stats
  const stats = useMemo(() => {
    let availableCount = 0;
    let inLectureCount = 0;
    let busyCount = 0;
    let offCampusCount = 0;

    facultyRoster.forEach((f) => {
      const live = liveStatuses[f.uid] || liveStatuses['demo-faculty-ecs-01'] || {};
      const st = (live.state || STATUS_KEYS.AVAILABLE).toLowerCase();
      if (st === 'available') availableCount++;
      else if (st === 'in_lecture') inLectureCount++;
      else if (st === 'busy') busyCount++;
      else if (st === 'off_campus') offCampusCount++;
    });

    const total = facultyRoster.length;
    const activeOnCampus = availableCount + inLectureCount + busyCount;
    const complianceRate = total > 0 ? Math.round((activeOnCampus / total) * 100) : 100;

    return {
      total,
      availableCount,
      inLectureCount,
      busyCount,
      offCampusCount,
      complianceRate,
    };
  }, [facultyRoster, liveStatuses]);

  // Filter roster
  const filteredRoster = useMemo(() => {
    return facultyRoster.filter((f) => {
      const live = liveStatuses[f.uid] || liveStatuses['demo-faculty-ecs-01'] || {};
      const state = (live.state || 'available').toLowerCase();

      // Filter chip match
      if (activeFilter !== 'ALL' && state !== activeFilter) {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = (f.name || '').toLowerCase().includes(query);
        const matchesCabin = (f.cabin || '').toLowerCase().includes(query);
        const matchesEmail = (f.email || '').toLowerCase().includes(query);
        return matchesName || matchesCabin || matchesEmail;
      }

      return true;
    });
  }, [facultyRoster, liveStatuses, activeFilter, searchQuery]);

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

      {/* ── TOP HEADER (Campus Clarity System) ───────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/profping-logo.png')}
            style={styles.headerLogoImage}
            resizeMode="contain"
          />
          <Text style={styles.headerSubtitle}>HOD DASHBOARD • {effectiveDept} DEPT</Text>
        </View>

        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleLogout}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>

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
        {/* ── 1. HOD HERO SUMMARY CARD ─────────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.hodAvatarBox}>
              <FontAwesome5 name="user-tie" size={22} color="#4326B6" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.roleBadgeRow}>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>HOD AUTHORIZED</Text>
                </View>
                <View style={styles.deptBadge}>
                  <Text style={styles.deptBadgeText}>{effectiveDept} DEPARTMENT</Text>
                </View>
              </View>
              <Text style={styles.hodNameText}>{hodName}</Text>
              <Text style={styles.hodSubText}>Head of Department • Live Roster Control</Text>
            </View>
          </View>
        </View>

        {/* ── 2. EXECUTIVE METRICS GRID ────────────────────────────────── */}
        <Text style={styles.sectionHeaderTitle}>DEPARTMENT TELEMETRY</Text>
        <View style={styles.metricsGrid}>
          {/* Total Faculty */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#EDE9FE' }]}>
              <FontAwesome5 name="users" size={15} color="#4326B6" />
            </View>
            <View>
              <Text style={styles.metricValue}>{stats.total}</Text>
              <Text style={styles.metricLabel}>Total Faculty</Text>
            </View>
          </View>

          {/* Available Now */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#DCFCE7' }]}>
              <FontAwesome5 name="check-circle" size={15} color="#15803D" />
            </View>
            <View>
              <Text style={[styles.metricValue, { color: '#15803D' }]}>{stats.availableCount}</Text>
              <Text style={styles.metricLabel}>Available Now</Text>
            </View>
          </View>

          {/* In Lecture */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#DBEAFE' }]}>
              <FontAwesome5 name="graduation-cap" size={15} color="#2563EB" />
            </View>
            <View>
              <Text style={[styles.metricValue, { color: '#2563EB' }]}>{stats.inLectureCount}</Text>
              <Text style={styles.metricLabel}>In Lecture</Text>
            </View>
          </View>

          {/* Compliance Rate */}
          <View style={styles.metricCard}>
            <View style={[styles.metricIconBox, { backgroundColor: '#FEF3C7' }]}>
              <FontAwesome5 name="chart-pie" size={15} color="#D97706" />
            </View>
            <View>
              <Text style={[styles.metricValue, { color: '#D97706' }]}>{stats.complianceRate}%</Text>
              <Text style={styles.metricLabel}>Active Rate</Text>
            </View>
          </View>
        </View>

        {/* ── 3. SEARCH & FILTER BAR ──────────────────────────────────── */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={16} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search faculty by name or cabin..."
            placeholderTextColor="#94A3B8"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {[
            { id: 'ALL', label: 'All Faculty' },
            { id: 'available', label: 'Available' },
            { id: 'in_lecture', label: 'In Lecture' },
            { id: 'busy', label: 'Busy' },
            { id: 'off_campus', label: 'Off Campus' },
          ].map((chip) => {
            const isSelected = activeFilter === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setActiveFilter(chip.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── 4. LIVE FACULTY ROSTER ──────────────────────────────────── */}
        <View style={styles.rosterHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>FACULTY ROSTER ({filteredRoster.length})</Text>
          <View style={styles.liveIndicatorRow}>
            <View style={styles.liveDotRing}>
              <View style={styles.liveDotCore} />
            </View>
            <Text style={styles.liveIndicatorText}>Live RTDB Synced</Text>
          </View>
        </View>

        {filteredRoster.map((fac) => {
          const live = liveStatuses[fac.uid] || (fac.department === 'ECS' ? liveStatuses['demo-faculty-ecs-01'] : {}) || {};
          const stateKey = (live.state || STATUS_KEYS.AVAILABLE).toLowerCase();
          const cfg = STATUS_BADGE_CONFIG[stateKey] || STATUS_BADGE_CONFIG.available;

          return (
            <View key={fac.uid} style={styles.facultyCard}>
              <View style={styles.cardTopRow}>
                {/* Faculty Info */}
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.facultyCardName}>{fac.name}</Text>
                  <Text style={styles.facultyCardTitle}>{fac.designation}</Text>
                  <View style={styles.cabinRow}>
                    <FontAwesome5 name="map-marker-alt" size={11} color="#4326B6" style={{ marginRight: 5 }} />
                    <Text style={styles.cabinText}>{fac.cabin || 'Main Faculty Hall'}</Text>
                  </View>
                </View>

                {/* Live Status Pill */}
                <View style={[styles.statusPill, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                  <FontAwesome5 name={cfg.icon} size={11} color={cfg.color} style={{ marginRight: 5 }} />
                  <Text style={[styles.statusPillText, { color: cfg.color }]}>
                    {cfg.label}
                  </Text>
                </View>
              </View>

              {/* Context Note (if present) */}
              {live.message ? (
                <View style={styles.noteBox}>
                  <Text style={styles.noteText}>"{live.message}"</Text>
                </View>
              ) : null}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── THEMED LOGOUT CONFIRMATION MODAL ──────────────────────────── */}
      <LogoutModal
        visible={logoutModalVisible}
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={handleConfirmLogout}
        roleLabel="HOD"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8FE',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAF8FE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 1. Header
  header: {
    backgroundColor: '#FAF8FE',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 62 : 46,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EDF9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    justifyContent: 'center',
  },
  headerLogoImage: {
    width: 126,
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
  signOutBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#1A191F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  hodAvatarBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: '#4326B6',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 9,
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  deptBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deptBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 9,
    color: '#4326B6',
  },
  hodNameText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 16,
    color: '#1A191F',
  },
  hodSubText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },

  sectionHeaderTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 11,
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 10,
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
    fontWeight: '800',
    fontSize: 16,
    color: '#1A191F',
  },
  metricLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },

  // Search
  searchBarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#1A191F',
  },

  // Filters
  filterScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 9999,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#4326B6',
    borderColor: '#4326B6',
  },
  filterChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11.5,
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Roster Header
  rosterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDotRing: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDotCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  liveIndicatorText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10.5,
    color: '#15803D',
  },

  // Faculty Card
  facultyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
    shadowColor: '#1A191F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  facultyCardName: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 15,
    color: '#1A191F',
  },
  facultyCardTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  cabinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  cabinText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#4326B6',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  statusPillText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 11,
  },
  noteBox: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  noteText: {
    fontFamily: 'Inter_400Regular',
    fontStyle: 'italic',
    fontSize: 12,
    color: '#4B4757',
  },
});
