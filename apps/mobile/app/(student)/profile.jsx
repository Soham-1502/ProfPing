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
  Switch,
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

export default function StudentProfilePage() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const { user, department, logout, updateStudentDepartment } = useAuth();
  const router = useRouter();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const studentName =
    user?.displayName ||
    user?.name ||
    (user?.email ? user.email.split('@')[0].split('.').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : 'Student Account');
  const studentEmail = user?.email || 'student@sfit.ac.in';
  const studentDept = (department || user?.department || 'CMPN').toUpperCase();
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
            {/* Avatar with Initials */}
            <View style={styles.avatarBox}>
              <Text style={styles.avatarInitials}>{initials}</Text>
              <View style={styles.onlineBadge}>
                <Ionicons name="checkmark" size={11} color="#FFFFFF" />
              </View>
            </View>

            {/* Identity Info: Name, College Email, Department */}
            <View style={styles.infoCol}>
              <View style={styles.nameRow}>
                <Text style={styles.fullName} numberOfLines={1}>
                  {studentName}
                </Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="mail-outline" size={13} color="#64748B" style={{ marginRight: 6 }} />
                <Text style={styles.emailText}>{studentEmail}</Text>
              </View>

              {/* Department Selector */}
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
          <Text style={styles.footerBuildText}>PROF-PING Student v2.4.1</Text>
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>

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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarInitials: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 18,
    color: '#3730A3',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#16A34A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
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
  activeCampusIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activeCampusIdDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16A34A',
    marginRight: 4,
  },
  activeCampusIdText: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 10,
    color: '#15803D',
  },
  degreeText: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 12.5,
    color: '#1A191F',
    marginTop: 2,
  },
  yearText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  rollText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11.5,
    color: '#4326B6',
  },
  emailText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11.5,
    color: '#64748B',
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
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumberPurple: {
    fontFamily: 'Inter_800ExtraBold',
    fontWeight: '800',
    fontSize: 19,
    color: '#4326B6',
  },
  statNumberGreen: {
    fontFamily: 'Inter_800ExtraBold',
    fontWeight: '800',
    fontSize: 19,
    color: '#15803D',
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
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: '#E2E8F0',
  },

  // Mesh Active Pill Card
  meshPillCard: {
    backgroundColor: '#EDE9FE',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  meshIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  meshTextCol: {
    flex: 1,
  },
  meshTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meshTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 13.5,
    color: '#1E1B4B',
  },
  meshDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginLeft: 6,
  },
  meshSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  // Academic Affiliation Card
  academicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#1A191F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  academicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  academicHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  academicHeaderTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 11.5,
    color: '#1A191F',
    letterSpacing: 0.5,
  },
  academicDeptText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11.5,
    color: '#64748B',
  },
  academicRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  academicIconBox: {
    width: 28,
    alignItems: 'center',
    marginRight: 10,
  },
  academicInfo: {
    flex: 1,
  },
  academicLabel: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 9.5,
    color: '#64748B',
    letterSpacing: 0.5,
  },
  academicValueBold: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 14,
    color: '#1A191F',
    marginTop: 2,
  },
  academicSubText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  activePillSmall: {
    backgroundColor: '#DCFCE7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  activePillSmallText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10.5,
    color: '#15803D',
  },
  cabinBtnPill: {
    backgroundColor: '#EDE9FE',
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cabinBtnPillText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 11,
    color: '#4326B6',
  },
  synchronizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  synchronizedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16A34A',
    marginRight: 4,
  },
  synchronizedText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#15803D',
  },

  // Activity & Office Hours
  sectionHeadingText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 11,
    color: '#4B4757',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  activityItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#1A191F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  activityIconPurple: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityIconAmber: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityTitleText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 13,
    color: '#1A191F',
  },
  todayPillBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  todayPillText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: '#64748B',
  },
  tomorrowPillBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  tomorrowPillText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    color: '#B45309',
  },
  activitySubText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // Smart Sensor & Beacon Preferences
  preferencesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginTop: 8,
    marginBottom: 14,
    shadowColor: '#1A191F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  preferencesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preferencesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferencesHeaderTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 11,
    color: '#1A191F',
    letterSpacing: 0.5,
  },
  preferencesMonitoredText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 11,
    color: '#4326B6',
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prefTextCol: {
    flex: 1,
    marginRight: 12,
  },
  prefTitleText: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 13,
    color: '#1A191F',
  },
  prefSubText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },

  // Help & Support
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
  footerSecureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  footerSecureText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#64748B',
  },
  footerBuildText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
});
