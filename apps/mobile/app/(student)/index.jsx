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
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { STATUS_CONFIG, STATUS_KEYS, DEPARTMENTS } from '@profping/shared';
import { subscribeToLiveDirectory } from '../../src/services/directoryService';

// ── Avatar color palette (cycles by name initial) ─────────────────────────
const AVATAR_COLORS = [
  { bg: '#FEF3C7', text: '#92400E' }, // amber
  { bg: '#FCE7F3', text: '#9D174D' }, // pink
  { bg: '#D1FAE5', text: '#065F46' }, // green
  { bg: '#DBEAFE', text: '#1E40AF' }, // blue
  { bg: '#EDE9FE', text: '#5B21B6' }, // purple
  { bg: '#FEE2E2', text: '#991B1B' }, // red
  { bg: '#E0F2FE', text: '#0369A1' }, // sky
  { bg: '#FFF7ED', text: '#9A3412' }, // orange
];

function getAvatarColor(name = '') {
  const idx = (name.charCodeAt(0) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function getInitials(name = '') {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] || 'F').toUpperCase();
}

// ── Status badge config (light-mode colors) ────────────────────────────────
const BADGE = {
  available:   { label: 'Available',   bg: '#DCFCE7', text: '#16A34A', dot: '#22C55E' },
  busy:        { label: 'Busy (DND)',  bg: '#FEF9C3', text: '#A16207', dot: '#EAB308' },
  in_lecture:  { label: 'In Lecture',  bg: '#FCE7F3', text: '#BE185D', dot: '#EC4899' },
  off_campus:  { label: 'Off Campus',  bg: '#F1F5F9', text: '#64748B', dot: '#94A3B8' },
};

