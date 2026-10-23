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
    label: 'Busy (DND)',
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

  const [starredUids, setStarredUids] = useState(
    new Set(['demo-faculty-ecs-01', 'demo-faculty-ecs-02', 'demo-faculty-cmpn-04', 'demo-faculty-robotics-01'])
  );

  // Modal & interaction states
  const [pingModalFaculty, setPingModalFaculty] = useState(null);
  const [pingReason, setPingReason] = useState('Doubt in Assignment');
  const [pingSuccess, setPingSuccess] = useState(false);
  const [queuedUids, setQueuedUids] = useState(new Set());

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
        Alert.alert('Queue Cancelled', `You removed auto-alert for ${fac.name}.`);
      } else {
        next.add(fac.uid);
        Alert.alert(
          'Auto-Alert Queued 🔔',
          `You will be notified via institutional push notification the moment ${fac.name} changes status to Available.`
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

        {/* Top Header Right Icons */}
        <View style={styles.topHeaderRight}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() =>
              Alert.alert('Notifications', 'No urgent broadcast alerts at this time.')
            }
          >
            <FontAwesome5 name="bell" size={15} color="#334155" />
            <View style={styles.unreadDot} />
          </TouchableOpacity>
        </View>
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
            <TouchableOpacity onPress={() => setActiveFilter('STARRED')}>
              <Text style={styles.manageLink}>Manage ({starredUids.size})</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.starredListContent}
          >
            {/* Dr. Mehta (Real Photo) */}
            <TouchableOpacity
              style={styles.starredCard}
              onPress={() => {
                const fac = facultyList.find((f) => f.uid === 'demo-faculty-ecs-01');
                if (fac) setPingModalFaculty(fac);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.photoAvatarRing}>
                <Image
                  source={require('../../assets/faculty-anjali.jpg')}
                  style={styles.starredPhoto}
                />
                <View style={[styles.avatarStatusBadge, { backgroundColor: '#16A34A' }]} />
              </View>
              <Text style={styles.starredCardName}>Dr. Mehta</Text>
              <Text style={styles.starredCardDept}>ECS</Text>
            </TouchableOpacity>

            {/* Prof. Arjun */}
            <TouchableOpacity
              style={styles.starredCard}
              onPress={() => {
                const fac = facultyList.find((f) => f.uid === 'demo-faculty-ecs-02');
                if (fac) setPingModalFaculty(fac);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.initialsAvatar}>
                <Text style={styles.initialsText}>AK</Text>
                <View style={[styles.avatarStatusBadge, { backgroundColor: '#F59E0B' }]} />
              </View>
              <Text style={styles.starredCardName}>Prof. Arjun</Text>
              <Text style={styles.starredCardDept}>ECS</Text>
            </TouchableOpacity>

            {/* Prof. Patil */}
            <TouchableOpacity
              style={styles.starredCard}
              onPress={() => {
                const fac = facultyList.find((f) => f.uid === 'demo-faculty-cmpn-04');
                if (fac) setPingModalFaculty(fac);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.initialsAvatar}>
                <Text style={styles.initialsText}>RP</Text>
                <View style={[styles.avatarStatusBadge, { backgroundColor: '#2563EB' }]} />
              </View>
              <Text style={styles.starredCardName}>Prof. Patil</Text>
              <Text style={styles.starredCardDept}>CS</Text>
            </TouchableOpacity>

            {/* Dr. Sunita */}
            <TouchableOpacity
              style={styles.starredCard}
              onPress={() => {
                const fac = facultyList.find((f) => f.uid === 'demo-faculty-robotics-01');
                if (fac) setPingModalFaculty(fac);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.initialsAvatar}>
                <Text style={styles.initialsText}>SP</Text>
                <View style={[styles.avatarStatusBadge, { backgroundColor: '#2563EB' }]} />
              </View>
              <Text style={styles.starredCardName}>Dr. Sunita</Text>
              <Text style={styles.starredCardDept}>Robotics</Text>
            </TouchableOpacity>

            {/* Add New Dashed Circle */}
            <TouchableOpacity
              style={styles.starredCard}
              onPress={() => setActiveFilter('ALL')}
              activeOpacity={0.8}
            >
              <View style={styles.addStarredCircle}>
                <FontAwesome5 name="plus" size={14} color="#94A3B8" />
              </View>
              <Text style={styles.addStarredText}>Add New</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ── 5. LIVE FACULTY DIRECTORY HEADER ────────────────────────── */}
        <View style={styles.directoryHeader}>
          <View style={styles.directoryHeaderLeft}>
            <Text style={styles.directoryHeading}>LIVE FACULTY DIRECTORY</Text>
            <View style={styles.availableBadge}>
              <Text style={styles.availableBadgeText}>32 Available</Text>
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
          {filteredList.map((fac) => {
            const state = fac.status?.state || STATUS_KEYS.AVAILABLE;
            const badge = BADGE_MAP[state] || BADGE_MAP.available;
            const isQueued = queuedUids.has(fac.uid);

            return (
              <View key={fac.uid} style={styles.facultyCard}>
                {/* Header Row: Avatar + Name/Role + Status Badge */}
                <View style={styles.cardHeaderRow}>
                  {/* Avatar */}
                  <View style={styles.cardAvatarWrapper}>
                    {fac.photo ? (
                      <Image
                        source={require('../../assets/faculty-anjali.jpg')}
                        style={styles.cardAvatarPhoto}
                      />
                    ) : (
                      <View style={styles.cardAvatarPlaceholder}>
                        <Text style={styles.cardAvatarPlaceholderText}>
                          {fac.name
                            .split(' ')
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join('')}
                        </Text>
                      </View>
                    )}
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
                      {fac.designation || 'Faculty'}
                    </Text>
                  </View>

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

                {/* Footer Action Row */}
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
                      {fac.lectureRoom || fac.cabin || `${fac.department} Dept Cabin`}
                    </Text>
                  </View>

                  {/* Right Button */}
                  {state === STATUS_KEYS.AVAILABLE ? (
                    <TouchableOpacity
                      style={styles.pingFacultyBtn}
                      onPress={() => setPingModalFaculty(fac)}
                      activeOpacity={0.88}
                    >
                      <FontAwesome5
                        name="bell"
                        size={11}
                        color="#FFFFFF"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.pingFacultyBtnText}>Ping Faculty</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.notifyBtn,
                        isQueued && styles.notifyBtnActive,
                      ]}
                      onPress={() => handleNotifyQueue(fac)}
                      activeOpacity={0.88}
                    >
                      <FontAwesome5
                        name="bell"
                        size={11}
                        color={isQueued ? '#FFFFFF' : '#4326B6'}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.notifyBtnText,
                          isQueued && { color: '#FFFFFF' },
                        ]}
                      >
                        {isQueued ? 'Alert Set ✔' : 'Notify When Free'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── PING MODAL ──────────────────────────────────────────────── */}
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
                  Location: {pingModalFaculty.cabin || 'Hall No. 301 • Table 1'}
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
  pingFacultyBtn: {
    backgroundColor: '#4326B6',
    borderRadius: 9999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#4326B6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  pingFacultyBtnText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 12,
    color: '#FFFFFF',
  },
  notifyBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#4326B6',
    borderRadius: 9999,
    paddingVertical: 7,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifyBtnActive: {
    backgroundColor: '#4326B6',
  },
  notifyBtnText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 12,
    color: '#4326B6',
  },

  // ── MODAL BACKDROP & PING MODAL ────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pingSheetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 380,
    padding: 22,
    shadowColor: '#1A191F',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  pingSheetHeader: {
    alignItems: 'center',
    marginBottom: 18,
  },
  pingShieldIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4326B6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  pingSheetTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#1A191F',
    textAlign: 'center',
  },
  pingSheetSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  reasonLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#334155',
    marginBottom: 10,
  },
  reasonChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  reasonChipSelected: {
    borderColor: '#4326B6',
    backgroundColor: '#F5F3FF',
  },
  reasonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12.5,
    color: '#334155',
  },
  reasonTextSelected: {
    fontFamily: 'Inter_700Bold',
    color: '#4326B6',
  },
  pingActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  pingCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pingCancelBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#64748B',
  },
  pingConfirmBtn: {
    flex: 1.5,
    backgroundColor: '#4326B6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pingConfirmBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  pingSuccessBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  pingSuccessText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#15803D',
    marginTop: 12,
  },
  pingSuccessSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 16,
  },
});
