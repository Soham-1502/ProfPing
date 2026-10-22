import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
  Image,
  Switch,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { STATUS_KEYS } from '@profping/shared';
import { broadcastStatus, getFacultyStatus } from '../../src/services/statusService';

// ── 6 Instant Status Card Configs (Matching Reference Screenshot) ─────────
const STATUS_CARDS = [
  {
    id: 'available',
    backendState: STATUS_KEYS.AVAILABLE,
    label: 'Available',
    subtitle: 'In office / Walk-ins OK',
    color: '#059669', // Emerald Green
    icon: 'check-circle',
  },
  {
    id: 'busy',
    backendState: STATUS_KEYS.BUSY,
    label: 'Busy',
    subtitle: 'Grading / Meeting',
    color: '#D97706', // Warm Amber
    icon: 'clock',
  },
  {
    id: 'temporarily_out',
    backendState: STATUS_KEYS.BUSY,
    label: 'Temporarily Out',
    subtitle: 'Step out 15m',
    color: '#0284C7', // Ocean Blue
    icon: 'pause-circle',
  },
  {
    id: 'unavailable',
    backendState: STATUS_KEYS.IN_LECTURE,
    label: 'Unavailable',
    subtitle: 'In Lecture / Lab',
    color: '#DC2626', // Crimson Red
    icon: 'minus-circle',
  },
  {
    id: 'absent',
    backendState: STATUS_KEYS.OFF_CAMPUS,
    label: 'Absent',
    subtitle: 'Off-campus today',
    color: '#1E293B', // Deep Slate
    icon: 'power-off',
  },
];

// Revert preset durations in minutes
const TIME_PRESETS = [
  { id: '15m', label: '15m', minutes: 15 },
  { id: '30m', label: '30m', minutes: 30 },
  { id: '1h', label: '1h', minutes: 60 },
  { id: 'custom', label: 'Custom', minutes: 120 },
];

