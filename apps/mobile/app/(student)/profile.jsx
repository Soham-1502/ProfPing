import React, { useState } from 'react';
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

export default function StudentProfilePage() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const { user, logout } = useAuth();
  const router = useRouter();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  // Smart Sensor & Beacon Preferences
  const [inCabinAlerts, setInCabinAlerts] = useState(true);
  const [pingResponses, setPingResponses] = useState(true);
  const [quietLectures, setQuietLectures] = useState(true);
  const [proximityPings, setProximityPings] = useState(false);

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

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() =>
              Alert.alert(
                'Edit Student Profile',
                'Name, Roll No, and Department details are synchronized with the SFIT Academic Registry.'
              )
            }
            activeOpacity={0.7}
          >
            <Ionicons name="pencil-outline" size={18} color="#1A191F" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() =>
              Alert.alert(
                'Campus Mesh Settings',
                'BLE background beacon interval: 250ms • Network protocol: SFIT-Mesh-Enterprise v2'
              )
            }
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={19} color="#1A191F" />
          </TouchableOpacity>
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
            {/* Avatar with Initials & Verified Green Check */}
            <View style={styles.avatarBox}>
              <Text style={styles.avatarInitials}>AD</Text>
              <View style={styles.onlineBadge}>
                <Ionicons name="checkmark" size={11} color="#FFFFFF" />
              </View>
            </View>

            {/* Identity Info */}
            <View style={styles.infoCol}>
              <View style={styles.nameRow}>
                <Text style={styles.fullName} numberOfLines={1}>
                  {user?.displayName || 'Aarav Des...'}
                </Text>
                <View style={styles.activeCampusIdBadge}>
                  <View style={styles.activeCampusIdDot} />
                  <Text style={styles.activeCampusIdText}>Active Campus ID</Text>
                </View>
              </View>

              <Text style={styles.degreeText}>
                B.Tech Computer Science & Engg
              </Text>
              <Text style={styles.yearText}>
                Year 3 • Semester VI
              </Text>

              <View style={styles.metaRow}>
                <Ionicons name="card-outline" size={12} color="#4326B6" style={{ marginRight: 5 }} />
                <Text style={styles.rollText}>SFIT-STU-2021-045</Text>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="mail-outline" size={12} color="#64748B" style={{ marginRight: 5 }} />
                <Text style={styles.emailText}>{user?.email || 'aarav.deshmukh@sfit.ac.in'}</Text>
              </View>
            </View>
          </View>

          {/* Horizontal Divider */}
          <View style={styles.cardDivider} />

          {/* 3 Column Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumberPurple}>6</Text>
              <Text style={styles.statLabelMuted}>STARRED FACULTY</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statNumberPurple}>24</Text>
              <Text style={styles.statLabelMuted}>PINGS SENT</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statNumberGreen}>96%</Text>
              <Text style={styles.statLabelMuted}>RESPONSE RATE</Text>
            </View>
          </View>
        </View>

        {/* 2. CAMPUS MESH ACTIVE BANNER */}
        <TouchableOpacity
          style={styles.meshPillCard}
          onPress={() =>
            Alert.alert(
              'Campus Mesh Active',
              'Auto-ping sync active in West Wing (Lab 402). 42 Faculty beacons syncing.'
            )
          }
          activeOpacity={0.88}
        >
          <View style={styles.meshIconCircle}>
            <Ionicons name="radio-outline" size={17} color="#4326B6" />
          </View>
          <View style={styles.meshTextCol}>
            <View style={styles.meshTitleRow}>
              <Text style={styles.meshTitle}>Campus Mesh Active</Text>
              <View style={styles.meshDot} />
            </View>
            <Text style={styles.meshSubtitle}>
              Auto-ping sync ready in West Wing (Lab 402)
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#64748B" />
        </TouchableOpacity>

        {/* 3. ACADEMIC AFFILIATION CARD */}
        <View style={styles.academicCard}>
          <View style={styles.academicHeader}>
            <View style={styles.academicHeaderLeft}>
              <FontAwesome5 name="graduation-cap" size={12} color="#4326B6" style={{ marginRight: 6 }} />
              <Text style={styles.academicHeaderTitle}>ACADEMIC AFFILIATION</Text>
            </View>
            <Text style={styles.academicDeptText}>Dept. of ECS</Text>
          </View>

          <View style={styles.cardDivider} />

          {/* Row 1: Roll No */}
          <View style={styles.academicRow}>
            <View style={styles.academicIconBox}>
              <FontAwesome5 name="hashtag" size={13} color="#64748B" />
            </View>
            <View style={styles.academicInfo}>
              <Text style={styles.academicLabel}>ENROLLMENT / ROLL NO</Text>
              <Text style={styles.academicValueBold}>2021-ECS-045</Text>
            </View>
            <View style={styles.activePillSmall}>
              <Text style={styles.activePillSmallText}>Active</Text>
            </View>
          </View>

          <View style={styles.cardDivider} />

          {/* Row 2: Assigned Faculty Mentor */}
          <View style={styles.academicRow}>
            <View style={styles.academicIconBox}>
              <FontAwesome5 name="user-tie" size={13} color="#4326B6" />
            </View>
            <View style={styles.academicInfo}>
              <Text style={styles.academicLabel}>ASSIGNED FACULTY MENTOR</Text>
              <Text style={styles.academicValueBold}>Dr. Anjali Mehta</Text>
              <Text style={styles.academicSubText}>Associate Professor, ECS</Text>
            </View>
            <TouchableOpacity
              style={styles.cabinBtnPill}
              onPress={() => router.replace('/(student)/maps')}
              activeOpacity={0.8}
            >
              <Text style={styles.cabinBtnPillText}>Cabin 304 </Text>
              <FontAwesome5 name="arrow-right" size={9} color="#4326B6" />
            </TouchableOpacity>
          </View>

          <View style={styles.cardDivider} />

          {/* Row 3: Division & Batch */}
          <View style={styles.academicRow}>
            <View style={styles.academicIconBox}>
              <FontAwesome5 name="users" size={13} color="#64748B" />
            </View>
            <View style={styles.academicInfo}>
              <Text style={styles.academicLabel}>DIVISION & PRACTICAL BATCH</Text>
              <Text style={styles.academicValueBold}>Div B • Batch B2 (Semester VI)</Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  'Batch Information',
                  'Division B, Practical Lab Batch B2. Regular Lab Timing: 10:15 AM - 12:15 PM.'
                )
              }
            >
              <Ionicons name="information-circle-outline" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <View style={styles.cardDivider} />

          {/* Row 4: Library RFID Tag */}
          <View style={styles.academicRow}>
            <View style={styles.academicIconBox}>
              <MaterialCommunityIcons name="contactless-payment" size={17} color="#64748B" />
            </View>
            <View style={styles.academicInfo}>
              <Text style={styles.academicLabel}>LIBRARY RFID SENSOR TAG</Text>
              <Text style={styles.academicValueBold}>RFID-9042-SFIT</Text>
            </View>
            <View style={styles.synchronizedBadge}>
              <View style={styles.synchronizedDot} />
              <Text style={styles.synchronizedText}>Synchronized</Text>
            </View>
          </View>
        </View>

        {/* 4. ACTIVITY & UPCOMING OFFICE HOURS */}
        <Text style={styles.sectionHeadingText}>
          ACTIVITY & UPCOMING OFFICE HOURS
        </Text>

        {/* Activity Card 1 */}
        <TouchableOpacity
          style={styles.activityItemCard}
          onPress={() =>
            Alert.alert(
              'Recent Ping Details',
              'Ping sent to Prof. V. Kulkarni at 11:48 AM.\nStatus: Acknowledged • Faculty free after 12:30 PM.'
            )
          }
          activeOpacity={0.85}
        >
          <View style={styles.activityIconPurple}>
            <Ionicons name="time-outline" size={18} color="#7E22CE" />
          </View>
          <View style={styles.activityInfo}>
            <View style={styles.activityTitleRow}>
              <Text style={styles.activityTitleText}>Recent Ping: Prof. V. Kulkarni</Text>
              <View style={styles.todayPillBadge}>
                <Text style={styles.todayPillText}>3 Today</Text>
              </View>
            </View>
            <Text style={styles.activitySubText}>
              Dispatched 12m ago • Status: Acknowledged
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
        </TouchableOpacity>

        {/* Activity Card 2 */}
        <TouchableOpacity
          style={styles.activityItemCard}
          onPress={() =>
            Alert.alert(
              'Scheduled Project Review',
              'Project Review with Dr. Anjali Mehta is confirmed for tomorrow, 2:30 PM – 3:00 PM at Cabin 304.'
            )
          }
          activeOpacity={0.85}
        >
          <View style={styles.activityIconAmber}>
            <Ionicons name="calendar-outline" size={17} color="#D97706" />
          </View>
          <View style={styles.activityInfo}>
            <View style={styles.activityTitleRow}>
              <Text style={styles.activityTitleText}>Project Review: Dr. Mehta</Text>
              <View style={styles.tomorrowPillBadge}>
                <Text style={styles.tomorrowPillText}>Tomorrow</Text>
              </View>
            </View>
            <Text style={styles.activitySubText}>
              2:30 PM – 3:00 PM • Cabin 304
            </Text>
          </View>
          <Ionicons name="alarm-outline" size={18} color="#4326B6" />
        </TouchableOpacity>

        {/* 5. SMART SENSOR & BEACON PREFERENCES */}
        <View style={styles.preferencesCard}>
          <View style={styles.preferencesHeader}>
            <View style={styles.preferencesHeaderLeft}>
              <Ionicons name="notifications-outline" size={14} color="#4326B6" style={{ marginRight: 6 }} />
              <Text style={styles.preferencesHeaderTitle}>
                SMART SENSOR & BEACON PREFERENCES
              </Text>
            </View>
            <Text style={styles.preferencesMonitoredText}>4 Monitored</Text>
          </View>

          <View style={styles.cardDivider} />

          {/* Preference 1 */}
          <View style={styles.prefRow}>
            <View style={styles.prefTextCol}>
              <Text style={styles.prefTitleText}>Faculty In-Cabin Alerts</Text>
              <Text style={styles.prefSubText}>
                Notify instantly when starred faculty tap into desk sensor
              </Text>
            </View>
            <Switch
              value={inCabinAlerts}
              onValueChange={setInCabinAlerts}
              trackColor={{ false: '#E2E8F0', true: '#4326B6' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.cardDivider} />

          {/* Preference 2 */}
          <View style={styles.prefRow}>
            <View style={styles.prefTextCol}>
              <Text style={styles.prefTitleText}>Ping Response Notifications</Text>
              <Text style={styles.prefSubText}>
                Sound & haptic chime immediately upon faculty reply
              </Text>
            </View>
            <Switch
              value={pingResponses}
              onValueChange={setPingResponses}
              trackColor={{ false: '#E2E8F0', true: '#4326B6' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.cardDivider} />

          {/* Preference 3 */}
          <View style={styles.prefRow}>
            <View style={styles.prefTextCol}>
              <Text style={styles.prefTitleText}>Quiet During Lectures</Text>
              <Text style={styles.prefSubText}>
                Mute audible pings during enrolled timetable lectures
              </Text>
            </View>
            <Switch
              value={quietLectures}
              onValueChange={setQuietLectures}
              trackColor={{ false: '#E2E8F0', true: '#4326B6' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.cardDivider} />

          {/* Preference 4 */}
          <View style={styles.prefRow}>
            <View style={styles.prefTextCol}>
              <Text style={styles.prefTitleText}>Proximity Pings (10m Beacon)</Text>
              <Text style={styles.prefSubText}>
                Alert when passing within 10 meters of mentor's cabin
              </Text>
            </View>
            <Switch
              value={proximityPings}
              onValueChange={setProximityPings}
              trackColor={{ false: '#E2E8F0', true: '#4326B6' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* 6. CAMPUS IT HELP CENTER & MESH SUPPORT */}
        <TouchableOpacity
          style={styles.supportCard}
          onPress={() =>
            Alert.alert(
              'Campus IT Help Center',
              'SFIT Academic Mesh & IT Support:\nEmail: it-support@sfit.ac.in\nExtension: 2404 / Academic Wing B'
            )
          }
          activeOpacity={0.85}
        >
          <Ionicons name="help-circle-outline" size={19} color="#334155" style={{ marginRight: 10 }} />
          <Text style={styles.supportText}>Campus IT Help Center & Mesh Support</Text>
          <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
        </TouchableOpacity>

        {/* 7. LOG OUT BUTTON */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => setLogoutModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={18} color="#DC2626" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Log Out of SFIT Campus Mesh</Text>
        </TouchableOpacity>

        {/* 8. FOOTER METADATA */}
        <View style={styles.footerBlock}>
          <View style={styles.footerSecureRow}>
            <Ionicons name="shield-checkmark-outline" size={12} color="#64748B" style={{ marginRight: 4 }} />
            <Text style={styles.footerSecureText}>SFIT Secure Mesh • WPA3-Enterprise</Text>
          </View>
          <Text style={styles.footerBuildText}>PROF-PING Student v2.4.1 (Build 198)</Text>
        </View>

        <View style={{ height: 110 }} />
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
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 4,
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
