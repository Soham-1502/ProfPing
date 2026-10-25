import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  StatusBar,
  Image,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
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
import { STATUS_KEYS } from '@profping/shared';
import { subscribeToLiveDirectory } from '../../src/services/directoryService';
import { getStarredFacultyUids, toggleStarredFacultyUid } from '../../src/services/favoritesStorage';
import FloatingNavbar from '../../src/components/FloatingNavbar';

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
    icon: 'book-open',
  },
  off_campus: {
    label: 'Off Campus',
    dotColor: '#DC2626',
    badgeBg: '#FEE2E2',
    badgeText: '#B91C1C',
    icon: 'times-circle',
  },
};

// Relative time calculation & staleness helper (>60 min is stale)
function getFacultyUpdatedInfo(fac) {
  const ts = fac?.status?.updatedAt || fac?.updatedAt || fac?.timestamp;
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

  const isStale = diffMin >= 60;

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

export default function StudentHomeScreen() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  const [facultyList, setFacultyList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'STARRED' | dept

  useEffect(() => {
    if (params?.filter === 'STARRED') {
      setActiveFilter('STARRED');
    }
  }, [params?.filter]);

  const [starredUids, setStarredUids] = useState(new Set());

  // Load persistent student starred faculty
  useEffect(() => {
    getStarredFacultyUids().then((set) => setStarredUids(set));
  }, []);

  const handleToggleStar = async (facUid) => {
    const updated = await toggleStarredFacultyUid(facUid);
    setStarredUids(new Set(updated));
  };

  // Subscribe to live directory
  useEffect(() => {
    const unsubscribe = subscribeToLiveDirectory((list) => {
      setFacultyList(list || []);
    });
    return () => unsubscribe();
  }, []);

  // Filter chips
  const filterChips = [
    { id: 'ALL', label: 'All Faculty' },
    { id: 'STARRED', label: 'Starred', isStar: true },
    { id: 'ECS', label: 'ECS Dept' },
    { id: 'CMPN', label: 'Comp Sci' },
    { id: 'INFT', label: 'IT Dept' },
    { id: 'EXTC', label: 'EXTC Dept' },
    { id: 'Robotics', label: 'Robotics' },
  ];

  // Filtered List
  const filteredList = useMemo(() => {
    return facultyList.filter((item) => {
      if (activeFilter === 'STARRED' && !starredUids.has(item.uid)) return false;
      if (activeFilter !== 'ALL' && activeFilter !== 'STARRED') {
        const itemDept = (item.department || '').toUpperCase();
        if (activeFilter === 'CMPN' && !itemDept.includes('CMPN') && !itemDept.includes('COMP')) return false;
        if (activeFilter === 'ECS' && !itemDept.includes('ECS')) return false;
        if (activeFilter === 'INFT' && !itemDept.includes('INFT') && !itemDept.includes('IT')) return false;
        if (activeFilter === 'EXTC' && !itemDept.includes('EXTC')) return false;
        if (activeFilter === 'Robotics' && !itemDept.includes('ROBOT')) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (item.name || '').toLowerCase().includes(q) ||
        (item.designation || '').toLowerCase().includes(q) ||
        (item.status?.message || '').toLowerCase().includes(q) ||
        (item.cabin || '').toLowerCase().includes(q) ||
        (item.department || '').toLowerCase().includes(q)
      );
    });
  }, [facultyList, activeFilter, searchQuery, starredUids]);

  // Dynamic Available Count
  const availableCount = useMemo(() => {
    return facultyList.filter(
      (fac) => (fac.status?.state || '').toLowerCase() === STATUS_KEYS.AVAILABLE
    ).length;
  }, [facultyList]);

  // Starred Faculty List
  const starredFacultyList = useMemo(() => {
    return facultyList.filter((f) => starredUids.has(f.uid));
  }, [facultyList, starredUids]);



  if (!fontsLoaded) {
    return (
      <View style={styles.loadingRoot}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF8FE" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8FE" />

      {/* ── 1. TOP HEADER BAR ─────────────────────────────────────────── */}
      <View style={styles.topHeader}>
        <View style={styles.topHeaderLeft}>
          <View style={styles.brandContainer}>
            <Image
              source={require('../../assets/profping-logo.png')}
              style={styles.headerLogoImage}
              resizeMode="contain"
            />
            <Text style={styles.brandSubtitle}>STUDENT DIRECTORY</Text>
          </View>
        </View>

        {/* Top Header Right */}
        <View style={styles.topHeaderRight} />
      </View>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 2. SEARCH BAR ───────────────────────────────────────────── */}
        <View style={styles.searchContainer}>
          <FontAwesome5 name="search" size={14} color="#94A3B8" style={styles.searchLens} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by professor, cabin, or dept..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Voice Search', 'Voice recognition listening for professor name...')
            }
          >
            <FontAwesome5 name="microphone" size={14} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* ── 3. FILTER CHIPS (HORIZONTAL SCROLL) ─────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterScrollContent}
        >
          {filterChips.map((chip) => {
            const isActive = activeFilter === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                style={[
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                ]}
                onPress={() => setActiveFilter(chip.id)}
                activeOpacity={0.8}
              >
                {chip.isStar && (
                  <FontAwesome5
                    name="star"
                    solid={isActive}
                    size={11}
                    color={isActive ? '#FFFFFF' : '#F59E0B'}
                    style={{ marginRight: 6 }}
                  />
                )}
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── 4. STARRED FACULTY SECTION ──────────────────────────────── */}
        <View style={styles.starredSection}>
          <View style={styles.starredHeaderRow}>
            <View style={styles.starredLabelGroup}>
              <FontAwesome5 name="star" size={11} color="#F59E0B" style={{ marginRight: 6 }} />
              <Text style={styles.starredHeaderTitle}>STARRED FACULTY</Text>
            </View>
            {starredFacultyList.length > 0 && (
              <TouchableOpacity onPress={() => setActiveFilter('STARRED')}>
                <Text style={styles.manageLink}>Manage ({starredFacultyList.length})</Text>
              </TouchableOpacity>
            )}
          </View>

          {starredFacultyList.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.starredListContent}
            >
              {starredFacultyList.map((fac) => {
                const initials = (fac.name || 'Faculty')
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0].toUpperCase())
                  .join('');
                const state = fac.status?.state || STATUS_KEYS.AVAILABLE;
                const badge = BADGE_MAP[state] || BADGE_MAP.available;
                return (
                  <TouchableOpacity
                    key={fac.uid}
                    style={styles.starredCard}
                    onPress={() => setSearchQuery(fac.name || '')}
                    activeOpacity={0.8}
                  >
                    <View style={styles.initialsAvatar}>
                      <Text style={styles.initialsText}>{initials}</Text>
                      <View style={[styles.avatarStatusBadge, { backgroundColor: badge.dotColor }]} />
                    </View>
                    <Text style={styles.starredCardName} numberOfLines={1}>
                      {fac.name}
                    </Text>
                    <Text style={styles.starredCardDept}>
                      {fac.department || 'SFIT'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.starredEmptyCard}>
              <FontAwesome5 name="star" size={12} color="#CBD5E1" style={{ marginRight: 8 }} />
              <Text style={styles.starredEmptyText}>No starred faculty</Text>
            </View>
          )}
        </View>

        {/* ── 5. LIVE FACULTY DIRECTORY HEADER ────────────────────────── */}
        <View style={styles.directoryHeader}>
          <View style={styles.directoryHeaderLeft}>
            <Text style={styles.directoryHeading}>LIVE FACULTY DIRECTORY</Text>
            <View style={styles.availableBadge}>
              <Text style={styles.availableBadgeText}>{availableCount} Available</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => {
              Alert.alert(
                'Department Filter',
                'Select filter options',
                [
                  { text: 'All Faculty', onPress: () => setActiveFilter('ALL') },
                  { text: 'ECS Dept', onPress: () => setActiveFilter('ECS') },
                  { text: 'Comp Sci', onPress: () => setActiveFilter('CMPN') },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
          >
            <FontAwesome5 name="sliders-h" size={11} color="#475569" style={{ marginRight: 5 }} />
            <Text style={styles.filterBtnText}>Filter</Text>
          </TouchableOpacity>
        </View>

        {/* ── 6. FACULTY CARDS ────────────────────────────────────────── */}
        <View style={styles.facultyCardsList}>
          {filteredList.length === 0 ? (
            <View style={styles.emptyFacultyBox}>
              <FontAwesome5 name="user-friends" size={24} color="#94A3B8" style={{ marginBottom: 10 }} />
              <Text style={styles.emptyFacultyTitle}>No Faculty Registered</Text>
              <Text style={styles.emptyFacultySub}>
                {facultyList.length === 0
                  ? "Faculty members added by department HODs will appear here in real-time."
                  : "No faculty members match your selected department or search filter."}
              </Text>
            </View>
          ) : (
            filteredList.map((fac) => {
              const state = fac.status?.state || STATUS_KEYS.AVAILABLE;
              const badge = BADGE_MAP[state] || BADGE_MAP.available;
              const isStarred = starredUids.has(fac.uid);
              const updatedInfo = getFacultyUpdatedInfo(fac);

              return (
                <View key={fac.uid} style={styles.facultyCard}>
                  {/* Header Row: Avatar + Name/Role + Star Button + Status Badge */}
                  <View style={styles.cardHeaderRow}>
                    {/* Avatar */}
                    <View style={styles.cardAvatarWrapper}>
                      <View style={styles.cardAvatarPlaceholder}>
                        <Text style={styles.cardAvatarPlaceholderText}>
                          {(fac.name || 'F')
                            .split(' ')
                            .filter(Boolean)
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join('')}
                        </Text>
                      </View>
                      <View style={[styles.cardStatusDot, { backgroundColor: badge.dotColor }]} />
                    </View>

                    {/* Name & Role */}
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
                        {fac.designation || 'Faculty'} • {fac.department || 'SFIT'}
                      </Text>
                    </View>

                    {/* Star Toggle Button */}
                    <TouchableOpacity
                      style={styles.starToggleBtn}
                      onPress={() => handleToggleStar(fac.uid)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <FontAwesome5
                        name="star"
                        solid={isStarred}
                        size={15}
                        color={isStarred ? '#F59E0B' : '#CBD5E1'}
                      />
                    </TouchableOpacity>

                    {/* Status Badge */}
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
                {fac.status?.message ? (
                  <Text
                    style={[
                      styles.cardMessageText,
                      state === STATUS_KEYS.AVAILABLE && styles.cardMessageItalic,
                    ]}
                  >
                    {state === STATUS_KEYS.AVAILABLE
                      ? `"${fac.status.message}"`
                      : fac.status.message}
                  </Text>
                ) : null}

                {/* Card Location & Last Updated Footer Row */}
                <View style={styles.cardFooterRow}>
                  {/* Left Location Info */}
                  <View style={styles.cardLocationLeft}>
                    <FontAwesome5
                      name={fac.lectureRoom ? 'graduation-cap' : 'book-open'}
                      size={11}
                      color={fac.lectureRoom ? '#2563EB' : '#4326B6'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.cardLocationText,
                        fac.lectureRoom && { color: '#2563EB' },
                      ]}
                    >
                      {fac.lectureRoom || fac.cabin || `${fac.department || 'SFIT'} Cabin`}
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
          }))}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
    </View>
  );
}

// ── EXACT CAMPUS CLARITY SYSTEM STYLES ───────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF8FE', // Whisper Violet Canvas
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: '#FAF8FE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── 1. Top Header ──────────────────────────────────────────────────────────
  topHeader: {
    backgroundColor: '#FAF8FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 62 : 46,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandContainer: {
    justifyContent: 'center',
  },
  headerLogoImage: {
    width: 128,
    height: 28,
  },
  brandSubtitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 9,
    color: '#64748B',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  topHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },

  mainScroll: {
    flex: 1,
  },
  mainScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
  },

  // ── 2. Search Bar ──────────────────────────────────────────────────────────
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 46,
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  searchLens: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 13.5,
    color: '#1A191F',
    height: '100%',
  },

  // ── 3. Filter Scroll ───────────────────────────────────────────────────────
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: '#4326B6',
    borderColor: '#4326B6',
  },
  filterChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 13,
    color: '#334155',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  // ── 4. Starred Faculty Section ─────────────────────────────────────────────
  starredSection: {
    marginBottom: 20,
  },
  starredHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  starredLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starredHeaderTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 11,
    color: '#4B4757',
    letterSpacing: 0.8,
  },
  manageLink: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 12,
    color: '#4326B6',
  },
  starredListContent: {
    gap: 16,
    paddingRight: 8,
  },
  starredCard: {
    alignItems: 'center',
    width: 64,
  },
  photoAvatarRing: {
    position: 'relative',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#4326B6',
    padding: 1.5,
    marginBottom: 6,
  },
  starredPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  initialsAvatar: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  initialsText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 14,
    color: '#334155',
  },
  avatarStatusBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  addStarredCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  starredCardName: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 11.5,
    color: '#1A191F',
    textAlign: 'center',
  },
  starredCardDept: {
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    fontSize: 10,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 1,
  },
  addStarredText: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 10.5,
    color: '#64748B',
    textAlign: 'center',
  },
  starredEmptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  starredEmptyText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12.5,
    color: '#94A3B8',
  },
  starToggleBtn: {
    padding: 6,
    marginRight: 4,
    alignItems: 'center',
    justifyContent: 'center',
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

  // ── 5. Live Faculty Directory Header ───────────────────────────────────────
  directoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
    paddingVertical: 3,
  },
  availableBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 11,
    color: '#475569',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#475569',
  },

  // ── 6. Faculty Cards List ──────────────────────────────────────────────────
  facultyCardsList: {
    gap: 14,
  },
  facultyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#1A191F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardAvatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  cardAvatarPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginVertical: 10,
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
    marginRight: 10,
  },
  cardLocationText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11.5,
    color: '#334155',
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
