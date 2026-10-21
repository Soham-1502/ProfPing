import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { STATUS_CONFIG, STATUS_KEYS } from '@profping/shared';

export default function FacultyHomeScreen() {
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
            {(user?.displayName || user?.email || 'F')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileMeta}>
          <Text style={styles.name}>{user?.displayName || user?.email?.split('@')[0]}</Text>
          <Text style={styles.dept}>
            Faculty • Department of {department || 'Engineering'}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Role Verification Banner */}
      <View style={styles.roleBanner}>
        <View style={styles.dot} />
        <Text style={styles.roleText}>
          RBAC Role Verified: FACULTY ({department || 'CMPN'})
        </Text>
      </View>

      {/* Phase 3 Status Buttons Preview */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>One-Tap Availability Broadcast</Text>
        <Text style={styles.cardSubtitle}>
          Tap any status below to immediately sync your availability to students and dashboards:
        </Text>

        <View style={styles.statusGrid}>
          {Object.values(STATUS_CONFIG).map((cfg) => (
            <View
              key={cfg.key}
              style={[
                styles.statusButton,
                { borderColor: cfg.borderColor, backgroundColor: cfg.bgColor },
              ]}
            >
              <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusLabel}>{cfg.label}</Text>
                <Text style={styles.statusDesc}>{cfg.defaultMessage}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.nextPhaseNote}>
          <Text style={styles.noteText}>
            ⚡ Atomic multi-path writes to /status and /logs will be activated in Phase 3.
          </Text>
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
    backgroundColor: '#2563eb',
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
  card: {
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
  },
  statusGrid: {
    gap: 12,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusDesc: {
    fontSize: 12,
    color: '#334155',
    marginTop: 2,
  },
  nextPhaseNote: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  noteText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});
