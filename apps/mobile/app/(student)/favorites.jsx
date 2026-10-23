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
  const [starredUids, setStarredUids] = useState(
    new Set(['demo-faculty-ecs-01', 'demo-faculty-ecs-02', 'demo-faculty-cmpn-04', 'demo-faculty-robotics-01'])
  );

  // Ping Modal & notification states
  const [pingModalFaculty, setPingModalFaculty] = useState(null);
  const [pingReason, setPingReason] = useState('Doubt in Assignment');
  const [pingSuccess, setPingSuccess] = useState(false);
  const [queuedUids, setQueuedUids] = useState(new Set());

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

  const toggleStar = (uid) => {
    setStarredUids((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        next.add(uid);
      }
      return next;
    });
  };

  const handlePingSubmit = () => {
    setPingSuccess(true);
    setTimeout(() => {
      setPingSuccess(false);
      setPingModalFaculty(null);
    }, 1400);
  };

  const handleNotifyQueue = (fac) => {
    setQueuedUids((prev) => {
      const next = new Set(prev);
      if (next.has(fac.uid)) {
        next.delete(fac.uid);
        Alert.alert('Alert Removed', `You will no longer be notified when ${fac.name} becomes free.`);
      } else {
        next.add(fac.uid);
        Alert.alert(
          'Queue Notification Set',
          `You will receive an instant notification as soon as ${fac.name} marks their status Available.`
        );
      }
      return next;
    });
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
              {searchQuery.trim() ? 'No Matching Favorites' : 'No Starred Faculty Yet'}
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
              const isAvailable = fac.status?.state === 'AVAILABLE';
              const isInLecture = fac.status?.state === 'IN_LECTURE';
              const isBusy = fac.status?.state === 'BUSY';
              const isQueued = queuedUids.has(fac.uid);

              return (
                <View key={fac.uid} style={styles.facultyCard}>
                  {/* Top Row: Avatar, Identity, Star Toggle */}
                  <View style={styles.cardTopRow}>
                    {/* Avatar with Status Dot */}
                    <View style={styles.avatarWrapper}>
                      {fac.photoUrl ? (
                        <Image source={{ uri: fac.photoUrl }} style={styles.avatarImage} />
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
                            backgroundColor: isAvailable
                              ? '#15803D'
                              : isInLecture
                              ? '#2563EB'
                              : '#DC2626',
                          },
                        ]}
                      />
                    </View>

                    {/* Faculty Info */}
                    <View style={styles.facultyInfo}>
                      <Text style={styles.facultyName} numberOfLines={1}>
                        {fac.name}
                      </Text>
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
                              backgroundColor: isAvailable
                                ? '#DCFCE7'
                                : isInLecture
                                ? '#DBEAFE'
                                : '#FEF3C7',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.presenceText,
                              {
                                color: isAvailable
                                  ? '#15803D'
                                  : isInLecture
                                  ? '#1D4ED8'
                                  : '#B45309',
                              },
                            ]}
                          >
                            {isAvailable
                              ? 'Available in Cabin'
                              : isInLecture
                              ? 'In Lecture'
                              : 'Busy'}
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

                  {/* Action Buttons Row */}
                  <View style={styles.cardActionsRow}>
                    {isAvailable ? (
                      <TouchableOpacity
                        style={styles.primaryPingBtn}
                        onPress={() => setPingModalFaculty(fac)}
                        activeOpacity={0.85}
                      >
                        <FontAwesome5 name="bell" size={12} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.primaryPingBtnText}>Ping Faculty</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.notifyWhenFreeBtn,
                          isQueued && styles.notifyWhenFreeBtnActive,
                        ]}
                        onPress={() => handleNotifyQueue(fac)}
                        activeOpacity={0.85}
                      >
                        <FontAwesome5
                          name={isQueued ? 'check-circle' : 'bell'}
                          size={12}
                          color={isQueued ? '#15803D' : '#4326B6'}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.notifyWhenFreeBtnText,
                            isQueued && styles.notifyWhenFreeBtnTextActive,
                          ]}
                        >
                          {isQueued ? 'Alert Queued ✔' : 'Notify When Free'}
                        </Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.mapShortcutBtn}
                      onPress={() => router.replace('/(student)/maps')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="map-outline" size={14} color="#4326B6" style={{ marginRight: 4 }} />
                      <Text style={styles.mapShortcutBtnText}>Locate</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Bottom breathing space for persistent capsule navbar */}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── PING MODAL ─────────────────────────────────────────────────── */}
      {pingModalFaculty && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setPingModalFaculty(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.pingSheetCard}>
              <View style={styles.pingSheetHeader}>
                <View style={styles.pingShieldIcon}>
                  <FontAwesome5 name="bell" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.pingSheetTitle}>Ping {pingModalFaculty.name}</Text>
                <Text style={styles.pingSheetSubtitle}>
                  Location: {pingModalFaculty.cabin || 'Cabin 304 • SFIT Wing B'}
                </Text>
              </View>

              {pingSuccess ? (
                <View style={styles.pingSuccessBox}>
                  <FontAwesome5 name="check-circle" size={32} color="#15803D" />
                  <Text style={styles.pingSuccessText}>Ping Sent Successfully!</Text>
                  <Text style={styles.pingSuccessSub}>
                    {pingModalFaculty.name} has been notified on their desktop and phone broadcast.
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.reasonLabel}>Select reason for visit:</Text>
                  {[
                    'Doubt in Assignment / Lab',
                    'Project Guidance & Sign-off',
                    'Recommendation Letter / Inquiry',
                    'Quick 2-minute query',
                  ].map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.reasonChip,
                        pingReason === r && styles.reasonChipSelected,
                      ]}
                      onPress={() => setPingReason(r)}
                    >
                      <FontAwesome5
                        name={pingReason === r ? 'dot-circle' : 'circle'}
                        size={13}
                        color={pingReason === r ? '#4326B6' : '#94A3B8'}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={[
                          styles.reasonText,
                          pingReason === r && styles.reasonTextSelected,
                        ]}
                      >
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  <View style={styles.pingActionRow}>
                    <TouchableOpacity
                      style={styles.pingCancelBtn}
                      onPress={() => setPingModalFaculty(null)}
                    >
                      <Text style={styles.pingCancelBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.pingConfirmBtn}
                      onPress={handlePingSubmit}
                    >
                      <Text style={styles.pingConfirmBtnText}>Send Ping 🔔</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      )}
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
    gap: 8,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  primaryPingBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4326B6',
    borderRadius: 10,
    paddingVertical: 9,
  },
  primaryPingBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12.5,
    color: '#FFFFFF',
  },
  notifyWhenFreeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF8FE',
    borderRadius: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  notifyWhenFreeBtnActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  notifyWhenFreeBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#4326B6',
  },
  notifyWhenFreeBtnTextActive: {
    color: '#15803D',
  },
  mapShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
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

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  pingSheetCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  pingSheetHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  pingShieldIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4326B6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  pingSheetTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 17,
    color: '#1A191F',
    marginBottom: 3,
  },
  pingSheetSubtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#64748B',
  },
  reasonLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12.5,
    color: '#334155',
    marginBottom: 10,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8FE',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  reasonChipSelected: {
    backgroundColor: '#EDE9FE',
    borderColor: '#4326B6',
  },
  reasonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#334155',
  },
  reasonTextSelected: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#4326B6',
  },
  pingActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  pingCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
  },
  pingCancelBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13.5,
    color: '#475569',
  },
  pingConfirmBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4326B6',
    borderRadius: 12,
    paddingVertical: 12,
  },
  pingConfirmBtnText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  pingSuccessBox: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  pingSuccessText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 16,
    color: '#15803D',
    marginTop: 10,
    marginBottom: 4,
  },
  pingSuccessSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
