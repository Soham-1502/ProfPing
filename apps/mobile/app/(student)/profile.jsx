import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar,
  Platform,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
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
import FloatingNavbar from '../../src/components/FloatingNavbar';
import LogoutModal from '../../src/components/LogoutModal';
import { getStarredFacultyUids } from '../../src/services/favoritesStorage';

const DEPARTMENTS = [
  { code: 'CMPN', name: 'Computer' },
  { code: 'ECS', name: 'Electronics & CS' },
  { code: 'INFT', name: 'Information Tech' },
  { code: 'EXTC', name: 'Telecom' },
];

export default function StudentProfilePage() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const { user, profile, department, logout, updateStudentProfile, updateStudentDepartment } = useAuth();
  const router = useRouter();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // Edit Profile Modal State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDept, setEditDept] = useState('CMPN');
  const [editRoll, setEditRoll] = useState('');
  const [editPid, setEditPid] = useState('');
  const [editPhotoURL, setEditPhotoURL] = useState('');
  const [saving, setSaving] = useState(false);

  const studentName =
    profile?.name ||
    profile?.displayName ||
    user?.displayName ||
    user?.name ||
    (user?.email ? user.email.split('@')[0].split('.').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'Student Account');
  const studentEmail = user?.email || 'student@sfit.ac.in';
  const studentDept = (department || profile?.department || user?.department || 'CMPN').toUpperCase();
  const currentPhoto = profile?.photoURL || user?.photoURL || null;
  const rollNumber = profile?.rollNumber || profile?.rollNo || '';
  const pid = profile?.pid || '';

  const initials =
    studentName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('') || 'ST';

  const [starredCount, setStarredCount] = useState(0);

  useEffect(() => {
    getStarredFacultyUids().then((set) => setStarredCount(set.size));
  }, []);

  const openEditModal = () => {
    setEditName(studentName);
    setEditDept(studentDept);
    setEditRoll(rollNumber);
    setEditPid(pid);
    setEditPhotoURL(currentPhoto || '');
    setEditModalVisible(true);
  };

  const handleSaveProfile = async () => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      Alert.alert('Required Field', 'Please enter your full name.');
      return;
    }

    const trimmedPid = editPid.trim();
    if (trimmedPid && !/^\d{6}$/.test(trimmedPid)) {
      Alert.alert('Invalid PID', 'PID must be exactly 6 numeric digits (e.g., 221045).');
      return;
    }

    try {
      setSaving(true);
      await updateStudentProfile({
        name: trimmedName,
        department: editDept,
        rollNumber: editRoll.trim(),
        pid: trimmedPid,
        photoURL: editPhotoURL.trim() || null,
      });
      setSaving(false);
      setEditModalVisible(false);
      Alert.alert('Profile Updated', 'Your profile details have been saved successfully.');
    } catch (err) {
      setSaving(false);
      Alert.alert('Update Failed', err.message || 'Could not save profile changes.');
    }
  };

  const handleSelectDepartment = () => {
    Alert.alert(
      'Select Department',
      'Choose your enrolled engineering department:',
      [
        { text: 'CMPN (Computer Engg)', onPress: () => updateStudentDepartment('CMPN') },
        { text: 'ECS (Electronics & Computer Science)', onPress: () => updateStudentDepartment('ECS') },
        { text: 'INFT (Information Technology)', onPress: () => updateStudentDepartment('INFT') },
        { text: 'EXTC (Electronics & Telecom)', onPress: () => updateStudentDepartment('EXTC') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
    router.replace('/(auth)/login');
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

      {/* ── TOP HEADER BAR ─────────────────────────────────────────── */}
      <View style={styles.topHeader}>
        <View style={styles.titleBlock}>
          <View style={styles.accountBadge}>
            <Text style={styles.accountBadgeText}>STUDENT ACCOUNT</Text>
          </View>
          <Text style={styles.screenTitle}>Student Profile</Text>
        </View>
        <TouchableOpacity
          style={styles.editProfileHeaderBtn}
          onPress={openEditModal}
          activeOpacity={0.8}
        >
          <Ionicons name="pencil-sharp" size={13} color="#4326B6" style={{ marginRight: 5 }} />
          <Text style={styles.editProfileHeaderBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* ── PROFILE SCROLL VIEW ────────────────────────────────────── */}
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. STUDENT IDENTITY CARD */}
        <View style={styles.studentIdCard}>
          <View style={styles.studentIdTopRow}>
            {/* Avatar (Photo or Initials) */}
            <TouchableOpacity
              style={styles.avatarBox}
              onPress={openEditModal}
              activeOpacity={0.85}
            >
              {currentPhoto ? (
                <Image source={{ uri: currentPhoto }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{initials}</Text>
              )}
              <View style={styles.editBadge}>
                <Ionicons name="camera" size={10} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            {/* Identity Info: Name, College Email, Department */}
            <View style={styles.infoCol}>
              <View style={styles.nameRow}>
                <Text style={styles.fullName} numberOfLines={1}>
                  {studentName}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="mail-outline" size={13} color="#64748B" style={{ marginRight: 6 }} />
                <Text style={styles.emailText} numberOfLines={1}>
                  {studentEmail}
                </Text>
              </View>

              {/* Department Pill */}
              <TouchableOpacity
                style={styles.deptSelectPill}
                onPress={handleSelectDepartment}
                activeOpacity={0.8}
              >
                <FontAwesome5 name="graduation-cap" size={11} color="#4326B6" style={{ marginRight: 6 }} />
                <Text style={styles.deptSelectText}>Department: {studentDept}</Text>
                <FontAwesome5 name="chevron-down" size={9} color="#4326B6" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Roll Number & PID Badges Row */}
          <View style={styles.academicChipsContainer}>
            <View style={styles.academicChip}>
              <Text style={styles.academicChipLabel}>ROLL NO.</Text>
              <Text style={styles.academicChipValue}>{rollNumber || 'Not set'}</Text>
            </View>
            <View style={styles.academicChip}>
              <Text style={styles.academicChipLabel}>PID (6 DIGITS)</Text>
              <Text style={styles.academicChipValue}>{pid || 'Not set'}</Text>
            </View>
          </View>

          {/* Horizontal Divider */}
          <View style={styles.cardDivider} />

          {/* Single Focused Metric: Starred Faculty */}
          <View style={styles.statsRow}>
            <View style={styles.statItemSingle}>
              <Text style={styles.statNumberPurple}>{starredCount}</Text>
              <Text style={styles.statLabelMuted}>STARRED FACULTY</Text>
            </View>
          </View>
        </View>

        {/* 2. CAMPUS IT HELP CENTER */}
        <TouchableOpacity
          style={styles.supportCard}
          onPress={() =>
            Alert.alert(
              'Campus IT Help Center',
              'SFIT IT Support:\nEmail: it-support@sfit.ac.in\nExtension: 2404 / Academic Wing B'
            )
          }
          activeOpacity={0.85}
        >
          <Ionicons name="help-circle-outline" size={19} color="#334155" style={{ marginRight: 10 }} />
          <Text style={styles.supportText}>Campus IT Help Center & Support</Text>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
        </TouchableOpacity>

        {/* 3. LOG OUT BUTTON */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setLogoutModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={18} color="#DC2626" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>

        {/* 4. FOOTER METADATA */}
        <View style={styles.footerBlock}>
          <Text style={styles.footerBuildText}>ProfPing Student v2.4.1</Text>
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>

      {/* ── EDIT PROFILE MODAL ────────────────────────────────────────── */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.editCard}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Edit Student Profile</Text>
                  <Text style={styles.modalSubtitle}>Update your name, roll, PID, and photo</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setEditModalVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.modalScroll}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {/* 1. Profile Photo (Image URL) */}
                <Text style={styles.inputSectionTitle}>PROFILE PHOTO</Text>
                <View style={styles.photoSectionCard}>
                  <View style={styles.previewAvatarBox}>
                    {editPhotoURL ? (
                      <Image source={{ uri: editPhotoURL }} style={styles.previewAvatarImage} />
                    ) : (
                      <Text style={styles.previewAvatarInitials}>{initials}</Text>
                    )}
                  </View>

                  <View style={styles.photoInputsCol}>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="link-outline" size={16} color="#64748B" style={styles.inputIcon} />
                      <TextInput
                        style={styles.inputFieldWithIcon}
                        placeholder="Image URL (e.g. https://.../photo.jpg)"
                        placeholderTextColor="#94A3B8"
                        value={editPhotoURL}
                        onChangeText={setEditPhotoURL}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      {Boolean(editPhotoURL) && (
                        <TouchableOpacity
                          onPress={() => setEditPhotoURL('')}
                          style={styles.clearUrlBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Ionicons name="close-circle" size={16} color="#94A3B8" />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.photoHelperText}>
                      Paste an image URL (PNG, JPG, WebP) to display as your photo, or leave empty to use your initials.
                    </Text>
                  </View>
                </View>

                {/* 2. Full Name Input */}
                <Text style={styles.inputSectionTitle}>FULL NAME *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={16} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.inputFieldWithIcon}
                    placeholder="Enter your full name"
                    placeholderTextColor="#94A3B8"
                    value={editName}
                    onChangeText={setEditName}
                  />
                </View>

                {/* 3. Department Selection */}
                <Text style={styles.inputSectionTitle}>DEPARTMENT *</Text>
                <View style={styles.deptOptionsGrid}>
                  {DEPARTMENTS.map((d) => {
                    const isSelected = editDept === d.code;
                    return (
                      <TouchableOpacity
                        key={d.code}
                        style={[
                          styles.deptOptionCard,
                          isSelected && styles.deptOptionCardActive,
                        ]}
                        onPress={() => setEditDept(d.code)}
                      >
                        <Text
                          style={[
                            styles.deptOptionCode,
                            isSelected && styles.deptOptionCodeActive,
                          ]}
                        >
                          {d.code}
                        </Text>
                        <Text
                          style={[
                            styles.deptOptionName,
                            isSelected && styles.deptOptionNameActive,
                          ]}
                          numberOfLines={1}
                        >
                          {d.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* 4. Roll Number & PID */}
                <View style={styles.rowInputsContainer}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.inputSectionTitle}>ROLL NO.</Text>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        style={styles.inputFieldPlain}
                        placeholder="e.g. 42"
                        placeholderTextColor="#94A3B8"
                        value={editRoll}
                        onChangeText={setEditRoll}
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>

                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <View style={styles.labelWithBadge}>
                      <Text style={styles.inputSectionTitle}>PID *</Text>
                      <Text
                        style={[
                          styles.pidCounterText,
                          editPid.length === 6 && { color: '#16A34A' },
                        ]}
                      >
                        {editPid.length}/6
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.inputWrapper,
                        editPid.length > 0 && editPid.length !== 6 && styles.inputWrapperError,
                      ]}
                    >
                      <TextInput
                        style={styles.inputFieldPlain}
                        placeholder="6-digit PID"
                        placeholderTextColor="#94A3B8"
                        value={editPid}
                        onChangeText={(txt) => setEditPid(txt.replace(/\D/g, '').slice(0, 6))}
                        keyboardType="numeric"
                        maxLength={6}
                      />
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.modalActionsRow}>
                  <TouchableOpacity
                    style={styles.cancelModalBtn}
                    onPress={() => setEditModalVisible(false)}
                    disabled={saving}
                  >
                    <Text style={styles.cancelModalBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveModalBtn}
                    onPress={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-sharp" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.saveModalBtnText}>Save Changes</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── THEMED LOGOUT CONFIRMATION MODAL ──────────────────────────── */}
      <LogoutModal
        visible={logoutModalVisible}
        onCancel={() => setLogoutModalVisible(false)}
        onConfirm={handleLogout}
        roleLabel="student"
      />
    </View>
  );
}

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
  topHeader: {
    backgroundColor: '#FAF8FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 62 : 46,
    paddingBottom: 12,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A191F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  titleBlock: {
    flex: 1,
    marginLeft: 0,
  },
  accountBadge: {
    backgroundColor: '#EDE9FE',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  accountBadgeText: {
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
  editProfileHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  editProfileHeaderBtnText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 12,
    color: '#4326B6',
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 110,
  },

  // Student Identity Card
  studentIdCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#1A191F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  studentIdTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarBox: {
    position: 'relative',
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'visible',
  },
  avatarImage: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  avatarInitials: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 20,
    color: '#3730A3',
  },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4326B6',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  fullName: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 16,
    color: '#1A191F',
    flex: 1,
    marginRight: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  emailText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11.5,
    color: '#64748B',
    flex: 1,
  },
  deptSelectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 8,
  },
  deptSelectText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11.5,
    color: '#4326B6',
  },

  // Academic Badges (Roll Number & PID)
  academicChipsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  academicChip: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  academicChipLabel: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 9,
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  academicChipValue: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 12.5,
    color: '#1E293B',
  },

  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 4,
  },
  statItemSingle: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  statNumberPurple: {
    fontFamily: 'Inter_800ExtraBold',
    fontWeight: '800',
    fontSize: 19,
    color: '#4326B6',
  },
  statLabelMuted: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 9,
    color: '#64748B',
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: 'center',
  },

  // Campus Support
  supportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#1A191F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  supportText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#1A191F',
    flex: 1,
  },

  // Log Out
  logoutBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoutBtnText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 13.5,
    color: '#DC2626',
  },

  // Footer Metadata
  footerBlock: {
    alignItems: 'center',
    marginBottom: 16,
  },
  footerBuildText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: '#94A3B8',
    letterSpacing: 0.5,
  },

  // ── MODAL STYLES ──────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  editCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 18,
    paddingHorizontal: 20,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 14,
  },
  modalTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 17,
    color: '#1E1B4B',
  },
  modalSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    maxHeight: 520,
  },
  inputSectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 10.5,
    color: '#475569',
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 10,
  },

  // Avatar URL section
  photoSectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  previewAvatarBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: '#4326B6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  previewAvatarImage: {
    width: '100%',
    height: '100%',
  },
  previewAvatarInitials: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#4326B6',
  },
  photoInputsCol: {
    flex: 1,
  },
  clearUrlBtn: {
    paddingLeft: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoHelperText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 14,
  },

  // Form Inputs
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  inputWrapperError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  inputIcon: {
    marginRight: 8,
  },
  inputFieldWithIcon: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 13.5,
    color: '#1E293B',
    height: '100%',
  },
  inputField: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    fontFamily: 'Inter_500Medium',
    fontSize: 12.5,
    color: '#1E293B',
  },
  inputFieldPlain: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 13.5,
    color: '#1E293B',
    height: '100%',
  },

  // Department Grid
  deptOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  deptOptionCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  deptOptionCardActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#4326B6',
    borderWidth: 1.5,
  },
  deptOptionCode: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 13,
    color: '#475569',
  },
  deptOptionCodeActive: {
    color: '#4326B6',
  },
  deptOptionName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 1,
  },
  deptOptionNameActive: {
    color: '#6D28D9',
  },

  // Row Inputs
  rowInputsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
  },
  labelWithBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pidCounterText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 10,
  },

  // Modal Actions
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
    marginBottom: 10,
  },
  cancelModalBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13.5,
    color: '#475569',
  },
  saveModalBtn: {
    flex: 2,
    backgroundColor: '#4326B6',
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4326B6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveModalBtnText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 13.5,
    color: '#FFFFFF',
  },
});
