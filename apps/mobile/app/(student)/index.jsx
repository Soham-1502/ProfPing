import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { DEPARTMENTS } from '@profping/shared';

export default function StudentHomeScreen() {
  const { user, role, department, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header Profile */}
      <View style={styles.header}>
        <View style={styles.profileBadge}>
          <Text style={styles.profileInitial}>
            {(user?.displayName || user?.email || 'S')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileMeta}>
          <Text style={styles.name}>{user?.displayName || user?.email?.split('@')[0]}</Text>
          <Text style={styles.dept}>
            Student • {department ? `Department of ${department}` : 'Campus Directory'}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Role Banner */}
      <View style={styles.roleBanner}>
        <View style={styles.dot} />
        <Text style={styles.roleText}>
          RBAC Role Verified: STUDENT ({department || 'CMPN'})
        </Text>
      </View>

      {/* Search Bar Shell */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search faculty by name or cabin..."
          placeholderTextColor="#64748b"
          editable={false}
        />
      </View>

      {/* Department Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
        <View style={[styles.chip, styles.chipActive]}>
          <Text style={[styles.chipText, styles.chipTextActive]}>All Departments</Text>
        </View>
        {DEPARTMENTS.map((dept) => (
          <View key={dept.id} style={styles.chip}>
            <Text style={styles.chipText}>{dept.id}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Phase 4 Live Directory Preview */}
      <View style={styles.directoryCard}>
        <Text style={styles.cardTitle}>Live Faculty Directory</Text>
        <Text style={styles.cardSubtitle}>
          Real-time WebSocket subscriptions to /faculty and /status will be connected in Phase 4.
        </Text>

        <View style={styles.sampleCard}>
          <View style={styles.sampleStatusDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.sampleName}>Prof. Snehal Kulkarni</Text>
            <Text style={styles.sampleDept}>CMPN • Assistant Professor</Text>
            <Text style={styles.sampleStatus}>Available in Lab 304</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#090d16',
    minHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  profileBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  profileInitial: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  profileMeta: {
    flex: 1,
  },
  name: {
    fontSize: 16,
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
  roleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  roleText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
  },
  chipsScroll: {
    marginBottom: 20,
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
  directoryCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 16,
    lineHeight: 18,
  },
  sampleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sampleStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    marginRight: 12,
  },
  sampleName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  sampleDept: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  sampleStatus: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 4,
  },
});
