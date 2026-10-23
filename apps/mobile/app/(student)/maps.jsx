import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
  Platform,
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
import FloatingNavbar from '../../src/components/FloatingNavbar';

export default function StudentMapsPage() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const router = useRouter();
  const [selectedFloor, setSelectedFloor] = useState('Floor 3');
  const [selectedRoom, setSelectedRoom] = useState('DESK 01');

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingRoot}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF8FE" />
      </View>
    );
  }

  const floors = ['Floor 1', 'Floor 2', 'Floor 3', 'Floor 4'];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8FE" />

      {/* ── TOP HEADER BAR ─────────────────────────────────────────── */}
      <View style={styles.topHeader}>

        <View style={styles.titleBlock}>
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>CAMPUS NAVIGATION</Text>
          </View>
          <Text style={styles.screenTitle}>Interactive Floor Maps</Text>
        </View>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() =>
            Alert.alert(
              'BLE Mesh Calibrated',
              'Beacon Node B3-01 is online and actively tracking faculty cabin beacons with 0.8s accuracy.'
            )
          }
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={19} color="#1A191F" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── FLOOR SELECTOR CHIPS ─────────────────────────────────── */}
        <View style={styles.floorSelectorRow}>
          {floors.map((floor) => {
            const isSelected = selectedFloor === floor;
            return (
              <TouchableOpacity
                key={floor}
                style={[
                  styles.floorChip,
                  isSelected && styles.floorChipActive,
                ]}
                onPress={() => setSelectedFloor(floor)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.floorChipText,
                    isSelected && styles.floorChipTextActive,
                  ]}
                >
                  {floor}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── LOCATION BANNER ──────────────────────────────────────── */}
        <View style={styles.locationBanner}>
          <View style={styles.locationBannerLeft}>
            <MaterialCommunityIcons name="office-building" size={17} color="#4326B6" />
            <Text style={styles.locationBannerTitle}>Academic Wing B • {selectedFloor}</Text>
          </View>
          <View style={styles.liveSensorBadge}>
            <View style={styles.liveSensorDot} />
            <Text style={styles.liveSensorText}>Mesh Live</Text>
          </View>
        </View>

        {/* ── INTERACTIVE MAP CONTAINER ────────────────────────────── */}
        <View style={styles.mapGraphicCard}>
          {/* Corridor Beacon Indicator */}
          <View style={styles.mapCorridor}>
            <FontAwesome5 name="broadcast-tower" size={11} color="#4326B6" style={{ marginRight: 6 }} />
            <Text style={styles.mapCorridorText}>
              NORTH CORRIDOR • BLE BEACON B3-01 (ACTIVE)
            </Text>
          </View>

          {/* Cabin Desks Layout (Row 1) */}
          <Text style={styles.subGridHeader}>HALL NO. 301 — ECS FACULTY CABINS</Text>
          <View style={styles.mapGridRow}>
            {/* DESK 01 */}
            <TouchableOpacity
              style={[
                styles.mapRoomBox,
                selectedRoom === 'DESK 01' && styles.mapRoomActive,
              ]}
              onPress={() => setSelectedRoom('DESK 01')}
              activeOpacity={0.8}
            >
              <Text style={styles.mapDeskNum}>DESK 01</Text>
              <Text style={styles.mapProfName}>Dr. Anjali Mehta</Text>
              <View style={styles.mapStatusPillGreen}>
                <Text style={styles.mapStatusPillTextGreen}>✔ In Cabin</Text>
              </View>
            </TouchableOpacity>

            {/* DESK 02 */}
            <TouchableOpacity
              style={[
                styles.mapRoomBox,
                selectedRoom === 'DESK 02' && styles.mapRoomActive,
              ]}
              onPress={() => setSelectedRoom('DESK 02')}
              activeOpacity={0.8}
            >
              <Text style={styles.mapDeskNum}>DESK 02</Text>
              <Text style={styles.mapProfName}>Mr. Arjun Kulkarni</Text>
              <View style={styles.mapStatusPillAmber}>
                <Text style={styles.mapStatusPillTextAmber}>⏳ Viva Duty</Text>
              </View>
            </TouchableOpacity>

            {/* DESK 03 */}
            <TouchableOpacity
              style={[
                styles.mapRoomBox,
                selectedRoom === 'DESK 03' && styles.mapRoomActive,
              ]}
              onPress={() => setSelectedRoom('DESK 03')}
              activeOpacity={0.8}
            >
              <Text style={styles.mapDeskNum}>DESK 03</Text>
              <Text style={styles.mapProfName}>Prof. Rohan Patil</Text>
              <View style={styles.mapStatusPillBlue}>
                <Text style={styles.mapStatusPillTextBlue}>📖 Room 302</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Cabin Desks Layout (Row 2) */}
          <Text style={[styles.subGridHeader, { marginTop: 14 }]}>
            ADJACENT LABS & LECTURE ROOMS
          </Text>
          <View style={styles.mapGridRow}>
            {/* LAB 304 */}
            <TouchableOpacity
              style={[
                styles.mapRoomBox,
                selectedRoom === 'LAB 304' && styles.mapRoomActive,
              ]}
              onPress={() => setSelectedRoom('LAB 304')}
              activeOpacity={0.8}
            >
              <Text style={styles.mapDeskNum}>LAB 304</Text>
              <Text style={styles.mapProfName}>Prof. Snehal K.</Text>
              <View style={styles.mapStatusPillGreen}>
                <Text style={styles.mapStatusPillTextGreen}>✔ In Lab</Text>
              </View>
            </TouchableOpacity>

            {/* ROOM 302 */}
            <TouchableOpacity
              style={[
                styles.mapRoomBox,
                selectedRoom === 'ROOM 302' && styles.mapRoomActive,
              ]}
              onPress={() => setSelectedRoom('ROOM 302')}
              activeOpacity={0.8}
            >
              <Text style={styles.mapDeskNum}>ROOM 302</Text>
              <Text style={styles.mapProfName}>CS304 Lecture</Text>
              <View style={styles.mapStatusPillBlue}>
                <Text style={styles.mapStatusPillTextBlue}>In Session</Text>
              </View>
            </TouchableOpacity>

            {/* ROBOTICS LAB */}
            <TouchableOpacity
              style={[
                styles.mapRoomBox,
                selectedRoom === 'ROBOTICS' && styles.mapRoomActive,
              ]}
              onPress={() => setSelectedRoom('ROBOTICS')}
              activeOpacity={0.8}
            >
              <Text style={styles.mapDeskNum}>ROOM 402</Text>
              <Text style={styles.mapProfName}>Dr. Sunita Sharma</Text>
              <View style={styles.mapStatusPillBlue}>
                <Text style={styles.mapStatusPillTextBlue}>Robotics Lab</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Legend Row */}
          <View style={styles.mapLegendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#16A34A' }]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>Busy (DND)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#2563EB' }]} />
              <Text style={styles.legendText}>In Lecture</Text>
            </View>
          </View>
        </View>

        {/* ── SELECTED DESK ACTION CARD ────────────────────────────── */}
        <View style={styles.selectedActionCard}>
          <View style={styles.selectedActionTop}>
            <View style={styles.selectedActionIconBox}>
              <Ionicons name="location" size={18} color="#4326B6" />
            </View>
            <View style={styles.selectedActionInfo}>
              <Text style={styles.selectedActionTitle}>
                {selectedRoom === 'DESK 01'
                  ? 'Dr. Anjali Mehta • Desk 01'
                  : selectedRoom === 'DESK 02'
                  ? 'Mr. Arjun Kulkarni • Desk 02'
                  : selectedRoom === 'DESK 03'
                  ? 'Prof. Rohan Patil • Desk 03'
                  : `${selectedRoom} Selected`}
              </Text>
              <Text style={styles.selectedActionSub}>
                Hall No. 301, 3rd Floor Academic Wing B
              </Text>
            </View>
          </View>

        </View>

        {/* ── QUICK CAMPUS MESH NAVIGATION HELP ────────────────────── */}
        <View style={styles.meshHelpCard}>
          <Ionicons name="information-circle-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
          <Text style={styles.meshHelpText}>
            BLE Beacon anchors transmit indoor positioning with sub-meter accuracy within Academic Wing B.
          </Text>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>
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
  actionBtn: {
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

  // Floor selector
  floorSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  floorChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    paddingVertical: 9,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  floorChipActive: {
    backgroundColor: '#4326B6',
    borderColor: '#4326B6',
  },
  floorChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#475569',
  },
  floorChipTextActive: {
    color: '#FFFFFF',
  },

  // Location banner
  locationBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  locationBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationBannerTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 13,
    color: '#1E1B4B',
  },
  liveSensorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveSensorDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16A34A',
    marginRight: 4,
  },
  liveSensorText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10.5,
    color: '#15803D',
  },

  // Map card
  mapGraphicCard: {
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
  mapCorridor: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  mapCorridorText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 10,
    color: '#4326B6',
    letterSpacing: 0.6,
  },
  subGridHeader: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 10,
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  mapGridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  mapRoomBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    alignItems: 'center',
  },
  mapRoomActive: {
    backgroundColor: '#F5F3FF',
    borderColor: '#4326B6',
    borderWidth: 1.5,
  },
  mapDeskNum: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9.5,
    color: '#64748B',
    marginBottom: 3,
  },
  mapProfName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11.5,
    color: '#1A191F',
    textAlign: 'center',
    marginBottom: 6,
  },
  mapStatusPillGreen: {
    backgroundColor: '#DCFCE7',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  mapStatusPillTextGreen: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#15803D',
  },
  mapStatusPillAmber: {
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  mapStatusPillTextAmber: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#B45309',
  },
  mapStatusPillBlue: {
    backgroundColor: '#DBEAFE',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  mapStatusPillTextBlue: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  mapLegendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 14,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  legendText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#64748B',
  },

  // Selected Action Card
  selectedActionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 12,
    shadowColor: '#1A191F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  selectedActionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedActionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedActionInfo: {
    flex: 1,
  },
  selectedActionTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 14,
    color: '#1A191F',
  },
  selectedActionSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  pingFromMapBtn: {
    backgroundColor: '#4326B6',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingFromMapBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },

  // Mesh help
  meshHelpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  meshHelpText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: '#64748B',
    flex: 1,
    lineHeight: 16,
  },
});
