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
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
import { STATUS_KEYS, DEFAULT_INSTITUTION_SETTINGS, calculateDailyDeskHours } from '@profping/shared';

// ── Status Config Matching Campus Clarity Design System ──────────────────────
const BADGE_MAP = {
  available: {
    label: 'Available',
    dotColor: '#16A34A',
    badgeBg: '#DCFCE7',
    badgeText: '#15803D',
    icon: 'check-circle',
  },
  busy: {
    label: 'Busy',
    dotColor: '#F59E0B',
    badgeBg: '#FEF3C7',
    badgeText: '#B45309',
    icon: 'clock',
  },
  in_lecture: {
    label: 'In Lecture',
    dotColor: '#2563EB',
    badgeBg: '#DBEAFE',
    badgeText: '#1D4ED8',
    icon: 'graduation-cap',
  },
  off_campus: {
    label: 'Off Campus',
    dotColor: '#DC2626',
    badgeBg: '#FEE2E2',
    badgeText: '#B91C1C',
    icon: 'door-open',
  },
};

// Relative time calculation & staleness helper (>60 min or not today is stale)
function getFacultyUpdatedInfo(fac, live) {
  const ts = live?.updatedAt || fac?.status?.updatedAt || fac?.updatedAt || live?.timestamp;
  if (!ts) {
    return { text: 'Updated recently', isStale: false };
  }
  const timestamp = typeof ts === 'number' ? ts : Date.parse(ts);
  if (!timestamp || isNaN(timestamp)) {
    return { text: 'Updated recently', isStale: false };
  }
  const diffMs = Math.max(0, Date.now() - timestamp);
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);

  const todayStr = new Date().toDateString();
  const dateStr = new Date(timestamp).toDateString();
  const notToday = todayStr !== dateStr;
  const isStale = diffMin >= 60 || notToday;

  if (diffMin < 1) {
    return { text: 'Updated just now', isStale: false };
  } else if (diffMin === 1) {
    return { text: 'Updated 1 min ago', isStale: false };
  } else if (diffMin < 60) {
    return { text: `Updated ${diffMin} min ago`, isStale: false };
  } else if (diffHrs === 1) {
    return { text: 'Updated 1 hr ago', isStale: true };
  } else if (diffHrs < 24) {
    return { text: `Updated ${diffHrs} hrs ago`, isStale: true };
  } else {
    const diffDays = Math.floor(diffHrs / 24);
    return { text: `Updated ${diffDays}d ago`, isStale: true };
  }
}

