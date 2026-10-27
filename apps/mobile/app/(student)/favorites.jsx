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
import { STATUS_KEYS } from '@profping/shared';
import { subscribeToLiveDirectory } from '../../src/services/directoryService';
import { getStarredFacultyUids, toggleStarredFacultyUid } from '../../src/services/favoritesStorage';
import { subscribeToStudentNotifyRequests, toggleNotifyWhenFree } from '../../src/services/notificationService';

// Status Config Matching Campus Clarity Design System
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

export default function StudentFavoritesPage() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const { user } = useAuth();
  const router = useRouter();

  const [facultyList, setFacultyList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [starredUids, setStarredUids] = useState(new Set());
  const [notifySet, setNotifySet] = useState(new Set());

  // Load persistent starred UIDs on mount
  useEffect(() => {
    getStarredFacultyUids().then((set) => setStarredUids(set));
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToStudentNotifyRequests(user.uid, (set) => setNotifySet(set));
    return unsub;
  }, [user?.uid]);

  const handleToggleNotify = async (facUid) => {
    if (!user?.uid) return;
    const isNowSet = await toggleNotifyWhenFree(facUid, user.uid);
    setNotifySet((prev) => {
      const next = new Set(prev);
      if (isNowSet) next.add(facUid);
      else next.delete(facUid);
      return next;
    });
  };

  // Subscribe to live Firestore faculty directory
  useEffect(() => {
    const unsubscribe = subscribeToLiveDirectory((list) => {
      setFacultyList(list || []);
    });
    return () => unsubscribe();
  }, []);

  // Filter only starred faculty + search query
  const starredFaculty = useMemo(() => {
    return facultyList.filter((fac) => {
      if (!starredUids.has(fac.uid)) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (fac.name || '').toLowerCase().includes(q) ||
        (fac.designation || '').toLowerCase().includes(q) ||
        (fac.cabin || '').toLowerCase().includes(q) ||
        (fac.department || '').toLowerCase().includes(q)
      );
    });
  }, [facultyList, starredUids, searchQuery]);

  const toggleStar = async (uid) => {
    const next = await toggleStarredFacultyUid(uid);
    setStarredUids(new Set(next));
  };



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

      {/* ── 1. TOP HEADER BAR (No back button, matches Home & Profile) ──── */}
      <View style={styles.topHeader}>
        <View style={styles.titleBlock}>
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>BOOKMARKED FACULTY</Text>
          </View>
          <Text style={styles.screenTitle}>Favorites</Text>
        </View>

        {/* Right Star Counter Pill */}
        <View style={styles.starredCountBadge}>
          <FontAwesome5 name="star" solid size={11} color="#D97706" style={{ marginRight: 6 }} />
          <Text style={styles.starredCountText}>
            {starredFaculty.length} {starredFaculty.length === 1 ? 'Professor' : 'Professors'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 2. SEARCH WITHIN FAVORITES ───────────────────────────────── */}
        <View style={styles.searchContainer}>
          <FontAwesome5 name="search" size={13} color="#94A3B8" style={styles.searchLens} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search within starred professors..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* ── 3. STARRED FACULTY CARDS ─────────────────────────────────── */}
        {starredFaculty.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <FontAwesome5 name="bookmark" size={28} color="#4326B6" />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery.trim() ? 'No Matching Favorites' : 'No starred faculty'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery.trim()
                ? `No starred faculty match "${searchQuery}". Try a different name or clear the search.`
                : 'Bookmark professors from the Home directory to easily monitor their cabin availability and send quick pings.'}
            </Text>

            {!searchQuery.trim() && (
              <TouchableOpacity
                style={styles.exploreBtn}
                onPress={() => router.replace('/(student)')}
                activeOpacity={0.85}
              >
                <FontAwesome5 name="compass" size={13} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.exploreBtnText}>Browse Faculty Directory</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.cardList}>
            {starredFaculty.map((fac) => {
              const state = fac.status?.state || STATUS_KEYS.AVAILABLE;
              const rawState = (state || 'available').toLowerCase();
              const badge = BADGE_MAP[rawState] || BADGE_MAP.available;
              const updatedInfo = getFacultyUpdatedInfo(fac);

              return (
                <View key={fac.uid} style={styles.facultyCard}>
                  {/* Top Row: Avatar, Identity, Star Toggle */}
                  <View style={styles.cardTopRow}>
                    {/* Avatar with Status Dot */}
                    <View style={styles.avatarWrapper}>
                      {fac.photoURL || fac.photoUrl ? (
                        <Image source={{ uri: fac.photoURL || fac.photoUrl }} style={styles.avatarImage} />
                      ) : (
                        <View style={styles.avatarFallback}>
                          <Text style={styles.avatarInitials}>
                            {(fac.name || 'P')
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: badge.dotColor,
                          },
                        ]}
                      />
                    </View>

                    {/* Faculty Info */}
                    <View style={styles.facultyInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Text style={styles.facultyName} numberOfLines={1}>
                          {fac.name}
                        </Text>
                        {(fac.isHod || fac.role === 'hod' || (fac.designation || '').toLowerCase().includes('hod')) && (
                          <View style={styles.hodCardBadge}>
                            <FontAwesome5 name="user-tie" size={8} color="#4326B6" style={{ marginRight: 3 }} />
                            <Text style={styles.hodCardBadgeText}>HOD</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.facultyDesignation} numberOfLines={1}>
                        {fac.designation || 'Faculty'} • {fac.department || 'Academic Dept'}
                      </Text>

                      {/* Cabin & Status Pill Row */}
                      <View style={styles.statusPillRow}>
                        <View style={styles.cabinBadge}>
                          <Ionicons name="location-outline" size={11} color="#4326B6" style={{ marginRight: 3 }} />
                          <Text style={styles.cabinText}>{fac.cabin || 'Cabin 301'}</Text>
                        </View>

                        <View
                          style={[
                            styles.presencePill,
                            {
                              backgroundColor: badge.badgeBg,
                            },
                          ]}
                        >
                          <FontAwesome5
                            name={badge.icon}
                            size={9}
                            color={badge.badgeText}
                            style={{ marginRight: 4 }}
                          />
                          <Text
                            style={[
                              styles.presenceText,
                              {
                                color: badge.badgeText,
                              },
                            ]}
                          >
                            {badge.label}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Bookmark Star Toggle Button */}
                    <TouchableOpacity
                      style={styles.starToggleBtn}
                      onPress={() => toggleStar(fac.uid)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <FontAwesome5 name="star" solid size={17} color="#F59E0B" />
                    </TouchableOpacity>
                  </View>

                  {/* Status Custom Message if present */}
                  {fac.status?.message ? (
                    <View style={styles.customMessageBox}>
                      <Ionicons name="chatbubble-ellipses-outline" size={12} color="#64748B" style={{ marginRight: 6 }} />
                      <Text style={styles.customMessageText} numberOfLines={2}>
                        "{fac.status.message}"
                      </Text>
                    </View>
                  ) : null}

                  {/* Action & Relative Time Row */}
                  <View style={styles.cardActionsRow}>
                    <View style={styles.timeStaleContainer}>
                      <Text style={styles.updatedTimeText}>{updatedInfo.text}</Text>
                      {updatedInfo.isStale && (
                        <View style={styles.staleTag}>
                          <FontAwesome5 name="history" size={8.5} color="#B45309" style={{ marginRight: 3 }} />
                          <Text style={styles.staleTagText}>Stale</Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity
                      style={styles.mapShortcutBtn}
                      onPress={() => router.replace('/(student)/maps')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="business-outline" size={13} color="#4326B6" style={{ marginRight: 4 }} />
                      <Text style={styles.mapShortcutBtnText}>Cabins</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Notify When Free Button */}
                  {state !== STATUS_KEYS.AVAILABLE && (
                    <TouchableOpacity
                      style={[
                        styles.notifyMeBtn,
                        notifySet.has(fac.uid) && styles.notifyMeBtnActive,
                      ]}
                      onPress={() => handleToggleNotify(fac.uid)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={notifySet.has(fac.uid) ? 'notifications' : 'notifications-outline'}
                        size={12}
                        color={notifySet.has(fac.uid) ? '#190D4A' : '#492FB1'}
                        style={{ marginRight: 5 }}
                      />
                      <Text
                        style={[
                          styles.notifyMeBtnText,
                          notifySet.has(fac.uid) && styles.notifyMeBtnTextActive,
                        ]}
                      >
                        {notifySet.has(fac.uid) ? "You'll be notified" : 'Notify me'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Bottom breathing space for persistent capsule navbar */}
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

  // 1. Top Header Bar
  topHeader: {
    backgroundColor: '#FAF8FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 62 : 46,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  titleBlock: {
    flex: 1,
  },
  headerTag: {
    backgroundColor: '#EDE9FE',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  headerTagText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 9.5,
    color: '#4326B6',
    letterSpacing: 0.5,
  },
  screenTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontWeight: '800',
    fontSize: 20,
    color: '#2E1065',
    letterSpacing: -0.4,
  },
  starredCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  starredCountText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 11,
    color: '#92400E',
  },

  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  // 2. Search Box
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#1A191F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
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

  // 3. Card List
  cardList: {
    gap: 12,
  },
  facultyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1A191F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDE9FE',
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 16,
    color: '#4326B6',
  },
  statusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  facultyInfo: {
    flex: 1,
  },
  facultyName: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 15,
    color: '#1A191F',
    marginBottom: 2,
  },
  hodCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    marginLeft: 6,
    marginBottom: 2,
  },
  hodCardBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 9.5,
    color: '#4326B6',
    letterSpacing: 0.4,
  },
  facultyDesignation: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 6,
  },
  statusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  cabinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8FE',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cabinText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10.5,
    color: '#4326B6',
  },
  presencePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  presenceText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10.5,
  },
  starToggleBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  customMessageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8FE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#4326B6',
  },
  customMessageText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11.5,
    color: '#475569',
    fontStyle: 'italic',
    flex: 1,
  },

  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  timeStaleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
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
  mapShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mapShortcutBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#4326B6',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 17,
    color: '#1A191F',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4326B6',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  exploreBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  notifyMeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8FE',
    borderWidth: 1,
    borderColor: '#E9E7F1',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  notifyMeBtnActive: {
    backgroundColor: '#E0D8FD',
    borderColor: '#C8C5D3',
  },
  notifyMeBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#492FB1',
  },
  notifyMeBtnTextActive: {
    color: '#190D4A',
    fontWeight: '700',
  },
});

