import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Switch,
  Alert,
  Platform,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../../src/services/firebase';
import safeStorage from '../../src/services/safeStorage';
import { useAuth } from '../../src/context/AuthContext';
import { useFaculty } from '../../src/context/FacultyContext';
import LogoutModal from '../../src/components/LogoutModal';
import ThemedAlertModal from '../../src/components/ThemedAlertModal';

const STORAGE_KEY_OFFICE_HOURS = '@profping_faculty_office_hours';
const STORAGE_KEY_INTERCOM = '@profping_faculty_intercom';
const STORAGE_KEY_NOTIFS = '@profping_faculty_notifications';
const STORAGE_KEY_VISIBILITY = '@profping_faculty_visibility';

export default function FacultyProfileView({ onBack }) {
  const router = useRouter();
  const { user, profile, role, department, logout } = useAuth();
  const {
    autoResetEnabled,
    setAutoResetEnabled,
    revertTime,
    selectedStatusId,
    statusCount,
    logs,
  } = useFaculty();

  // ── Live Firebase Database State ──────────────────────────────────────────
  const [dbFaculty, setDbFaculty] = useState(null);

  // Faculty-Controlled Editable Details (synced with Firebase)
  const [officeHours, setOfficeHours] = useState('');
  const [intercomExt, setIntercomExt] = useState('');

  // App Preferences
  const [appNotifications, setAppNotificationsState] = useState(true);
  const [directoryVisibility, setDirectoryVisibilityState] = useState(true);

  // Modals for editing details
  const [editHoursModalVisible, setEditHoursModalVisible] = useState(false);
  const [tempHoursInput, setTempHoursInput] = useState('');

  const [editIntercomModalVisible, setEditIntercomModalVisible] = useState(false);
  const [tempIntercomInput, setTempIntercomInput] = useState('');

  const [editPhotoModalVisible, setEditPhotoModalVisible] = useState(false);
  const [tempPhotoInput, setTempPhotoInput] = useState('');
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

  // ── Sync with Firebase Realtime Database ─────────────────────────────────
  useEffect(() => {
    if (!user?.email) return;
    const normalizedEmail = (user.email || '').toLowerCase().trim();

    // 1. Listen to users/{user.uid}
    let userUnsub = null;
    if (user?.uid) {
      const userRef = ref(db, `users/${user.uid}`);
      userUnsub = onValue(userRef, (snap) => {
        if (snap.exists()) {
          const val = snap.val() || {};
          setDbFaculty((prev) => ({ ...prev, ...val }));
          if (val.officeHours) setOfficeHours(val.officeHours);
          if (val.intercom) setIntercomExt(val.intercom);
        }
      });
    }

    // 2. Listen to faculty/ directory in database
    const facultyRef = ref(db, 'faculty');
    const facUnsub = onValue(facultyRef, (snap) => {
      if (snap.exists()) {
        const allFac = snap.val() || {};
        const match = Object.entries(allFac).find(
          ([key, f]) =>
            key === profile?.directoryUid ||
            key === profile?.facultyUid ||
            (f?.email || '').toLowerCase().trim() === normalizedEmail ||
            f?.authUid === user?.uid
        );
        if (match) {
          const [facKey, fData] = match;
          setDbFaculty((prev) => ({
            ...prev,
            ...fData,
            facKey,
          }));
          if (fData.officeHours) setOfficeHours(fData.officeHours);
          if (fData.intercom) setIntercomExt(fData.intercom);
        }
      }
    });

    return () => {
      if (typeof userUnsub === 'function') userUnsub();
      if (typeof facUnsub === 'function') facUnsub();
    };
  }, [user?.uid, user?.email]);

  // Preference setters
  const setAppNotifications = async (val) => {
    setAppNotificationsState(val);
    safeStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(val));
    if (user?.uid) {
      try {
        await update(ref(db, `users/${user.uid}/preferences`), { notifications: val });
      } catch (_) {}
    }
  };

  const setDirectoryVisibility = async (val) => {
    setDirectoryVisibilityState(val);
    safeStorage.setItem(STORAGE_KEY_VISIBILITY, JSON.stringify(val));
    if (user?.uid) {
      try {
        await update(ref(db, `users/${user.uid}/preferences`), { directoryVisibility: val });
        const facKey = dbFaculty?.facKey || profile?.directoryUid;
        if (facKey) {
          await update(ref(db, `faculty/${facKey}`), { directoryVisibility: val });
        }
      } catch (_) {}
    }
  };

  // Save Office Hours to Firebase RTDB
  const handleSaveOfficeHours = async () => {
    if (!tempHoursInput.trim()) return;
    const clean = tempHoursInput.trim();
    setOfficeHours(clean);
    safeStorage.setItem(STORAGE_KEY_OFFICE_HOURS, clean);
    setEditHoursModalVisible(false);

    try {
      const updates = { officeHours: clean, updatedAt: Date.now() };
      if (user?.uid) {
        await update(ref(db, `users/${user.uid}`), updates);
      }
      const facKey = dbFaculty?.facKey || profile?.directoryUid || profile?.facultyUid;
      if (facKey) {
        await update(ref(db, `faculty/${facKey}`), updates);
      }
    } catch (err) {
      console.warn('Firebase faculty office hours sync note:', err.message);
    }
  };

  // Save Intercom Extension to Firebase RTDB
  const handleSaveIntercom = async () => {
    if (!tempIntercomInput.trim()) return;
    let clean = tempIntercomInput.trim();
    if (!clean.toLowerCase().startsWith('ext')) {
      clean = `Ext. ${clean}`;
    }
    setIntercomExt(clean);
    safeStorage.setItem(STORAGE_KEY_INTERCOM, clean);
    setEditIntercomModalVisible(false);

    try {
      const updates = { intercom: clean, updatedAt: Date.now() };
      if (user?.uid) {
        await update(ref(db, `users/${user.uid}`), updates);
      }
      const facKey = dbFaculty?.facKey || profile?.directoryUid || profile?.facultyUid;
      if (facKey) {
        await update(ref(db, `faculty/${facKey}`), updates);
      }
    } catch (err) {
      console.warn('Firebase faculty intercom sync note:', err.message);
    }
  };

  // Save Photo URL to Firebase RTDB
  const handleSavePhotoUrl = async (url) => {
    const clean = (url || '').trim();
    setEditPhotoModalVisible(false);

    try {
      const updates = { photoURL: clean || null, photoUrl: clean || null, updatedAt: Date.now() };
      if (user?.uid) {
        await update(ref(db, `users/${user.uid}`), updates);
      }
      const facKey = dbFaculty?.facKey || profile?.directoryUid || profile?.facultyUid;
      if (facKey) {
        await update(ref(db, `faculty/${facKey}`), updates);
      }
    } catch (err) {
      console.warn('Firebase faculty photo sync note:', err.message);
    }
  };

  // Lock Handler for Core Institutional Data
  const handleLockedFieldPress = (fieldName) => {
    showAlert({
      title: 'Institutional Data Locked',
      message: `"${fieldName}" is verified institutional data managed centrally by the Registrar and Department HOD.\n\nChanges must be requested through administrative channels.`,
      type: 'locked',
      primaryText: 'Understood',
    });
  };

  const liveStatus = selectedStatusId;
  const facultyName =
    dbFaculty?.name ||
    dbFaculty?.displayName ||
    user?.displayName ||
    user?.name ||
    (user?.email ? user.email.split('@')[0].split('.').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'Faculty Member');

  const currentDept = (dbFaculty?.department || department || 'CMPN').toUpperCase();
  const designation = dbFaculty?.designation || (role === 'hod' ? 'Professor & HOD' : 'Associate Professor');
  const facultyDeptText = `${designation} • ${currentDept} Dept`;
  const facultyEmail = dbFaculty?.email || user?.email || 'faculty@sfit.ac.in';
  const facultyIdText = dbFaculty?.facultyId || dbFaculty?.uid || `SFIT-${currentDept}-FAC`;
  const cabinText = dbFaculty?.cabin
    ? `${dbFaculty.cabin}${dbFaculty.floor ? ` • ${dbFaculty.floor}` : ''}${dbFaculty.wing ? ` (${dbFaculty.wing})` : ''}`
    : 'Hall No. 301 • Table 1';
  const displayOfficeHours = dbFaculty?.officeHours || officeHours || '09:00 AM - 05:00 PM';
  const displayIntercom = dbFaculty?.intercom || intercomExt || 'Ext. N/A';
  const currentPhoto = dbFaculty?.photoURL || dbFaculty?.photoUrl || user?.photoURL || null;

  const initials =
    facultyName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('') || 'FC';

  const handleLogoutPress = () => {
    setLogoutModalVisible(true);
  };

  const handleConfirmLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      {/* ── TOP HEADER (Campus Clarity System) ───────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerSub}>
              {role === 'hod' ? 'HOD ACCESS • GOVERNANCE' : 'FACULTY ACCESS'}
            </Text>
            <Text style={styles.headerTitle}>
              {role === 'hod' ? 'HOD PROFILE' : 'PROFILE'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── FACULTY HERO CARD ───────────────────────────────────────── */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            {/* Avatar with Camera/Edit Badge + Live Green Dot */}
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={() => {
                setTempPhotoInput(currentPhoto || '');
                setEditPhotoModalVisible(true);
              }}
              activeOpacity={0.85}
            >
              {currentPhoto ? (
                <Image
                  source={{ uri: currentPhoto }}
                  style={styles.avatarImg}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.initialsAvatarBox}>
                  <Text style={styles.initialsAvatarText}>{initials}</Text>
                </View>
              )}
              <View style={styles.activeDotBadge}>
                <View style={styles.activeDotInner} />
              </View>
              {/* Photo Edit Badge */}
              <View style={styles.photoEditBadge}>
                <FontAwesome5 name="camera" size={9} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* Faculty Meta (Institutional Data Locked) */}
            <View style={styles.heroMeta}>
              {/* Role Badge */}
              <View style={[styles.roleBadgeBox, role === 'hod' && styles.roleBadgeBoxHod]}>
                {role === 'hod' && (
                  <FontAwesome5 name="user-tie" size={9} color="#4326B6" style={{ marginRight: 4 }} />
                )}
                <Text style={[styles.roleBadgeText, role === 'hod' && styles.roleBadgeTextHod]}>
                  {role === 'hod' ? 'DEPARTMENT HOD' : 'FACULTY'}
                </Text>
              </View>

              {/* Name (Locked) */}
              <TouchableOpacity
                onPress={() => handleLockedFieldPress('Faculty Name')}
                activeOpacity={0.7}
                style={styles.lockedRowItem}
              >
                <Text style={styles.facultyNameText}>{facultyName}</Text>
                <FontAwesome5 name="lock" size={10} color="#94A3B8" style={{ marginLeft: 6 }} />
              </TouchableOpacity>

              {/* Department & Designation (Locked) */}
              <TouchableOpacity
                onPress={() => handleLockedFieldPress('Department & Designation')}
                activeOpacity={0.7}
                style={styles.lockedRowItem}
              >
                <Text style={styles.facultyDeptText}>{facultyDeptText}</Text>
                <FontAwesome5 name="lock" size={9} color="#94A3B8" style={{ marginLeft: 5 }} />
              </TouchableOpacity>

              {/* Cabin Location link (Locked) */}
              <TouchableOpacity
                style={styles.locationLink}
                onPress={() => handleLockedFieldPress('Cabin Assignment')}
                activeOpacity={0.7}
              >
                <FontAwesome5 name="map-marker-alt" size={11} color="#4326B6" style={{ marginRight: 5 }} />
                <Text style={styles.locationLinkText}>{cabinText}</Text>
                <FontAwesome5 name="lock" size={9} color="#818CF8" style={{ marginLeft: 5 }} />
              </TouchableOpacity>

              {/* Email (Locked) */}
              <TouchableOpacity
                onPress={() => handleLockedFieldPress('Institutional Email')}
                activeOpacity={0.7}
                style={styles.lockedRowItem}
              >
                <Text style={styles.facultyEmailText}>{facultyEmail}</Text>
                <FontAwesome5 name="lock" size={9} color="#94A3B8" style={{ marginLeft: 5 }} />
              </TouchableOpacity>

              {/* Live Status Pill */}
              <View
                style={[
                  styles.inCabinPill,
                  liveStatus === 'busy' && { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
                  liveStatus === 'in_lecture' && { backgroundColor: '#DBEAFE', borderColor: '#BFDBFE' },
                  liveStatus === 'off_campus' && { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
                ]}
              >
                <View
                  style={[
                    styles.inCabinDot,
                    liveStatus === 'busy' && { backgroundColor: '#D97706' },
                    liveStatus === 'in_lecture' && { backgroundColor: '#2563EB' },
                    liveStatus === 'off_campus' && { backgroundColor: '#DC2626' },
                  ]}
                />
                <Text
                  style={[
                    styles.inCabinText,
                    liveStatus === 'busy' && { color: '#78350F' },
                    liveStatus === 'in_lecture' && { color: '#1E40AF' },
                    liveStatus === 'off_campus' && { color: '#991B1B' },
                  ]}
                >
                  {liveStatus === 'busy'
                    ? 'Busy (DND)'
                    : liveStatus === 'in_lecture'
                    ? 'In Lecture'
                    : liveStatus === 'off_campus'
                    ? 'Off Campus'
                    : 'Active Available'}
                </Text>
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* 3 Stats Columns */}
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statNumberBlue}>{logs.length > 0 ? `${logs.length}` : '0'}</Text>
              <Text style={styles.statLabel}>Today's Events</Text>
            </View>

            <View style={styles.statColDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statNumberBlue}>{statusCount > 0 ? statusCount : '—'}</Text>
              <Text style={styles.statLabel}>Status Updates</Text>
            </View>

            <View style={styles.statColDivider} />

            <View style={styles.statCol}>
              <Text style={styles.statNumberGreen}>Active</Text>
              <Text style={styles.statLabel}>Firebase Live</Text>
            </View>
          </View>
        </View>

        {/* ── CABIN & ACCOUNT DETAILS ─────────────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>CABIN & ACCOUNT DETAILS</Text>
          <Text style={styles.hodNoticeText}>
            {role === 'hod' ? 'Official institutional records • Verified by Registrar' : 'Institutional data set by HOD'}
          </Text>
        </View>
        <View style={styles.groupedCard}>
          {/* Cabin Assignment (Locked) */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => handleLockedFieldPress('Cabin Assignment')}
            activeOpacity={0.7}
          >
            <View style={styles.iconBoxBlue}>
              <FontAwesome5 name="door-open" size={14} color="#2563EB" />
            </View>
            <Text style={styles.menuLabel}>Cabin Assignment</Text>
            <Text style={styles.menuValueText}>{cabinText}</Text>
            <FontAwesome5 name="lock" size={11} color="#94A3B8" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          {/* Office Hours (Editable by Faculty) */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => {
              setTempHoursInput(displayOfficeHours);
              setEditHoursModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.iconBoxBlue}>
              <FontAwesome5 name="clock" size={14} color="#2563EB" />
            </View>
            <Text style={styles.menuLabel}>Office Hours</Text>
            <Text style={styles.menuValueEditableText}>{displayOfficeHours}</Text>
            <FontAwesome5 name="pen" size={10} color="#4326B6" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          {/* Intercom Ext. (Editable by Faculty) */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => {
              setTempIntercomInput(displayIntercom);
              setEditIntercomModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.iconBoxBlue}>
              <FontAwesome5 name="phone-alt" size={13} color="#2563EB" />
            </View>
            <Text style={styles.menuLabel}>Intercom Ext.</Text>
            <View style={styles.extBadge}>
              <Text style={styles.extBadgeText}>{displayIntercom}</Text>
            </View>
            <FontAwesome5 name="pen" size={10} color="#4326B6" style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          <View style={styles.rowDivider} />

          {/* Faculty ID (Locked) */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => handleLockedFieldPress('Faculty ID')}
            activeOpacity={0.7}
          >
            <View style={styles.iconBoxBlue}>
              <FontAwesome5 name="id-card" size={13} color="#4326B6" />
            </View>
            <Text style={styles.menuLabel}>Faculty ID</Text>
            <Text style={styles.facultyIdText}>{facultyIdText}</Text>
            <FontAwesome5 name="lock" size={11} color="#94A3B8" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>

        {/* ── DEPARTMENT MANAGEMENT (HOD Only) ────────────────────────── */}
        {role === 'hod' && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeading}>DEPARTMENT GOVERNANCE</Text>
              <Text style={styles.hodNoticeText}>{currentDept} Department Controls</Text>
            </View>
            <View style={styles.groupedCard}>
              <TouchableOpacity
                style={styles.menuRow}
                onPress={() => router.push('/(faculty)/department')}
                activeOpacity={0.7}
              >
                <View style={styles.iconBoxPurple}>
                  <FontAwesome5 name="users-cog" size={13} color="#4326B6" />
                </View>
                <View style={styles.menuLabelCol}>
                  <Text style={styles.menuLabel}>Department Faculty & Desk Overview</Text>
                  <Text style={styles.menuSubLabel}>View live faculty pings & desk hours compliance</Text>
                </View>
                <FontAwesome5 name="chevron-right" size={11} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── PREFERENCES (Editable by Faculty) ───────────────────────── */}
        <Text style={styles.sectionHeading}>APP PREFERENCES</Text>
        <View style={styles.groupedCard}>
          {/* App Notifications */}
          <View style={styles.menuRow}>
            <View style={styles.iconBoxSlate}>
              <FontAwesome5 name="bell" size={14} color="#334155" />
            </View>
            <View style={styles.menuLabelCol}>
              <Text style={styles.menuLabel}>App Notifications</Text>
              <Text style={styles.menuSubLabel}>Instant campus pings</Text>
            </View>
            <Switch
              value={appNotifications}
              onValueChange={setAppNotifications}
              trackColor={{ false: '#E2E8F0', true: '#4326B6' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.rowDivider} />

          {/* Auto-Reset Status */}
          <View style={styles.menuRow}>
            <View style={styles.iconBoxSlate}>
              <FontAwesome5 name="stopwatch" size={14} color="#334155" />
            </View>
            <View style={styles.menuLabelCol}>
              <Text style={styles.menuLabel}>Auto-Reset Status</Text>
              <Text style={styles.menuSubLabel}>
                {autoResetEnabled ? `Reverts to 'Not Signed' at ${revertTime}` : 'Disabled'}
              </Text>
            </View>
            <Switch
              value={autoResetEnabled}
              onValueChange={setAutoResetEnabled}
              trackColor={{ false: '#E2E8F0', true: '#4326B6' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.rowDivider} />

          {/* Directory Visibility */}
          <View style={styles.menuRow}>
            <View style={styles.iconBoxSlate}>
              <FontAwesome5 name="eye" size={14} color="#334155" />
            </View>
            <View style={styles.menuLabelCol}>
              <Text style={styles.menuLabel}>Directory Visibility</Text>
              <Text style={styles.menuSubLabel}>Allow students to view desk status</Text>
            </View>
            <Switch
              value={directoryVisibility}
              onValueChange={setDirectoryVisibility}
              trackColor={{ false: '#E2E8F0', true: '#4326B6' }}
              thumbColor="#ffffff"
            />
          </View>

          <View style={styles.rowDivider} />

          {/* Feedback & Support */}
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() =>
              showAlert({
                title: 'Campus IT Support',
                message: 'Reach out to IT Support at support@sfit.ac.in or call campus Ext. 100 for faculty workstation & account assistance.',
                type: 'info',
                primaryText: 'Done',
              })
            }
            activeOpacity={0.7}
          >
            <View style={styles.iconBoxSlate}>
              <FontAwesome5 name="headset" size={14} color="#334155" />
            </View>
            <Text style={[styles.menuLabel, { flex: 1 }]}>Feedback & Support</Text>
            <FontAwesome5 name="chevron-right" size={11} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* ── LOG OUT BUTTON ─────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.logoutCard}
          onPress={handleLogoutPress}
          activeOpacity={0.8}
        >
          <View style={styles.iconBoxRed}>
            <FontAwesome5 name="sign-out-alt" size={14} color="#EF4444" />
          </View>
          <Text style={styles.logoutText}>Sign Out from ProfPing</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── MODAL: EDIT OFFICE HOURS ──────────────────────────────────── */}
      <Modal
        visible={editHoursModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditHoursModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalDialog}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Edit Office Hours</Text>
              <TouchableOpacity onPress={() => setEditHoursModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Specify your daily consultation window for students:
            </Text>

            <TextInput
              style={styles.modalInput}
              value={tempHoursInput}
              onChangeText={setTempHoursInput}
              placeholder="e.g. 09:00 AM - 05:00 PM"
              placeholderTextColor="#94A3B8"
              autoFocus
            />

            {/* Quick Presets */}
            <View style={styles.presetChipRow}>
              {['09:00 AM - 05:00 PM', '10:00 AM - 04:00 PM', '08:30 AM - 03:30 PM'].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={styles.presetChip}
                  onPress={() => setTempHoursInput(preset)}
                >
                  <Text style={styles.presetChipText}>{preset}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditHoursModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveOfficeHours}
              >
                <Text style={styles.modalSaveText}>Save Hours</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: EDIT INTERCOM EXTENSION ────────────────────────────── */}
      <Modal
        visible={editIntercomModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditIntercomModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalDialog}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Update Intercom Ext.</Text>
              <TouchableOpacity onPress={() => setEditIntercomModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Enter your desk landline extension for campus calling:
            </Text>

            <TextInput
              style={styles.modalInput}
              value={tempIntercomInput}
              onChangeText={setTempIntercomInput}
              placeholder="e.g. Ext. 402 or 402"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditIntercomModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveIntercom}
              >
                <Text style={styles.modalSaveText}>Save Extension</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: UPDATE PROFILE PHOTO ──────────────────────────────── */}
      <Modal
        visible={editPhotoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditPhotoModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalDialog}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Update Profile Photo</Text>
              <TouchableOpacity onPress={() => setEditPhotoModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Enter a direct image link (PNG, JPG, WebP) to display as your photo:
            </Text>

            <TextInput
              style={styles.modalInput}
              value={tempPhotoInput}
              onChangeText={setTempPhotoInput}
              placeholder="https://example.com/avatar.jpg"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => handleSavePhotoUrl('')}
              >
                <Text style={[styles.modalCancelText, { color: '#DC2626' }]}>Clear Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={() => handleSavePhotoUrl(tempPhotoInput)}
              >
                <Text style={styles.modalSaveText}>Save Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── THEMED LOGOUT CONFIRMATION MODAL ──────────────────────────── */}
      <LogoutModal
        visible={logoutModalVisible}
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={handleConfirmLogout}
        roleLabel="faculty"
      />

      {/* ── THEMED INSTITUTIONAL ALERT MODAL ─────────────────────────── */}
      <ThemedAlertModal {...alertConfig} onClose={closeAlert} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8FE',
  },

  // 1. Header
  header: {
    backgroundColor: '#FAF8FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 62 : 46,
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBlock: {
    justifyContent: 'center',
  },
  headerSub: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 88,
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImg: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
  },
  initialsAvatarBox: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsAvatarText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4326B6',
  },
  activeDotBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
  },
  photoEditBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4326B6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMeta: {
    flex: 1,
  },
  lockedRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  facultyNameText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  facultyDeptText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  locationLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  locationLinkText: {
    fontSize: 11,
    color: '#4326B6',
    fontWeight: '700',
  },
  facultyEmailText: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 5,
  },
  inCabinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
    marginTop: 7,
  },
  inCabinDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#15803D',
    marginRight: 5,
  },
  inCabinText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statNumberBlue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4326B6',
  },
  statNumberGreen: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  statColDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },

  // Section
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  sectionHeading: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  hodNoticeText: {
    fontSize: 11,
    color: '#777585',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  roleBadgeBox: {
    backgroundColor: '#E0D8FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleBadgeBoxHod: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#190D4A',
    letterSpacing: 0.5,
  },
  roleBadgeTextHod: {
    color: '#4326B6',
  },
  iconBoxPurple: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  iconBoxBlue: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconBoxSlate: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconBoxRed: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuLabelCol: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  menuSubLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  menuValueText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  menuValueEditableText: {
    fontSize: 12.5,
    color: '#4326B6',
    fontWeight: '600',
  },
  extBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  extBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4326B6',
  },
  facultyIdText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#4326B6',
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#F8FAFC',
    marginLeft: 60,
  },

  // Logout Card
  logoutCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#EF4444',
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 16, 68, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalDialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#4326B6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 17,
    color: '#1E1B4B',
  },
  modalSubtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 14,
    lineHeight: 18,
  },
  modalInput: {
    backgroundColor: '#FAF8FE',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#1E1B4B',
    marginBottom: 14,
  },
  presetChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  presetChip: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  presetChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#4326B6',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCancelBtnFull: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    marginTop: 12,
  },
  modalCancelText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#475569',
  },
  modalSaveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#4326B6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4326B6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  modalSaveText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 13,
    color: '#FFFFFF',
  },

  // Avatar Selection Row
  avatarSelectionRow: {
    flexDirection: 'row',
    gap: 14,
    marginVertical: 10,
  },
  avatarOption: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  avatarOptionSelected: {
    borderColor: '#4326B6',
    backgroundColor: '#FAF8FE',
  },
  avatarOptionImg: {
    width: 58,
    height: 58,
    borderRadius: 14,
    marginBottom: 8,
  },
  avatarOptionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  avatarOptionLabelSelected: {
    color: '#4326B6',
    fontWeight: '700',
  },
  avatarOptionCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4326B6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