export default function HodDepartmentScreen() {
  const router = useRouter();
  const { user, department } = useAuth();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const effectiveDept = (department || user?.department || 'CMPN').toUpperCase();

  const [liveStatuses, setLiveStatuses] = useState({});
  const [facultyRoster, setFacultyRoster] = useState([]);
  const [facultyLogs, setFacultyLogs] = useState({});
  const [institutionSettings, setInstitutionSettings] = useState(DEFAULT_INSTITUTION_SETTINGS);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // 1. Subscribe to live Firebase RTDB statuses, faculty, logs & settings
  useEffect(() => {
    // Live Statuses
    const statusRef = ref(db, 'status');
    const unsubStatus = onValue(statusRef, (snapshot) => {
      if (snapshot.exists()) {
        setLiveStatuses(snapshot.val() || {});
      }
    });

    // Faculty Directory
    const facultyRef = ref(db, 'faculty');
    const unsubFaculty = onValue(facultyRef, (snapshot) => {
      if (snapshot.exists()) {
        const allF = snapshot.val() || {};
        const deptFaculty = Object.entries(allF)
          .map(([uid, f]) => ({ uid, ...f }))
          .filter((f) => {
            const facDept = (f.department || '').toUpperCase();
            return facDept === effectiveDept || facDept.includes(effectiveDept);
          });
        setFacultyRoster(deptFaculty);
      } else {
        setFacultyRoster([]);
      }
    });

    // Logs (for desk hour computation)
    const logsRef = ref(db, 'logs');
    const unsubLogs = onValue(logsRef, (snapshot) => {
      if (snapshot.exists()) {
        setFacultyLogs(snapshot.val() || {});
      }
    });

    // Institution Settings
    const settingsRef = ref(db, 'settings');
    const unsubSettings = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        setInstitutionSettings({ ...DEFAULT_INSTITUTION_SETTINGS, ...snapshot.val() });
      }
    });

    return () => {
      off(statusRef);
      off(facultyRef);
      off(logsRef);
      off(settingsRef);
    };
  }, [effectiveDept]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const [snapStatus, snapFaculty, snapLogs, snapSettings] = await Promise.all([
        get(ref(db, 'status')),
        get(ref(db, 'faculty')),
        get(ref(db, 'logs')),
        get(ref(db, 'settings')),
      ]);

      if (snapStatus.exists()) setLiveStatuses(snapStatus.val() || {});
      if (snapFaculty.exists()) {
        const allF = snapFaculty.val() || {};
        const deptFaculty = Object.entries(allF)
          .map(([uid, f]) => ({ uid, ...f }))
          .filter((f) => {
            const facDept = (f.department || '').toUpperCase();
            return facDept === effectiveDept || facDept.includes(effectiveDept);
          });
        setFacultyRoster(deptFaculty);
      }
      if (snapLogs.exists()) setFacultyLogs(snapLogs.val() || {});
      if (snapSettings.exists()) {
        setInstitutionSettings({ ...DEFAULT_INSTITUTION_SETTINGS, ...snapSettings.val() });
      }
    } catch (_) {}
    setRefreshing(false);
  };

  // Helper to compute desk hours for a faculty member
  const getTodayDeskHours = (uid) => {
    const rawLogs = facultyLogs[uid];
    if (!rawLogs) return 0;
    const logsArray = Object.entries(rawLogs).map(([id, val]) => ({
      id,
      state: val.state || 'available',
      timestamp: val.timestamp || Date.now(),
      message: val.message || '',
    }));
    const result = calculateDailyDeskHours(logsArray, new Date(), { settings: institutionSettings });
    return result?.deskHours || 0;
  };

  // Compute departmental summary counts
  const stats = useMemo(() => {
    let availableCount = 0;
    let inLectureCount = 0;
    let busyCount = 0;
    let offCampusCount = 0;

    facultyRoster.forEach((f) => {
      const live = liveStatuses[f.uid] || f.status || {};
      const st = (live.state || STATUS_KEYS.AVAILABLE).toLowerCase();
      if (st === 'available') availableCount++;
      else if (st === 'in_lecture') inLectureCount++;
      else if (st === 'busy') busyCount++;
      else if (st === 'off_campus') offCampusCount++;
    });

    return {
      total: facultyRoster.length,
      availableCount,
      inLectureCount,
      busyCount,
      offCampusCount,
    };
  }, [facultyRoster, liveStatuses]);

  // Filter roster
  const filteredRoster = useMemo(() => {
    return facultyRoster.filter((f) => {
      const live = liveStatuses[f.uid] || f.status || {};
      const state = (live.state || STATUS_KEYS.AVAILABLE).toLowerCase();

      // Filter chip match
      if (activeFilter !== 'ALL' && state !== activeFilter) {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = (f.name || '').toLowerCase().includes(query);
        const matchesCabin = (f.cabin || '').toLowerCase().includes(query);
        const matchesDesig = (f.designation || '').toLowerCase().includes(query);
        const matchesMsg = (live.message || '').toLowerCase().includes(query);
        return matchesName || matchesCabin || matchesDesig || matchesMsg;
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

      {/* ── 1. TOP HEADER (Identical to Faculty Screens with 'FACULTY ASSIGNED TO YOU' Subtitle) ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.brandTitleBlock}>
            <Image
              source={require('../../assets/profping-logo.png')}
              style={styles.headerLogoImage}
              resizeMode="contain"
            />
            <Text style={styles.headerSubtitle}>FACULTY ASSIGNED TO YOU</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.deptChip}>
            <Text style={styles.deptChipText}>{effectiveDept} HOD</Text>
          </View>
        </View>
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
        {/* ── 2. HOD WEB PORTAL HINT BANNER ────────────────────────────── */}
        <View style={styles.hintCard}>
          <View style={styles.hintIconBox}>
            <Ionicons name="information-circle" size={20} color="#4326B6" />
          </View>
          <View style={styles.hintTextBox}>
            <Text style={styles.hintTitle}>Manage faculty on the web portal</Text>
            <Text style={styles.hintSubtitle}>
              Faculty provisioning, profile assignments, and student permissions are managed via your HOD web portal.
            </Text>
          </View>
        </View>

        {/* ── 3. SUMMARY COUNTS BY STATUS ──────────────────────────────── */}
        <View style={styles.summaryGrid}>
          {/* Available */}
          <TouchableOpacity
            style={[
              styles.summaryCard,
              activeFilter === 'available' && styles.summaryCardSelected,
            ]}
            onPress={() => setActiveFilter(activeFilter === 'available' ? 'ALL' : 'available')}
            activeOpacity={0.75}
          >
            <View style={[styles.summaryIconBox, { backgroundColor: '#DCFCE7' }]}>
              <FontAwesome5 name="check-circle" size={14} color="#15803D" />
            </View>
            <Text style={[styles.summaryCount, { color: '#15803D' }]}>
              {stats.availableCount}
            </Text>
            <Text style={styles.summaryLabel}>Available</Text>
          </TouchableOpacity>

          {/* In Lecture */}
          <TouchableOpacity
            style={[
              styles.summaryCard,
              activeFilter === 'in_lecture' && styles.summaryCardSelected,
            ]}
            onPress={() => setActiveFilter(activeFilter === 'in_lecture' ? 'ALL' : 'in_lecture')}
            activeOpacity={0.75}
          >
            <View style={[styles.summaryIconBox, { backgroundColor: '#DBEAFE' }]}>
              <FontAwesome5 name="graduation-cap" size={13} color="#2563EB" />
            </View>
            <Text style={[styles.summaryCount, { color: '#2563EB' }]}>
              {stats.inLectureCount}
            </Text>
            <Text style={styles.summaryLabel}>In Lecture</Text>
          </TouchableOpacity>

          {/* Busy */}
          <TouchableOpacity
            style={[
              styles.summaryCard,
              activeFilter === 'busy' && styles.summaryCardSelected,
            ]}
            onPress={() => setActiveFilter(activeFilter === 'busy' ? 'ALL' : 'busy')}
            activeOpacity={0.75}
          >
            <View style={[styles.summaryIconBox, { backgroundColor: '#FEF3C7' }]}>
              <FontAwesome5 name="clock" size={13} color="#D97706" />
            </View>
            <Text style={[styles.summaryCount, { color: '#D97706' }]}>
              {stats.busyCount}
            </Text>
            <Text style={styles.summaryLabel}>Busy</Text>
          </TouchableOpacity>

          {/* Off Campus */}
          <TouchableOpacity
            style={[
              styles.summaryCard,
              activeFilter === 'off_campus' && styles.summaryCardSelected,
            ]}
            onPress={() => setActiveFilter(activeFilter === 'off_campus' ? 'ALL' : 'off_campus')}
            activeOpacity={0.75}
          >
            <View style={[styles.summaryIconBox, { backgroundColor: '#FEE2E2' }]}>
              <FontAwesome5 name="door-open" size={13} color="#DC2626" />
            </View>
            <Text style={[styles.summaryCount, { color: '#DC2626' }]}>
              {stats.offCampusCount}
            </Text>
            <Text style={styles.summaryLabel}>Off Campus</Text>
          </TouchableOpacity>
        </View>

        {/* ── 4. SEARCH BAR (Campus Clarity Style) ─────────────────────── */}
        <View style={styles.searchContainer}>
          <FontAwesome5 name="search" size={14} color="#94A3B8" style={styles.searchLens} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by professor, cabin, or note..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={17} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── 5. FILTER CHIPS (Horizontal Scroll) ──────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterScrollContent}
        >
          {[
            { id: 'ALL', label: `All Faculty (${stats.total})` },
            { id: 'available', label: `Available (${stats.availableCount})` },
            { id: 'in_lecture', label: `In Lecture (${stats.inLectureCount})` },
            { id: 'busy', label: `Busy (${stats.busyCount})` },
            { id: 'off_campus', label: `Off Campus (${stats.offCampusCount})` },
          ].map((chip) => {
            const isActive = activeFilter === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(chip.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── 6. ROSTER HEADER ────────────────────────────────────────── */}
        <View style={styles.directoryHeader}>
          <View style={styles.directoryHeaderLeft}>
            <Text style={styles.directoryHeading}>DEPARTMENT FACULTY</Text>
            <View style={styles.availableBadge}>
              <Text style={styles.availableBadgeText}>{filteredRoster.length} Found</Text>
            </View>
          </View>

          <View style={styles.liveIndicatorRow}>
            <View style={styles.liveDotRing}>
              <View style={styles.liveDotCore} />
            </View>
            <Text style={styles.liveIndicatorText}>Live RTDB</Text>
          </View>
        </View>

        {/* ── 7. FACULTY CARDS (Exact match to other pages) ─────────────── */}
        <View style={styles.facultyCardsList}>
          {filteredRoster.length === 0 ? (
            <View style={styles.emptyFacultyBox}>
              <FontAwesome5 name="user-friends" size={24} color="#94A3B8" style={{ marginBottom: 10 }} />
              <Text style={styles.emptyFacultyTitle}>No Department Faculty</Text>
              <Text style={styles.emptyFacultySub}>
                {facultyRoster.length === 0
                  ? `No faculty members registered in ${effectiveDept} Department yet. Add faculty via the HOD web portal.`
                  : 'No faculty members match your selected status or search filter.'}
              </Text>
            </View>
          ) : (
            filteredRoster.map((fac) => {
              const live = liveStatuses[fac.uid] || fac.status || {};
              const state = (live.state || STATUS_KEYS.AVAILABLE).toLowerCase();
              const badge = BADGE_MAP[state] || BADGE_MAP.available;
              const updatedInfo = getFacultyUpdatedInfo(fac, live);
              const todayDeskHours = getTodayDeskHours(fac.uid);

              const initials = (fac.name || 'Faculty')
                .split(' ')
                .filter(Boolean)
                .map((p) => p[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              return (
                <View key={fac.uid} style={styles.facultyCard}>
                  {/* Top Header Row: Avatar + Name/Role + Status Badge */}
                  <View style={styles.cardHeaderRow}>
                    {/* Avatar with Status Dot */}
                    <View style={styles.cardAvatarWrapper}>
                      <View style={styles.cardAvatarPlaceholder}>
                        <Text style={styles.cardAvatarPlaceholderText}>{initials}</Text>
                      </View>
                      <View style={[styles.cardStatusDot, { backgroundColor: badge.dotColor }]} />
                    </View>

                    {/* Name & Designation */}
                    <View style={styles.cardInfoCol}>
                      <View style={styles.nameRow}>
                        <Text style={styles.facultyNameText}>{fac.name}</Text>
                        {fac.isVerified && (
                          <MaterialCommunityIcons
                            name="check-decagram"
                            size={15}
                            color="#4326B6"
                            style={{ marginLeft: 5 }}
                          />
                        )}
                      </View>
                      <Text style={styles.facultyRoleText}>
                        {fac.designation || 'Faculty'} • {fac.department || effectiveDept}
                      </Text>
                    </View>

                    {/* Canonical Status Tag */}
                    <View style={[styles.statusTag, { backgroundColor: badge.badgeBg }]}>
                      <FontAwesome5
                        name={badge.icon}
                        size={10}
                        color={badge.badgeText}
                        style={{ marginRight: 5 }}
                      />
                      <Text style={[styles.statusTagText, { color: badge.badgeText }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>

                  {/* Status Message Line */}
                  {live.message ? (
                    <Text
                      style={[
                        styles.cardMessageText,
                        state === 'available' && styles.cardMessageItalic,
                      ]}
                    >
                      {state === 'available' ? `"${live.message}"` : live.message}
                    </Text>
                  ) : null}

                  {/* Card Location, Desk Hours & Last Updated Footer Row */}
                  <View style={styles.cardFooterRow}>
                    {/* Left: Cabin Info */}
                    <View style={styles.cardLocationLeft}>
                      <FontAwesome5
                        name="map-marker-alt"
                        size={11}
                        color="#4326B6"
                        style={{ marginRight: 5 }}
                      />
                      <Text style={styles.cardLocationText}>
                        {fac.cabin || `${effectiveDept} Cabin`}
                      </Text>
                    </View>

                    {/* Middle: Desk Hours */}
                    <View style={styles.deskHoursBadge}>
                      <Ionicons name="time-outline" size={11} color="#4326B6" style={{ marginRight: 3 }} />
                      <Text style={styles.deskHoursText}>
                        Desk: {todayDeskHours > 0 ? `${todayDeskHours}h` : '0h'}
                      </Text>
                    </View>

                    {/* Right: Updated X min ago + Stale Tag */}
                    <View style={styles.timeStaleContainer}>
                      <Text style={styles.updatedTimeText}>{updatedInfo.text}</Text>
                      {updatedInfo.isStale && (
                        <View style={styles.staleTag}>
                          <FontAwesome5 name="history" size={8.5} color="#B45309" style={{ marginRight: 3 }} />
                          <Text style={styles.staleTagText}>Stale</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Bottom spacing to clear floating FacultyNavbar */}
        <View style={{ height: 110 }} />
      </ScrollView>
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

  // ── 1. Top Header (Identical to Faculty Index & History with FACULTY ASSIGNED TO YOU subtitle) ──
  header: {
    backgroundColor: '#FAF8FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 62 : 46,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitleBlock: {
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deptChip: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  deptChipText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 10,
    color: '#4326B6',
    letterSpacing: 0.3,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // ── 2. Hint Banner ────────────────────────────────────────────────────────
  hintCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    shadowColor: '#1A191F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  hintIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintTextBox: {
    flex: 1,
  },
  hintTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 12.5,
    color: '#1A191F',
    marginBottom: 2,
  },
  hintSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
  },

  // ── 3. Summary Counts by Status ───────────────────────────────────────────
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#1A191F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryCardSelected: {
    borderColor: '#4326B6',
    backgroundColor: '#FAF8FE',
    borderWidth: 1.5,
  },
  summaryIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  summaryCount: {
    fontFamily: 'Inter_800ExtraBold',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 2,
  },
  summaryLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
  },

  // ── 4. Search Bar (Campus Clarity Style) ──────────────────────────────────
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 12,
    shadowColor: '#1A191F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  searchLens: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#1A191F',
    paddingVertical: 0,
  },

  // ── 5. Filter Chips ───────────────────────────────────────────────────────
  filterScroll: {
    marginBottom: 16,
  },
  filterScrollContent: {
    gap: 8,
    paddingRight: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: '#4326B6',
    borderColor: '#4326B6',
  },
  filterChipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11.5,
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },

  // ── 6. Roster Header ──────────────────────────────────────────────────────
  directoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  directoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  directoryHeading: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 12,
    color: '#1A191F',
    letterSpacing: 0.4,
  },
  availableBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  availableBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 10.5,
    color: '#475569',
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

  // ── 7. Faculty Cards List ─────────────────────────────────────────────────
  facultyCardsList: {
    gap: 12,
  },
  emptyFacultyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyFacultyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#1A191F',
    marginBottom: 6,
  },
  emptyFacultySub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },

  facultyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#1A191F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardAvatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  cardAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cardAvatarPlaceholderText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 15,
    color: '#334155',
  },
  cardStatusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cardInfoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  facultyNameText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 15.5,
    color: '#1A191F',
  },
  facultyRoleText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginLeft: 6,
  },
  statusTagText: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 11,
  },
  cardMessageText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
    marginVertical: 8,
  },
  cardMessageItalic: {
    fontStyle: 'italic',
    color: '#475569',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardLocationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  cardLocationText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11.5,
    color: '#334155',
  },
  deskHoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    marginRight: 8,
  },
  deskHoursText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: '#4326B6',
  },
  timeStaleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  updatedTimeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#64748B',
  },
  staleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  staleTagText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9.5,
    color: '#B45309',
    letterSpacing: 0.3,
  },
});