export default function FacultyHomeScreen() {
  const { user, department, logout } = useAuth();
  const router = useRouter();

  // State management
  const [selectedStatusId, setSelectedStatusId] = useState('available');
  const [customNote, setCustomNote] = useState('Conducting viva in Lab 2');
  const [lastUpdatedText, setLastUpdatedText] = useState('2m ago');
  const [lastUpdatedTime, setLastUpdatedTime] = useState(Date.now() - 120000);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastBannerSuccess, setBroadcastBannerSuccess] = useState(false);

  // Auto-reset state
  const [autoResetEnabled, setAutoResetEnabled] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState('1h');
  const [revertTime, setRevertTime] = useState('4:00 PM');

  // Custom status modal
  const [customStatusModalVisible, setCustomStatusModalVisible] = useState(false);
  const [customStatusInput, setCustomStatusInput] = useState('');

  // Active bottom nav tab
  const [activeTab, setActiveTab] = useState('home');

  // Calculate dynamic revert time when preset changes
  useEffect(() => {
    const presetObj = TIME_PRESETS.find((p) => p.id === selectedPreset);
    const mins = presetObj ? presetObj.minutes : 60;
    const future = new Date(Date.now() + mins * 60 * 1000);
    const formatted = future.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    setRevertTime(formatted);
  }, [selectedPreset]);

  // Load existing status on mount
  useEffect(() => {
    async function loadStatus() {
      if (!user?.uid) return;
      const res = await getFacultyStatus(user.uid);
      if (res) {
        // Map backend state back to our 6 card IDs
        if (res.state === STATUS_KEYS.AVAILABLE) setSelectedStatusId('available');
        else if (res.state === STATUS_KEYS.IN_LECTURE) setSelectedStatusId('unavailable');
        else if (res.state === STATUS_KEYS.OFF_CAMPUS) setSelectedStatusId('absent');
        else if (res.message && res.message.toLowerCase().includes('step out')) setSelectedStatusId('temporarily_out');
        else setSelectedStatusId('busy');

        if (res.message) setCustomNote(res.message);
        if (res.updatedAt) {
          setLastUpdatedTime(res.updatedAt);
          setLastUpdatedText('Just now');
        }
      }
    }
    loadStatus();
  }, [user?.uid]);

  // Handle 1-Tap status tap
  const handleSelectStatus = async (card) => {
    setSelectedStatusId(card.id);
    const message = customNote.trim() || card.subtitle;
    await executeBroadcast(card.backendState, message);
  };

  // Perform broadcast to Firebase
  const executeBroadcast = async (backendState, message) => {
    if (!user?.uid) return;
    setBroadcasting(true);
    setBroadcastBannerSuccess(false);

    try {
      const res = await broadcastStatus(user.uid, backendState, message);
      if (res.success) {
        setLastUpdatedTime(res.timestamp);
        setLastUpdatedText('Just now');
        setBroadcastBannerSuccess(true);
        setTimeout(() => setBroadcastBannerSuccess(false), 3500);
      }
    } catch (err) {
      console.error('Broadcast failed:', err);
      Alert.alert('Broadcast Error', 'Failed to update campus broadcast.');
    } finally {
      setBroadcasting(false);
    }
  };

  // Handle "Update Campus Broadcast" big button
  const handleUpdateBroadcast = async () => {
    const activeCard = STATUS_CARDS.find((c) => c.id === selectedStatusId) || STATUS_CARDS[0];
    const message = customNote.trim() || activeCard.subtitle;
    await executeBroadcast(activeCard.backendState, message);
  };

  // Handle custom status submission
  const handleSaveCustomStatus = async () => {
    if (!customStatusInput.trim()) return;
    setCustomNote(customStatusInput.trim());
    setCustomStatusModalVisible(false);
    const activeCard = STATUS_CARDS.find((c) => c.id === selectedStatusId) || STATUS_CARDS[0];
    await executeBroadcast(activeCard.backendState, customStatusInput.trim());
  };

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out from Faculty Broadcaster?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const activeCardObj = STATUS_CARDS.find((c) => c.id === selectedStatusId) || STATUS_CARDS[0];
  const facultyName = user?.displayName || 'Dr. Anjali Mehta';
  const facultyDept = department ? `Associate Professor • ${department} Dept` : 'Associate Professor • ECS Dept';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* ── 1. HEADER (Exact match to screenshot) ───────────────────── */}
      <View style={styles.header}>
        {/* Left Back Arrow */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace('/(student)')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FontAwesome5 name="arrow-left" size={17} color="#0F172A" />
        </TouchableOpacity>

        {/* Center Title & Subtitle */}
        <View style={styles.headerCenter}>
          <Text style={styles.headerBrand}>PROF-PING</Text>
          <Text style={styles.headerSubtitle}>FACULTY BROADCASTER</Text>
        </View>

        {/* Right Status Pill & Help */}
        <View style={styles.headerRight}>
          <View style={styles.broadcastingPill}>
            <View style={styles.broadcastingDotRing}>
              <View style={styles.broadcastingDotCore} />
            </View>
            <Text style={styles.broadcastingText}>Broadcasting</Text>
          </View>

          <TouchableOpacity
            style={styles.helpBtn}
            onPress={() =>
              Alert.alert(
                'Faculty Broadcaster',
                'Your availability is synced atomically to all students and digital campus boards in real-time.\n\nTap any status card below for 1-Tap Broadcast.'
              )
            }
          >
            <FontAwesome5 name="question-circle" size={18} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 2. FACULTY PROFILE CARD ──────────────────────────────────── */}
        <View style={styles.profileCard}>
          {/* Avatar with Green Online Dot */}
          <View style={styles.avatarWrapper}>
            <Image
              source={require('../../assets/faculty-anjali.jpg')}
              style={styles.avatarImage}
              resizeMode="cover"
            />
            <View style={styles.avatarOnlineDot} />
          </View>

          {/* Profile Details */}
          <View style={styles.profileDetails}>
            <Text style={styles.profileName} numberOfLines={1}>
              {facultyName}
            </Text>
            <Text style={styles.profileTitle} numberOfLines={1}>
              {facultyDept}
            </Text>

            {/* Room / Desk Location Pill */}
            <View style={styles.locationPill}>
              <FontAwesome5 name="map-marker-alt" size={10} color="#2563EB" style={{ marginRight: 5 }} />
              <Text style={styles.locationText}>Hall No. 301 • Table 1</Text>
            </View>
          </View>
        </View>

        {/* ── 3. LIVE STATUS HERO BANNER ───────────────────────────────── */}
        <View style={styles.liveBanner}>
          <View style={styles.liveBannerLeft}>
            <View style={styles.liveBannerDot} />
            <Text style={styles.liveBannerLabel}>
              Live Status:{' '}
              <Text style={styles.liveBannerBold}>{activeCardObj.label} </Text>
              <Text style={styles.liveBannerReset}>
                {autoResetEnabled ? `(Resets at ${revertTime})` : '(No auto-reset)'}
              </Text>
            </Text>
          </View>
          <FontAwesome5 name="wifi" size={13} color="#059669" />
        </View>

        {/* ── 4. CUSTOM CONTEXT NOTE ──────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeaderTitle}>CUSTOM CONTEXT NOTE</Text>
          <Text style={styles.sectionHeaderMeta}>Updated {lastUpdatedText}</Text>
        </View>

        <View style={styles.contextNoteCard}>
          <FontAwesome5 name="comment-alt" size={15} color="#64748B" regular style={styles.contextNoteIcon} />
          <TextInput
            style={styles.contextNoteInput}
            value={customNote}
            onChangeText={setCustomNote}
            placeholder="Conducting viva in Lab 2"
            placeholderTextColor="#94A3B8"
            maxLength={140}
          />
          <TouchableOpacity style={styles.editPencilBtn}>
            <FontAwesome5 name="pen" size={12} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* ── 5. SELECT INSTANT STATUS (2-COL GRID) ───────────────────── */}
        <View style={[styles.sectionHeaderRow, { marginTop: 20 }]}>
          <Text style={styles.sectionHeaderTitle}>SELECT INSTANT STATUS</Text>
          <View style={styles.oneTapRow}>
            <FontAwesome5 name="broadcast-tower" size={11} color="#2563EB" style={{ marginRight: 5 }} />
            <Text style={styles.oneTapText}>1-Tap Broadcast</Text>
          </View>
        </View>

        <View style={styles.statusGrid}>
          {STATUS_CARDS.map((card) => {
            const isActive = selectedStatusId === card.id;
            return (
              <TouchableOpacity
                key={card.id}
                onPress={() => handleSelectStatus(card)}
                disabled={broadcasting}
                activeOpacity={0.88}
                style={[
                  styles.statusCard,
                  { backgroundColor: card.color },
                  isActive && styles.statusCardActiveBorder,
                ]}
              >
                {/* Top Row: Icon + Active Pill */}
                <View style={styles.cardTopRow}>
                  <FontAwesome5 name={card.icon} size={16} color="#ffffff" />
                  {isActive && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>ACTIVE</Text>
                    </View>
                  )}
                </View>

                {/* Status Name */}
                <Text style={styles.cardStatusTitle}>{card.label}</Text>

                {/* Subtitle / Context */}
                <Text style={styles.cardStatusSubtitle}>{card.subtitle}</Text>
              </TouchableOpacity>
            );
          })}

          {/* 6th Card: Custom Status (Dashed Border) */}
          <TouchableOpacity
            style={styles.customStatusCard}
            onPress={() => {
              setCustomStatusInput(customNote);
              setCustomStatusModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <FontAwesome5 name="plus-circle" size={22} color="#64748B" />
            <Text style={styles.customStatusText}>Custom Status</Text>
          </TouchableOpacity>
        </View>

        {/* ── 6. AUTO-RESET STATUS CARD ───────────────────────────────── */}
        <View style={styles.autoResetCard}>
          {/* Top Row: Clock + Text + Switch */}
          <View style={styles.autoResetTopRow}>
            <View style={styles.autoResetLeft}>
              <FontAwesome5 name="clock" size={17} color="#2563EB" style={{ marginRight: 10 }} />
              <View>
                <Text style={styles.autoResetTitle}>Auto-Reset Status</Text>
                <Text style={styles.autoResetSubtitle}>Reverts to 'Not Signed' at cutoff</Text>
              </View>
            </View>
            <Switch
              value={autoResetEnabled}
              onValueChange={setAutoResetEnabled}
              trackColor={{ false: '#CBD5E1', true: '#2563EB' }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Middle Row: Revert At + Time Badge */}
          {autoResetEnabled && (
            <>
              <View style={styles.revertAtRow}>
                <Text style={styles.revertAtLabel}>Revert At:</Text>
                <View style={styles.revertTimePill}>
                  <FontAwesome5 name="clock" size={11} color="#2563EB" style={{ marginRight: 5 }} />
                  <Text style={styles.revertTimeText}>{revertTime}</Text>
                </View>
              </View>

              {/* Bottom Row: 15m / 30m / 1h / Custom Selector */}
              <View style={styles.presetsRow}>
                {TIME_PRESETS.map((preset) => {
                  const isSelected = selectedPreset === preset.id;
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      style={[styles.presetBtn, isSelected && styles.presetBtnActive]}
                      onPress={() => setSelectedPreset(preset.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.presetBtnText, isSelected && styles.presetBtnTextActive]}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* ── 7. UPDATE CAMPUS BROADCAST BUTTON ───────────────────────── */}
        <TouchableOpacity
          style={[styles.updateBroadcastBtn, broadcasting && styles.updateBroadcastBtnDisabled]}
          onPress={handleUpdateBroadcast}
          disabled={broadcasting}
          activeOpacity={0.88}
        >
          {broadcasting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <FontAwesome5 name="broadcast-tower" size={15} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.updateBroadcastText}>Update Campus Broadcast</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Success toast feedback */}
        {broadcastBannerSuccess && (
          <View style={styles.successToast}>
            <FontAwesome5 name="check-circle" size={13} color="#15803D" style={{ marginRight: 6 }} />
            <Text style={styles.successToastText}>Broadcast atomic update synced to campus directory!</Text>
          </View>
        )}
      </ScrollView>

      {/* ── 8. BOTTOM NAVIGATION BAR ─────────────────────────────────── */}
      <View style={styles.bottomNav}>
        {/* Home */}
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => setActiveTab('home')}
          activeOpacity={0.8}
        >
          <FontAwesome5
            name="home"
            size={19}
            color={activeTab === 'home' ? '#2563EB' : '#64748B'}
            style={{ marginBottom: 4 }}
          />
          <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>
            Home
          </Text>
        </TouchableOpacity>

        {/* History */}
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => {
            setActiveTab('history');
            Alert.alert(
              'Broadcast History',
              `Recent audit logs:\n• ${activeCardObj.label}: "${customNote}" (${lastUpdatedText})\n• Available: "Available in cabin" (Today, 9:30 AM)`
            );
          }}
          activeOpacity={0.8}
        >
          <FontAwesome5
            name="clock"
            size={19}
            color={activeTab === 'history' ? '#2563EB' : '#64748B'}
            style={{ marginBottom: 4 }}
          />
          <Text style={[styles.navLabel, activeTab === 'history' && styles.navLabelActive]}>
            History
          </Text>
        </TouchableOpacity>

        {/* Profile */}
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => {
            setActiveTab('profile');
            handleLogout();
          }}
          activeOpacity={0.8}
        >
          <FontAwesome5
            name="user"
            size={19}
            color={activeTab === 'profile' ? '#2563EB' : '#64748B'}
            style={{ marginBottom: 4 }}
          />
          <Text style={[styles.navLabel, activeTab === 'profile' && styles.navLabelActive]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── CUSTOM STATUS MODAL ─────────────────────────────────────── */}
      <Modal
        visible={customStatusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomStatusModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalDialog}>
            <Text style={styles.modalTitle}>Set Custom Status</Text>
            <Text style={styles.modalSubtitle}>
              Type your custom availability or message to display across campus:
            </Text>

            <TextInput
              style={styles.modalInput}
              value={customStatusInput}
              onChangeText={setCustomStatusInput}
              placeholder="e.g. In Room 402 for tutorial until 11:30 AM..."
              placeholderTextColor="#94A3B8"
              autoFocus
              maxLength={140}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setCustomStatusModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveCustomStatus}
              >
                <Text style={styles.modalSaveText}>Broadcast</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── EXACT STYLES MATCHING THE REFERENCE SCREENSHOT ─────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // 1. Top Header
  header: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    padding: 6,
    width: 36,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerBrand: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1D4ED8',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  broadcastingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  broadcastingDotRing: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  broadcastingDotCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  broadcastingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  helpBtn: {
    padding: 4,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 85,
  },

  // 2. Profile Card
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
    marginBottom: 12,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImage: {
    width: 58,
    height: 58,
    borderRadius: 10,
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  profileTitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  locationText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },

  // 3. Live Status Banner
  liveBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  liveBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  liveBannerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveBannerLabel: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '700',
    flex: 1,
  },
  liveBannerBold: {
    fontWeight: '800',
  },
  liveBannerReset: {
    color: '#047857',
    fontWeight: '500',
    fontSize: 11.5,
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  sectionHeaderMeta: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  oneTapRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  oneTapText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },

  // 4. Custom Context Note
  contextNoteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  contextNoteIcon: {
    marginRight: 10,
  },
  contextNoteInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
    padding: 0,
  },
  editPencilBtn: {
    padding: 4,
  },

  // 5. 2-Column Grid
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statusCard: {
    width: '48.5%',
    borderRadius: 10,
    padding: 12,
    minHeight: 88,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statusCardActiveBorder: {
    borderWidth: 2.5,
    borderColor: '#065F46',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  activeBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  cardStatusTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 6,
  },
  cardStatusSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },

  // Custom Status Card (Dashed)
  customStatusCard: {
    width: '48.5%',
    borderRadius: 10,
    padding: 12,
    minHeight: 88,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 6,
  },

  // 6. Auto-Reset Status Card
  autoResetCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  autoResetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  autoResetLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  autoResetTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  autoResetSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  revertAtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 10,
  },
  revertAtLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  revertTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  revertTimeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetBtnActive: {
    backgroundColor: '#0052CC',
  },
  presetBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  presetBtnTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },

  // 7. Update Campus Broadcast Button
  updateBroadcastBtn: {
    backgroundColor: '#0052CC',
    borderRadius: 10,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0052CC',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
    marginBottom: 10,
  },
  updateBroadcastBtnDisabled: {
    opacity: 0.65,
  },
  updateBroadcastText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  successToast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  successToastText: {
    fontSize: 11.5,
    color: '#15803D',
    fontWeight: '700',
  },

  // 8. Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 8,
    paddingBottom: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  navLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#2563EB',
    fontWeight: '700',
  },

  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalDialog: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 17,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  modalSaveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#0052CC',
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