export default function StudentHomeScreen() {
  const { user, department, logout } = useAuth();
  const router = useRouter();

  const [facultyList, setFacultyList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'STARRED' | dept id
  const [starredUids, setStarredUids] = useState(new Set());
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // bottom nav tab

  // Subscribe to live directory
  useEffect(() => {
    const unsubscribe = subscribeToLiveDirectory((list) => {
      setFacultyList(list || []);
    });
    return () => unsubscribe();
  }, []);

  // Filtered list
  const filteredList = useMemo(() => {
    return facultyList.filter((item) => {
      if (activeFilter === 'STARRED' && !starredUids.has(item.uid)) return false;
      if (activeFilter !== 'ALL' && activeFilter !== 'STARRED' && item.department !== activeFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (item.name || '').toLowerCase().includes(q) ||
        (item.designation || '').toLowerCase().includes(q) ||
        (item.status?.message || '').toLowerCase().includes(q) ||
        (item.department || '').toLowerCase().includes(q)
      );
    });
  }, [facultyList, activeFilter, searchQuery, starredUids]);

  // Starred faculty list (from full list)
  const starredList = useMemo(
    () => facultyList.filter((f) => starredUids.has(f.uid)),
    [facultyList, starredUids]
  );

  // Count online faculty
  const onlineCount = useMemo(
    () => facultyList.filter((f) => f.status?.state !== STATUS_KEYS.OFF_CAMPUS).length,
    [facultyList]
  );

  const toggleStar = (uid) => {
    setStarredUids((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const handlePingNow = (faculty) => {
    Alert.alert(
      `Ping ${faculty.name}`,
      `Sending availability request to ${faculty.name}.\n\nCurrent status: ${BADGE[faculty.status?.state || 'off_campus']?.label}`,
      [{ text: 'OK' }]
    );
  };

  // Filter chips data
  const filterChips = [
    { id: 'ALL', label: 'All Faculty' },
    { id: 'STARRED', label: 'Starred' },
    ...DEPARTMENTS.map((d) => ({ id: d.id, label: d.id + ' Dept' })),
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* ── FIXED HEADER ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <View style={styles.brandRow}>
            <Text style={styles.brandProf}>PROF-PING</Text>
            <View style={styles.campusBadge}>
              <Text style={styles.campusBadgeText}>CAMPUS</Text>
            </View>
          </View>
          <Text style={styles.headerSub}>STUDENT DIRECTORY</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <FontAwesome5 name="bell" size={15} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn}>
            <FontAwesome5 name="question-circle" size={15} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
      >
        {/* ── STICKY: Search + Filters ──────────────────────────────── */}
        <View style={styles.stickyTop}>
          {/* Search */}
          <View style={styles.searchBar}>
            <FontAwesome5 name="search" size={14} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by professor, cabin, or department..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <FontAwesome5 name="times-circle" solid size={15} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContent}>
            {filterChips.map((chip) => {
              const isActive = activeFilter === chip.id;
              return (
                <TouchableOpacity
                  key={chip.id}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setActiveFilter(chip.id)}
                  activeOpacity={0.8}
                >
                  {chip.id === 'STARRED' && (
                    <FontAwesome5
                      name="star"
                      solid
                      size={11}
                      color={isActive ? '#ffffff' : '#F59E0B'}
                      style={{ marginRight: 6 }}
                    />
                  )}
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Campus Activity Banner ─────────────────────────────────── */}
        <View style={styles.activityBanner}>
          <View style={styles.activityLeft}>
            <View style={styles.greenPulse} />
            <Text style={styles.activityText}>
              Today's Campus Activity:{' '}
              <Text style={styles.activityCount}>{onlineCount} Faculty Online</Text>
              {' & Syncing'}
            </Text>
          </View>
          <FontAwesome5 name="wifi" size={14} color="#16A34A" />
        </View>

        {/* ── STARRED FACULTY ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <FontAwesome5 name="star" solid size={11} color="#F59E0B" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>STARRED FACULTY</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.manageLink}>Manage ({starredUids.size})</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.starredScroll}>
            {starredList.length === 0 && (
              <View style={styles.noStarredRow}>
                <Text style={styles.noStarredText}>Tap </Text>
                <FontAwesome5 name="star" solid size={11} color="#F59E0B" />
                <Text style={styles.noStarredText}> on a faculty card to star them</Text>
              </View>
            )}
            {starredList.map((fac) => {
              const av = getAvatarColor(fac.name);
              const badge = BADGE[fac.status?.state || 'off_campus'];
              return (
                <TouchableOpacity
                  key={fac.uid}
                  style={styles.starredItem}
                  onPress={() => setSelectedFaculty(fac)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.starredAvatar, { backgroundColor: av.bg }]}>
                    <Text style={[styles.starredAvatarText, { color: av.text }]}>
                      {getInitials(fac.name)}
                    </Text>
                    <View style={[styles.starredStatusDot, { backgroundColor: badge.dot }]} />
                  </View>
                  <Text style={styles.starredName} numberOfLines={1}>
                    {fac.name.split(' ')[0]}
                  </Text>
                  <Text style={styles.starredDept} numberOfLines={1}>
                    {fac.department} Dept
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.addStarredBtn} onPress={() => setActiveFilter('ALL')}>
              <FontAwesome5 name="plus" size={15} color="#94A3B8" />
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ── LIVE DIRECTORY ──────────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              LIVE FACULTY DIRECTORY ({filteredList.length})
            </Text>
            <TouchableOpacity style={styles.filterBtn}>
              <FontAwesome5 name="sliders-h" size={11} color="#475569" style={{ marginRight: 6 }} />
              <Text style={styles.filterBtnText}>Filter</Text>
            </TouchableOpacity>
          </View>

          {filteredList.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome5 name="search" size={32} color="#CBD5E1" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No Faculty Found</Text>
              <Text style={styles.emptyDesc}>
                Try a different search or filter.
              </Text>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => { setSearchQuery(''); setActiveFilter('ALL'); }}
              >
                <Text style={styles.resetBtnText}>Reset Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredList.map((faculty) => {
              const badge = BADGE[faculty.status?.state || 'off_campus'];
              const av = getAvatarColor(faculty.name);
              const isStarred = starredUids.has(faculty.uid);
              const msg = faculty.status?.message || '';

              return (
                <TouchableOpacity
                  key={faculty.uid}
                  style={styles.facultyCard}
                  onPress={() => setSelectedFaculty(faculty)}
                  activeOpacity={0.92}
                >
                  {/* Row 1: Avatar + Info + Badge */}
                  <View style={styles.cardTop}>
                    <View style={[styles.avatar, { backgroundColor: av.bg }]}>
                      <Text style={[styles.avatarText, { color: av.text }]}>
                        {getInitials(faculty.name)}
                      </Text>
                    </View>

                    <View style={styles.cardInfo}>
                      <View style={styles.cardNameRow}>
                        <View style={styles.cardNameInline}>
                          <Text style={styles.cardName} numberOfLines={1}>
                            {faculty.name}
                          </Text>
                          {isStarred && (
                            <FontAwesome5 name="star" solid size={11} color="#F59E0B" style={{ marginLeft: 5 }} />
                          )}
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                          <View style={[styles.badgeDot, { backgroundColor: badge.dot }]} />
                          <Text style={[styles.badgeText, { color: badge.text }]}>
                            {badge.label}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.cardDesig} numberOfLines={1}>
                        {faculty.designation || 'Faculty'} • {faculty.department} Dept
                      </Text>
                    </View>
                  </View>

                  {/* Row 2: Location + Ping */}
                  <View style={styles.cardMid}>
                    <View style={styles.locationRow}>
                      <FontAwesome5 name="map-marker-alt" size={11} color="#64748B" style={{ marginRight: 6 }} />
                      <Text style={styles.locationText} numberOfLines={1}>
                        {msg || `${faculty.department} Dept Cabin`}
                      </Text>
                    </View>
                    {faculty.status?.state === STATUS_KEYS.AVAILABLE && (
                      <TouchableOpacity
                        style={styles.pingBtn}
                        onPress={() => handlePingNow(faculty)}
                        activeOpacity={0.85}
                      >
                        <FontAwesome5 name="bolt" size={11} color="#ffffff" style={{ marginRight: 5 }} />
                        <Text style={styles.pingBtnText}>Ping Now</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Row 3: Status context line */}
                  {faculty.status?.state === STATUS_KEYS.IN_LECTURE && msg ? (
                    <View style={styles.contextChip}>
                      <Text style={[styles.contextText, { color: '#BE185D' }]}>{msg}</Text>
                    </View>
                  ) : faculty.status?.state === STATUS_KEYS.BUSY && msg ? (
                    <View style={styles.returningRow}>
                      <FontAwesome5 name="clock" size={11} color="#B45309" style={{ marginRight: 5 }} />
                      <Text style={styles.returningText}>{msg}</Text>
                    </View>
                  ) : null}

                  {/* Star button */}
                  <TouchableOpacity
                    style={styles.starBtn}
                    onPress={() => toggleStar(faculty.uid)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <FontAwesome5
                      name="star"
                      solid={isStarred}
                      size={18}
                      color={isStarred ? '#F59E0B' : '#CBD5E1'}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ── BOTTOM NAV ─────────────────────────────────────────────────── */}
      <View style={styles.bottomNav}>
        {[
          { id: 'home', iconName: 'home', label: 'Home' },
          { id: 'maps', iconName: 'map-marked-alt', label: 'Maps' },
          { id: 'favorites', iconName: 'star', solid: true, label: 'Favorites' },
          { id: 'profile', iconName: 'user-alt', label: 'Profile' },
        ].map((tab) => {
          const isActive = tab.id === 'favorites' ? activeFilter === 'STARRED' : activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.navTab}
              onPress={() => {
                if (tab.id === 'favorites') setActiveFilter('STARRED');
                else if (tab.id === 'profile') handleLogout();
                else setActiveTab(tab.id);
              }}
              activeOpacity={0.8}
            >
              <FontAwesome5
                name={tab.iconName}
                solid={tab.solid || isActive}
                size={18}
                color={isActive ? BLUE : '#94A3B8'}
                style={{ marginBottom: 4 }}
              />
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── FACULTY DETAIL MODAL ─────────────────────────────────────── */}
      {selectedFaculty && (() => {
        const fac = selectedFaculty;
        const badge = BADGE[fac.status?.state || 'off_campus'];
        const av = getAvatarColor(fac.name);
        const isStarred = starredUids.has(fac.uid);
        return (
          <Modal
            visible
            transparent
            animationType="slide"
            onRequestClose={() => setSelectedFaculty(null)}
          >
            <View style={styles.modalBackdrop}>
              <View style={styles.modalSheet}>
                {/* Handle */}
                <View style={styles.modalHandle} />

                {/* Avatar + Name */}
                <View style={styles.modalTop}>
                  <View style={[styles.modalAvatar, { backgroundColor: av.bg }]}>
                    <Text style={[styles.modalAvatarText, { color: av.text }]}>
                      {getInitials(fac.name)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalName}>{fac.name}</Text>
                    <Text style={styles.modalDesig}>
                      {fac.designation || 'Faculty'} • {fac.department}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => toggleStar(fac.uid)}>
                    <FontAwesome5
                      name="star"
                      solid={isStarred}
                      size={24}
                      color={isStarred ? '#F59E0B' : '#CBD5E1'}
                    />
                  </TouchableOpacity>
                </View>

                {/* Status Block */}
                <View style={[styles.modalStatusBox, { backgroundColor: badge.bg }]}>
                  <View style={[styles.badgeDot, { backgroundColor: badge.dot, marginRight: 8 }]} />
                  <View>
                    <Text style={[styles.modalStatusLabel, { color: badge.text }]}>{badge.label}</Text>
                    {fac.status?.message ? (
                      <Text style={styles.modalStatusMsg}>"{fac.status.message}"</Text>
                    ) : null}
                  </View>
                </View>

                {/* Last updated */}
                <Text style={styles.modalUpdated}>
                  Last updated:{' '}
                  {fac.status?.updatedAt
                    ? new Date(fac.status.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </Text>

                {/* Actions */}
                {fac.status?.state === STATUS_KEYS.AVAILABLE && (
                  <TouchableOpacity
                    style={styles.modalPingBtn}
                    onPress={() => { setSelectedFaculty(null); handlePingNow(fac); }}
                  >
                    <FontAwesome5 name="bolt" size={14} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.modalPingText}>Ping Now</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedFaculty(null)}>
                  <Text style={styles.modalCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        );
      })()}
    </View>
  );
}

// ── STYLES ─────────────────────────────────────────────────────────────────
const NAVY = '#0F172A';
const BLUE = '#2563EB';
const GRAY = '#6B7280';
const LIGHT_BG = '#F8FAFC';
const BORDER = '#E2E8F0';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: LIGHT_BG },

  // Header
  header: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandProf: { fontSize: 18, fontWeight: '900', color: NAVY, letterSpacing: -0.3 },
  campusBadge: {
    backgroundColor: '#DBEAFE',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 4,
  },
  campusBadgeText: { fontSize: 10, fontWeight: '800', color: BLUE, letterSpacing: 0.5 },
  headerSub: { fontSize: 11, color: GRAY, fontWeight: '600', marginTop: 2, letterSpacing: 0.5 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerIconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  headerIcon: { fontSize: 15 },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },

  // Sticky top (search + chips)
  stickyTop: { backgroundColor: LIGHT_BG, paddingTop: 12, paddingBottom: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 50,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 13, color: NAVY },
  chipsScroll: { marginTop: 10 },
  chipsContent: { paddingHorizontal: 16, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: 50, borderWidth: 1.5,
    borderColor: BORDER, backgroundColor: '#ffffff',
  },
  chipActive: { backgroundColor: BLUE, borderColor: BLUE },
  chipText: { fontSize: 12, fontWeight: '600', color: GRAY },
  chipTextActive: { color: '#ffffff' },

  // Activity banner
  activityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  activityLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  greenPulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22C55E' },
  activityText: { fontSize: 12, color: '#065F46', flex: 1 },
  activityCount: { fontWeight: '700' },

  // Sections
  section: { paddingHorizontal: 16, marginTop: 22 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: {
    fontSize: 12, fontWeight: '800', color: NAVY,
    letterSpacing: 0.6, textTransform: 'uppercase',
  },
  manageLink: { fontSize: 12, fontWeight: '600', color: BLUE },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 5, paddingHorizontal: 10,
    borderRadius: 6,
  },
  filterBtnText: { fontSize: 12, fontWeight: '600', color: NAVY },

  // Starred Faculty
  starredScroll: { paddingRight: 8, gap: 12 },
  starredItem: { alignItems: 'center', width: 64 },
  starredAvatar: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  starredAvatarText: { fontSize: 18, fontWeight: '800' },
  starredStatusDot: {
    width: 12, height: 12, borderRadius: 6,
    position: 'absolute', bottom: 2, right: 2,
    borderWidth: 2, borderColor: '#ffffff',
  },
  starredName: {
    fontSize: 11, fontWeight: '600', color: NAVY,
    marginTop: 5, textAlign: 'center',
  },
  starredDept: { fontSize: 10, color: GRAY, textAlign: 'center', marginTop: 1 },
  noStarredRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  noStarredText: { fontSize: 12, color: GRAY, fontStyle: 'italic' },
  addStarredBtn: {
    width: 54, height: 54, borderRadius: 27,
    borderWidth: 2, borderColor: BORDER,
    borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },

  // Faculty cards
  facultyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    marginBottom: 10,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '800' },
  cardInfo: { flex: 1 },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 3,
    paddingRight: 26,
  },
  cardNameInline: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 6 },
  cardName: { fontSize: 14, fontWeight: '700', color: NAVY },
  cardDesig: { fontSize: 11, color: GRAY },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 3, paddingHorizontal: 8,
    borderRadius: 50, gap: 4,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  cardMid: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  locationRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  locationText: { fontSize: 12, color: GRAY, flex: 1 },
  pingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BLUE, paddingVertical: 5, paddingHorizontal: 12,
    borderRadius: 50,
  },
  pingBtnText: { fontSize: 11, fontWeight: '700', color: '#ffffff' },

  contextChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#FCE7F3',
    paddingVertical: 3, paddingHorizontal: 10,
    borderRadius: 50, marginTop: 8,
  },
  contextText: { fontSize: 11, fontWeight: '600' },
  returningRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  returningText: { fontSize: 11, color: '#D97706', fontWeight: '500' },

  starBtn: { position: 'absolute', top: 14, right: 14, padding: 4 },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: NAVY, marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: GRAY, textAlign: 'center', marginBottom: 16 },
  resetBtn: {
    backgroundColor: BLUE, paddingVertical: 8, paddingHorizontal: 20,
    borderRadius: 50,
  },
  resetBtnText: { fontSize: 13, fontWeight: '700', color: '#ffffff' },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingBottom: 20,
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navTab: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  navLabel: { fontSize: 10, color: GRAY, fontWeight: '500' },
  navLabelActive: { color: BLUE, fontWeight: '700' },

  // Modal
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center', marginBottom: 20,
  },
  modalTop: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  modalAvatar: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center',
  },
  modalAvatarText: { fontSize: 20, fontWeight: '800' },
  modalName: { fontSize: 17, fontWeight: '800', color: NAVY },
  modalDesig: { fontSize: 12, color: GRAY, marginTop: 2 },
  modalStatusBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    borderRadius: 12, padding: 14, marginBottom: 12,
  },
  modalStatusLabel: { fontSize: 14, fontWeight: '700' },
  modalStatusMsg: { fontSize: 12, color: GRAY, marginTop: 2, fontStyle: 'italic' },
  modalUpdated: { fontSize: 12, color: GRAY, marginBottom: 20 },
  modalPingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BLUE, borderRadius: 50,
    height: 48,
    marginBottom: 10,
  },
  modalPingText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
  modalCloseBtn: {
    backgroundColor: '#F1F5F9', borderRadius: 50,
    height: 44, alignItems: 'center', justifyContent: 'center',
  },
  modalCloseBtnText: { fontSize: 14, fontWeight: '600', color: NAVY },
});
