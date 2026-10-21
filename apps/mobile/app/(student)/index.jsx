import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { STATUS_CONFIG, STATUS_KEYS, DEPARTMENTS } from '@profping/shared';
import { subscribeToLiveDirectory } from '../../src/services/directoryService';

export default function StudentHomeScreen() {
  const { user, role, department, logout } = useAuth();
  const router = useRouter();

  const [facultyList, setFacultyList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedFaculty, setSelectedFaculty] = useState(null);

  // Subscribe to live directory
  useEffect(() => {
    const unsubscribe = subscribeToLiveDirectory((list) => {
      setFacultyList(list || []);
    });
    return () => unsubscribe();
  }, []);

  // Filtered faculty list
  const filteredList = useMemo(() => {
    return facultyList.filter((item) => {
      // 1. Department filter
      if (selectedDept !== 'ALL' && item.department !== selectedDept) {
        return false;
      }
      // 2. Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const nameMatch = (item.name || '').toLowerCase().includes(q);
      const desigMatch = (item.designation || '').toLowerCase().includes(q);
      const msgMatch = (item.status?.message || '').toLowerCase().includes(q);
      const deptMatch = (item.department || '').toLowerCase().includes(q);
      return nameMatch || desigMatch || msgMatch || deptMatch;
    });
  }, [facultyList, selectedDept, searchQuery]);

  // Aggregate status metrics
  const statusCounts = useMemo(() => {
    const counts = {
      [STATUS_KEYS.AVAILABLE]: 0,
      [STATUS_KEYS.IN_LECTURE]: 0,
      [STATUS_KEYS.BUSY]: 0,
      [STATUS_KEYS.OFF_CAMPUS]: 0,
    };
    filteredList.forEach((fac) => {
      const state = fac.status?.state;
      if (counts[state] !== undefined) counts[state]++;
    });
    return counts;
  }, [filteredList]);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const getRelativeTime = (timestamp) => {
    if (!timestamp) return 'Recently';
    const diffMin = Math.floor((Date.now() - timestamp) / 60000);
    if (diffMin <= 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours}h ago`;
  };

  return (
    <View style={styles.screen}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.profileBadge}>
          <Text style={styles.profileInitial}>
            {(user?.displayName || user?.email || 'S')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileMeta}>
          <Text style={styles.name}>{user?.displayName || user?.email?.split('@')[0]}</Text>
          <Text style={styles.dept}>
            Student Directory • {department ? `${department}` : 'All Departments'}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Search Input Bar */}
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by faculty name, cabin, subject..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Department Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          <TouchableOpacity
            onPress={() => setSelectedDept('ALL')}
            style={[styles.chip, selectedDept === 'ALL' && styles.chipActive]}
          >
            <Text style={[styles.chipText, selectedDept === 'ALL' && styles.chipTextActive]}>
              All Departments ({facultyList.length})
            </Text>
          </TouchableOpacity>
          {DEPARTMENTS.map((d) => (
            <TouchableOpacity
              key={d.id}
              onPress={() => setSelectedDept(d.id)}
              style={[styles.chip, selectedDept === d.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedDept === d.id && styles.chipTextActive]}>
                {d.id}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Live Counts Bar */}
        <View style={styles.metricsBar}>
          <View style={styles.metricItem}>
            <View style={[styles.metricDot, { backgroundColor: STATUS_CONFIG[STATUS_KEYS.AVAILABLE].color }]} />
            <Text style={styles.metricText}>
              <Text style={{ fontWeight: '700', color: '#ffffff' }}>{statusCounts[STATUS_KEYS.AVAILABLE]}</Text> Avail
            </Text>
          </View>
          <View style={styles.metricItem}>
            <View style={[styles.metricDot, { backgroundColor: STATUS_CONFIG[STATUS_KEYS.IN_LECTURE].color }]} />
            <Text style={styles.metricText}>
              <Text style={{ fontWeight: '700', color: '#ffffff' }}>{statusCounts[STATUS_KEYS.IN_LECTURE]}</Text> Lecture
            </Text>
          </View>
          <View style={styles.metricItem}>
            <View style={[styles.metricDot, { backgroundColor: STATUS_CONFIG[STATUS_KEYS.BUSY].color }]} />
            <Text style={styles.metricText}>
              <Text style={{ fontWeight: '700', color: '#ffffff' }}>{statusCounts[STATUS_KEYS.BUSY]}</Text> Busy
            </Text>
          </View>
          <View style={styles.metricItem}>
            <View style={[styles.metricDot, { backgroundColor: STATUS_CONFIG[STATUS_KEYS.OFF_CAMPUS].color }]} />
            <Text style={styles.metricText}>
              <Text style={{ fontWeight: '700', color: '#ffffff' }}>{statusCounts[STATUS_KEYS.OFF_CAMPUS]}</Text> Off
            </Text>
          </View>
        </View>

        {/* Faculty Cards List */}
        {filteredList.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Faculty Found</Text>
            <Text style={styles.emptyDesc}>
              No faculty members match your query "{searchQuery}" in {selectedDept}.
            </Text>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={() => {
                setSearchQuery('');
                setSelectedDept('ALL');
              }}
            >
              <Text style={styles.resetText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardsGrid}>
            {filteredList.map((faculty) => {
              const cfg = STATUS_CONFIG[faculty.status?.state] || STATUS_CONFIG[STATUS_KEYS.AVAILABLE];
              return (
                <TouchableOpacity
                  key={faculty.uid}
                  style={[styles.facultyCard, { borderColor: `${cfg.borderColor}40` }]}
                  onPress={() => setSelectedFaculty(faculty)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.facultyMeta}>
                      <Text style={styles.facultyName}>{faculty.name}</Text>
                      <Text style={styles.facultyDesig}>
                        {faculty.department} • {faculty.designation}
                      </Text>
                    </View>

                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: `${cfg.color}20`, borderColor: cfg.color }]}>
                      <View style={[styles.statusBadgeDot, { backgroundColor: cfg.color }]} />
                      <Text style={[styles.statusBadgeText, { color: cfg.color }]}>
                        {cfg.label}
                      </Text>
                    </View>
                  </View>

                  {/* Broadcast Message */}
                  <View style={styles.messageBox}>
                    <Text style={styles.messageText}>
                      "{faculty.status?.message || cfg.defaultMessage}"
                    </Text>
                    <Text style={styles.timeAgo}>
                      {getRelativeTime(faculty.status?.updatedAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Faculty Detail Modal */}
      {selectedFaculty && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedFaculty(null)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{selectedFaculty.name}</Text>
                  <Text style={styles.modalSubtitle}>
                    {selectedFaculty.department} • {selectedFaculty.designation}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedFaculty(null)} style={styles.modalCloseBtn}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={[
                  styles.modalStatusBox,
                  { backgroundColor: `${STATUS_CONFIG[selectedFaculty.status?.state]?.color}15`, borderColor: STATUS_CONFIG[selectedFaculty.status?.state]?.borderColor }
                ]}>
                  <Text style={[styles.modalStatusLabel, { color: STATUS_CONFIG[selectedFaculty.status?.state]?.color }]}>
                    ● {STATUS_CONFIG[selectedFaculty.status?.state]?.label}
                  </Text>
                  <Text style={styles.modalStatusMsg}>
                    "{selectedFaculty.status?.message}"
                  </Text>
                  <Text style={styles.modalTime}>
                    Last updated: {new Date(selectedFaculty.status?.updatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                <View style={styles.modalMetaRow}>
                  <Text style={styles.modalMetaLabel}>Email:</Text>
                  <Text style={styles.modalMetaValue}>{selectedFaculty.email}</Text>
                </View>
                <View style={styles.modalMetaRow}>
                  <Text style={styles.modalMetaLabel}>Department:</Text>
                  <Text style={styles.modalMetaValue}>{selectedFaculty.department}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.modalActionBtn}
                onPress={() => setSelectedFaculty(null)}
              >
                <Text style={styles.modalActionText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  profileBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileInitial: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  profileMeta: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  dept: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  logoutText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  container: {
    padding: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
  },
  clearBtn: {
    padding: 6,
  },
  clearText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  chipsScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  chip: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  metricsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 18,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metricText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  cardsGrid: {
    gap: 12,
  },
  facultyCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  facultyMeta: {
    flex: 1,
    marginRight: 10,
  },
  facultyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  facultyDesig: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  messageBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageText: {
    fontSize: 13,
    color: '#cbd5e1',
    flex: 1,
    fontStyle: 'italic',
  },
  timeAgo: {
    fontSize: 11,
    color: '#64748b',
    marginLeft: 8,
  },
  emptyState: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
  },
  resetBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  resetText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    color: '#94a3b8',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    marginBottom: 20,
  },
  modalStatusBox: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    marginBottom: 16,
  },
  modalStatusLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalStatusMsg: {
    fontSize: 14,
    color: '#ffffff',
    fontStyle: 'italic',
    marginBottom: 6,
  },
  modalTime: {
    fontSize: 11,
    color: '#94a3b8',
  },
  modalMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalMetaLabel: {
    color: '#94a3b8',
    fontSize: 13,
  },
  modalMetaValue: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
  modalActionBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalActionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
