import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import FacultyProfileView from './FacultyProfileView';
import LogoutModal from '../../src/components/LogoutModal';
import ThemedAlertModal from '../../src/components/ThemedAlertModal';

// ── 4 Core Status Card Configs (Campus Clarity System) ─────────────────────
const STATUS_CARDS = [
  {
    id: 'available',
    backendState: STATUS_KEYS.AVAILABLE,
    label: 'Available',
    subtitle: 'In office / Walk-ins OK',
    icon: 'check-circle',
    activeBg: '#15803D',
    activeText: '#FFFFFF',
    inactiveBg: '#DCFCE7',
    inactiveBorder: '#86EFAC',
    inactiveText: '#14532D',
    inactiveSub: '#166534',
    iconColor: '#15803D',
    bannerBg: '#DCFCE7',
    bannerBorder: '#86EFAC',
    bannerText: '#14532D',
  },
  {
    id: 'busy',
    backendState: STATUS_KEYS.BUSY,
    label: 'Busy',
    subtitle: 'Grading / Meeting',
    icon: 'clock',
    activeBg: '#D97706',
    activeText: '#FFFFFF',
    inactiveBg: '#FEF3C7',
    inactiveBorder: '#FDE68A',
    inactiveText: '#78350F',
    inactiveSub: '#92400E',
    iconColor: '#D97706',
    bannerBg: '#FEF3C7',
    bannerBorder: '#FDE68A',
    bannerText: '#78350F',
  },
  {
    id: 'in_lecture',
    backendState: STATUS_KEYS.IN_LECTURE,
    label: 'In Lecture',
    subtitle: 'In Lecture / Lab',
    icon: 'graduation-cap',
    activeBg: '#2563EB',
    activeText: '#FFFFFF',
    inactiveBg: '#DBEAFE',
    inactiveBorder: '#BFDBFE',
    inactiveText: '#1E40AF',
    inactiveSub: '#1D4ED8',
    iconColor: '#2563EB',
    bannerBg: '#DBEAFE',
    bannerBorder: '#BFDBFE',
    bannerText: '#1E40AF',
  },
  {
    id: 'off_campus',
    backendState: STATUS_KEYS.OFF_CAMPUS,
    label: 'Off Campus',
    subtitle: 'Not on campus today',
    icon: 'door-open',
    activeBg: '#DC2626',
    activeText: '#FFFFFF',
    inactiveBg: '#FEE2E2',
    inactiveBorder: '#FECACA',
    inactiveText: '#991B1B',
    inactiveSub: '#B91C1C',
    iconColor: '#DC2626',
    bannerBg: '#FEE2E2',
    bannerBorder: '#FECACA',
    bannerText: '#991B1B',
  },
];

import { useFaculty, TIME_PRESETS } from '../../src/context/FacultyContext';

export default function FacultyHomeScreen({ initialTab = 'home' }) {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const { user, role, department, logout } = useAuth();
  const router = useRouter();

  // Persistent Faculty Broadcaster Context
  const {
    selectedStatusId,
    setSelectedStatusId,
    customNote,
    setCustomNote,
    lastUpdatedText,
    broadcastStatusToFirebase,
    autoResetEnabled,
    setAutoResetEnabled,
    selectedPreset,
    setSelectedPreset,
    customRevertDate,
    setCustomRevertDate,
    revertTime,
  } = useFaculty();

  // Local transient states
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastBannerSuccess, setBroadcastBannerSuccess] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const resetTimeoutRef = useRef(null);

  // Temporary typing area note state
  const [typingNote, setTypingNote] = useState('');

  // Active bottom nav tab: 'home' | 'history' | 'profile'
  const [activeTab, setActiveTab] = useState(initialTab);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // Themed Alert State
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    icon: null,
    primaryText: 'OK',
    secondaryText: null,
    onPrimaryPress: null,
    onSecondaryPress: null,
  });

  const showAlert = (config) => {
    setAlertConfig({
      visible: true,
      title: config.title || '',
      message: config.message || '',
      type: config.type || 'info',
      icon: config.icon || null,
      primaryText: config.primaryText || 'OK',
      secondaryText: config.secondaryText || null,
      onPrimaryPress: config.onPrimaryPress || null,
      onSecondaryPress: config.onSecondaryPress || null,
    });
  };

  const closeAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const handleConfirmLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
    router.replace('/(auth)/login');
  };

  // Ensure any timeout is cleared on unmount
  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  // Handle 1-Tap status button tap:
  // Checks if text is typed -> sends together with status and immediately empties text box.
  // If text box is empty -> sends status with blank note (''), stopping old messages from attaching.
  const handleSelectStatus = async (card) => {
    const noteToSend = typingNote.trim();
    setTypingNote('');
    await executeBroadcast(card.backendState, noteToSend);
  };

  // Handle inline "Save Note" checkmark button:
  // Attaches newly typed text to currently active status, broadcasts, and immediately empties text box.
  const handleSaveInlineNote = async () => {
    const noteToSend = typingNote.trim();
    if (!noteToSend) return;
    setTypingNote('');
    const activeCard = STATUS_CARDS.find((c) => c.id === selectedStatusId) || STATUS_CARDS[0];
    await executeBroadcast(activeCard.backendState, noteToSend);
  };

  const executeBroadcast = async (backendState, message) => {
    setBroadcasting(true);
    setBroadcastBannerSuccess(false);

    try {
      const res = await broadcastStatusToFirebase(backendState, message);
      if (res?.success) {
        setBroadcastBannerSuccess(true);
        setTimeout(() => setBroadcastBannerSuccess(false), 3500);

        // Schedule auto-revert to Available if enabled
        if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
        if (autoResetEnabled && backendState !== STATUS_KEYS.AVAILABLE) {
          let delayMs = 60 * 60 * 1000;
          if (selectedPreset === 'custom' && customRevertDate) {
            const now = new Date();
            const target = new Date(customRevertDate);
            target.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
            if (target.getTime() <= now.getTime()) {
              target.setDate(target.getDate() + 1);
            }
            delayMs = Math.max(target.getTime() - now.getTime(), 1000);
          } else {
            const presetObj = TIME_PRESETS.find((p) => p.id === selectedPreset);
            if (presetObj && presetObj.minutes) {
              delayMs = presetObj.minutes * 60 * 1000;
            }
          }

          resetTimeoutRef.current = setTimeout(async () => {
            const defaultCard = STATUS_CARDS.find((c) => c.id === 'available') || STATUS_CARDS[0];
            try {
              await broadcastStatusToFirebase(defaultCard.backendState, '');
            } catch (e) {
              console.error('Auto-reset broadcast error:', e);
            }
          }, delayMs);
        }
      }
    } catch (err) {
      console.error('Broadcast failed:', err);
      showAlert({
        title: 'Broadcast Error',
        message: 'Failed to update campus broadcast. Please verify your connection.',
        type: 'error',
      });
    } finally {
      setBroadcasting(false);
    }
  };

  const handleBackPress = () => {
    if (activeTab === 'profile') {
      setActiveTab('home');
    } else {
      setLogoutModalVisible(true);
    }
  };

  const activeCardObj = STATUS_CARDS.find((c) => c.id === selectedStatusId) || STATUS_CARDS[0];
  const facultyName =
    user?.displayName ||
    user?.name ||
    (user?.email ? user.email.split('@')[0].split('.').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'Faculty Member');
  const designation = role === 'hod' ? 'Professor & HOD' : 'Associate Professor';
  const facultyDept = department ? `${designation} • ${department} Dept` : `${designation} • SFIT`;

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingRoot}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF8FE" />
        <ActivityIndicator size="small" color="#1D4ED8" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8FE" />

      {/* ── 1. TOP HEADER (Campus Clarity System) ─────────────────── */}
      <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.brandTitleBlock}>
                <Image
                  source={require('../../assets/profping-logo.png')}
                  style={styles.headerLogoImage}
                  resizeMode="contain"
                />
                <Text style={styles.headerSubtitle}>
                  {role === 'hod' ? 'HOD BROADCASTER' : 'FACULTY BROADCASTER'}
                </Text>
              </View>
            </View>

            {/* Right Status Pill */}
            <View style={styles.headerRight}>
              <View style={styles.broadcastingPill}>
                <View style={styles.broadcastingDotRing}>
                  <View style={styles.broadcastingDotCore} />
                </View>
                <Text style={styles.broadcastingText}>Broadcasting</Text>
              </View>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* ── 2. FACULTY PROFILE CARD ──────────────────────────────── */}
            <TouchableOpacity
              style={styles.profileCard}
              onPress={() => router.push('/(faculty)/profile')}
              activeOpacity={0.88}
            >
              {/* Avatar with Green Live Dot */}
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
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Text style={styles.profileName} numberOfLines={1}>
                    {facultyName}
                  </Text>
                  {role === 'hod' && (
                    <View style={styles.hodBroadcasterBadge}>
                      <FontAwesome5 name="user-tie" size={8} color="#4326B6" style={{ marginRight: 3 }} />
                      <Text style={styles.hodBroadcasterBadgeText}>HOD</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.profileTitle} numberOfLines={1}>
                  {facultyDept}
                </Text>

                {/* Room / Desk Location Pill */}
                <View style={styles.locationPill}>
                  <FontAwesome5 name="map-marker-alt" size={10} color="#4326B6" style={{ marginRight: 5 }} />
                  <Text style={styles.locationText}>
                    {role === 'hod' ? `Room 301 • ${department || 'CMPN'} HOD Office` : 'Hall No. 301 • Table 1'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* HOD Quick Access to Department Overview */}
            {role === 'hod' && (
              <TouchableOpacity
                style={styles.hodQuickLinkBar}
                onPress={() => router.push('/(faculty)/department')}
                activeOpacity={0.85}
              >
                <View style={styles.hodQuickLinkIconBox}>
                  <FontAwesome5 name="users-cog" size={13} color="#4326B6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.hodQuickLinkTitle}>Department Overview ({department || 'CMPN'})</Text>
                  <Text style={styles.hodQuickLinkSub}>View all faculty presence & desk hours</Text>
                </View>
                <FontAwesome5 name="chevron-right" size={12} color="#4326B6" />
              </TouchableOpacity>
            )}

            {/* ── 3. LIVE STATUS HERO BANNER ───────────────────────────── */}
            <View
              style={[
                styles.liveBanner,
                {
                  backgroundColor: activeCardObj.bannerBg || '#DCFCE7',
                  borderColor: activeCardObj.bannerBorder || '#86EFAC',
                },
              ]}
            >
              <View style={styles.liveBannerLeft}>
                <View
                  style={[
                    styles.liveBannerDot,
                    { backgroundColor: activeCardObj.activeBg || '#15803D' },
                  ]}
                />
                <Text style={[styles.liveBannerLabel, { color: activeCardObj.bannerText || '#14532D' }]}>
                  Live Status:{' '}
                  <Text style={[styles.liveBannerBold, { color: activeCardObj.bannerText || '#14532D' }]}>
                    {activeCardObj.label}{' '}
                  </Text>
                  <Text style={[styles.liveBannerReset, { color: activeCardObj.bannerText || '#14532D' }]}>
                    {autoResetEnabled ? `(Resets at ${revertTime})` : '(No auto-reset)'}
                  </Text>
                </Text>
              </View>
              <FontAwesome5 name="wifi" size={13} color={activeCardObj.activeBg || '#15803D'} />
            </View>

            {/* Active Live Broadcast Note Display (if currently set) */}
            {customNote ? (
              <View style={styles.activeNoteBanner}>
                <FontAwesome5 name="quote-left" size={10} color="#4326B6" style={{ marginRight: 6, opacity: 0.8 }} />
                <Text style={styles.activeNoteText} numberOfLines={2}>
                  "{customNote}"
                </Text>
                <Text style={styles.activeNoteMeta}>• {lastUpdatedText}</Text>
              </View>
            ) : null}

            {/* ── 4. PERMANENT NOTE TYPING AREA (DIRECTLY BELOW LIVE BANNER) ── */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>CUSTOM NOTE (OPTIONAL)</Text>
              <Text style={styles.sectionHeaderMeta}>
                {typingNote.trim().length > 0 ? 'Ready to broadcast' : 'Temporary typing area'}
              </Text>
            </View>

            <View style={styles.inlineNoteCard}>
              <FontAwesome5 name="comment-alt" size={13} color="#64748B" regular style={styles.noteInputIcon} />
              <TextInput
                style={styles.inlineNoteInput}
                value={typingNote}
                onChangeText={setTypingNote}
                placeholder="Type note (e.g. In Room 528)..."
                placeholderTextColor="#94A3B8"
                maxLength={140}
                returnKeyType="done"
                onSubmitEditing={handleSaveInlineNote}
              />
              {typingNote.length > 0 ? (
                <TouchableOpacity
                  style={styles.clearNoteBtn}
                  onPress={() => setTypingNote('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
              {/* Inline Save Note Checkmark Button */}
              <TouchableOpacity
                style={[
                  styles.inlineSaveBtn,
                  typingNote.trim().length > 0 && styles.inlineSaveBtnActive,
                ]}
                onPress={handleSaveInlineNote}
                disabled={!typingNote.trim() || broadcasting}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                activeOpacity={0.75}
              >
                {broadcasting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <FontAwesome5
                    name="check"
                    size={12}
                    color={typingNote.trim().length > 0 ? '#FFFFFF' : '#94A3B8'}
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* ── 5. SELECT INSTANT STATUS (CORE 4 STATUSES) ──────────── */}
            <View style={[styles.sectionHeaderRow, { marginTop: 18 }]}>
              <Text style={styles.sectionHeaderTitle}>SELECT INSTANT STATUS</Text>
              <View style={styles.oneTapRow}>
                <Ionicons name="flash" size={12} color="#4326B6" style={{ marginRight: 3 }} />
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
                    activeOpacity={0.85}
                    style={[
                      styles.statusCard,
                      {
                        backgroundColor: isActive ? card.activeBg : card.inactiveBg,
                        borderColor: isActive ? card.activeBg : card.inactiveBorder,
                      },
                      isActive && styles.statusCardActiveElevation,
                    ]}
                  >
                    {/* Top Row: Icon + Active White Checkmark */}
                    <View style={styles.cardTopRow}>
                      <FontAwesome5
                        name={card.icon}
                        size={17}
                        color={isActive ? '#FFFFFF' : card.iconColor}
                      />
                      {isActive ? (
                        <View style={styles.activeCheckBadge}>
                          <FontAwesome5 name="check" size={10} color="#FFFFFF" />
                        </View>
                      ) : (
                        <View style={[styles.inactiveIndicator, { borderColor: card.inactiveBorder }]} />
                      )}
                    </View>

                    {/* Status Name */}
                    <Text
                      style={[
                        styles.cardStatusTitle,
                        { color: isActive ? card.activeText : card.inactiveText },
                      ]}
                    >
                      {card.label}
                    </Text>

                    {/* Subtitle / Context */}
                    <Text
                      style={[
                        styles.cardStatusSubtitle,
                        { color: isActive ? 'rgba(255, 255, 255, 0.88)' : card.inactiveSub },
                      ]}
                    >
                      {card.subtitle}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* ── 6. AUTO-RESET STATUS CARD ───────────────────────────── */}
            <View style={styles.autoResetCard}>
              {/* Top Row: Clock + Text + Switch */}
              <View style={styles.autoResetTopRow}>
                <View style={styles.autoResetLeft}>
                  <Ionicons name="alarm-outline" size={20} color="#4326B6" style={{ marginRight: 10 }} />
                  <View>
                    <Text style={styles.autoResetTitle}>Auto-Reset Status</Text>
                    <Text style={styles.autoResetSubtitle}>Reverts to 'Not Signed' at cutoff</Text>
                  </View>
                </View>
                <Switch
                  value={autoResetEnabled}
                  onValueChange={setAutoResetEnabled}
                  trackColor={{ false: '#CBD5E1', true: '#4326B6' }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Middle Row: Revert At + Time Badge */}
              {autoResetEnabled && (
                <>
                  <View style={styles.revertAtRow}>
                    <Text style={styles.revertAtLabel}>Revert At:</Text>
                    <View style={styles.revertTimePill}>
                      <FontAwesome5 name="clock" size={11} color="#4326B6" style={{ marginRight: 6 }} />
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
                          onPress={() => {
                            if (preset.id === 'custom') {
                              setShowPicker(true);
                            } else {
                              setSelectedPreset(preset.id);
                              setCustomRevertDate(null);
                            }
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.presetBtnText, isSelected && styles.presetBtnTextActive]}>
                            {preset.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {showPicker && (
                    <DateTimePicker
                      value={customRevertDate || new Date()}
                      mode="time"
                      is24Hour={false}
                      display="default"
                      onChange={(event, selected) => {
                        setShowPicker(false);
                        if (selected) {
                          setCustomRevertDate(selected);
                          setSelectedPreset('custom');
                        }
                      }}
                    />
                  )}
                </>
              )}
            </View>

            {/* Instant 1-Tap broadcast feedback toast */}
            {broadcastBannerSuccess && (
              <View style={styles.successToast}>
                <FontAwesome5 name="check-circle" size={13} color="#15803D" style={{ marginRight: 6 }} />
                <Text style={styles.successToastText}>Broadcast atomic update synced to campus directory!</Text>
              </View>
            )}

          </ScrollView>

      {/* ── THEMED LOGOUT MODAL ────────────────────────────────────── */}
      <LogoutModal
        visible={logoutModalVisible}
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={handleConfirmLogout}
        roleLabel="faculty"
      />

      {/* ── THEMED INSTITUTIONAL ALERT MODAL ───────────────────────── */}
      <ThemedAlertModal {...alertConfig} onClose={closeAlert} />
    </View>
  );
}

// ── EXACT CAMPUS CLARITY DESIGN SYSTEM STYLES ────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF8FE', // Whisper Violet Canvas (Campus Clarity theme)
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: '#FAF8FE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 1. Top Header
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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
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
    gap: 8,
  },
  broadcastingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 4.5,
    paddingHorizontal: 9,
    borderRadius: 20,
    gap: 6,
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
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 11,
    color: '#15803D',
  },
  helpBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll Content
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 88,
  },

  // 2. Profile Summary Card
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1A191F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 12,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatarImage: {
    width: 58,
    height: 58,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
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
    borderColor: '#FFFFFF',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 16,
    color: '#0F172A',
  },
  hodBroadcasterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    marginLeft: 6,
  },
  hodBroadcasterBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 9.5,
    color: '#4326B6',
    letterSpacing: 0.4,
  },
  hodQuickLinkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    shadowColor: '#4326B6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  hodQuickLinkIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  hodQuickLinkTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 13,
    color: '#1E1B4B',
  },
  hodQuickLinkSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  profileTitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  locationText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 11,
    color: '#4326B6',
  },

  // 3. Live Status Banner
  liveBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
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
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#065F46',
    flex: 1,
  },
  liveBannerBold: {
    fontFamily: 'Inter_800ExtraBold',
    fontWeight: '800',
    color: '#15803D',
  },
  liveBannerReset: {
    fontFamily: 'Inter_500Medium',
    color: '#047857',
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
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 11,
    color: '#64748B',
    letterSpacing: 0.5,
  },
  sectionHeaderMeta: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#94A3B8',
  },
  oneTapRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  oneTapText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 11,
    color: '#4326B6',
  },

  // Active Live Broadcast Note Display
  activeNoteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: -8,
    marginBottom: 14,
  },
  activeNoteText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#4326B6',
    fontStyle: 'italic',
  },
  activeNoteMeta: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10.5,
    color: '#6B21A8',
    marginLeft: 6,
  },

  // 4. Permanent Note Typing Area (Inline)
  inlineNoteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#1A191F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  noteInputIcon: {
    marginRight: 8,
  },
  inlineNoteInput: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: '#0F172A',
    paddingVertical: 0,
    height: '100%',
  },
  clearNoteBtn: {
    padding: 4,
    marginRight: 4,
  },
  inlineSaveBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inlineSaveBtnActive: {
    backgroundColor: '#4326B6',
    borderColor: '#4326B6',
    shadowColor: '#4326B6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },

  // 5. 2-Column Status Grid (Core 4 Statuses)
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statusCard: {
    width: '48%',
    borderRadius: 12,
    padding: 13,
    minHeight: 96,
    marginBottom: 12,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    shadowColor: '#1A191F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statusCardActiveElevation: {
    shadowColor: '#4326B6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeCheckBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    opacity: 0.65,
  },
  cardStatusTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontWeight: '800',
    fontSize: 15.5,
    marginTop: 6,
  },
  cardStatusSubtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 14.5,
  },

  // 6. Auto-Reset Status Card
  autoResetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
    shadowColor: '#1A191F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
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
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 13.5,
    color: '#0F172A',
  },
  autoResetSubtitle: {
    fontFamily: 'Inter_400Regular',
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
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11.5,
    color: '#64748B',
  },
  revertTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  revertTimeText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 11.5,
    color: '#4326B6',
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
    backgroundColor: '#4326B6',
  },
  presetBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11.5,
    color: '#475569',
  },
  presetBtnTextActive: {
    fontFamily: 'Inter_800ExtraBold',
    fontWeight: '800',
    color: '#FFFFFF',
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
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 11.5,
    color: '#15803D',
  },

  // 8. Floating Capsule Navigation Bar (Matching Student HomeScreen)
  floatingNavBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#1A191F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 12,
    zIndex: 99,
  },
  floatingTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 9999,
    minWidth: 70,
  },
  floatingTabItemActive: {
    backgroundColor: '#EDE9FE',
  },
  floatingTabLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  floatingTabLabelActive: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#4326B6',
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalDialog: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#1A191F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  historyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontWeight: '800',
    fontSize: 16.5,
    color: '#0F172A',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 17,
  },
  modalInput: {
    backgroundColor: '#FAF8FE',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    fontFamily: 'Inter_500Medium',
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
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalCancelText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#64748B',
  },
  modalSaveBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#4326B6',
  },
  modalSaveText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 13,
    color: '#FFFFFF',
  },

  // History List in Modal
  historyList: {
    gap: 12,
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8FE',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  historyItemTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 13,
    color: '#0F172A',
  },
  historyItemNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  historyItemTime: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10.5,
    color: '#94A3B8',
    marginLeft: 6,
  },
  modalCloseBtn: {
    backgroundColor: '#4326B6',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 13.5,
    color: '#FFFFFF',
  },
});
