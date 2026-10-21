import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { STATUS_CONFIG, STATUS_KEYS, ROLES } from '@profping/shared';

export default function MobileHomeScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ProfPing Mobile</Text>
        <Text style={styles.subtitle}>Faculty Availability & Live Telemetry</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status Indicators</Text>
        <View style={styles.statusGrid}>
          {Object.values(STATUS_CONFIG).map((cfg) => (
            <View key={cfg.key} style={[styles.statusCard, { borderColor: cfg.borderColor, backgroundColor: cfg.bgColor }]}>
              <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>{cfg.label}</Text>
                <Text style={styles.statusDesc}>{cfg.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Connected to Shared System | Roles: {Object.values(ROLES).join(', ')}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8fafc',
    minHeight: '100%',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusGrid: {
    gap: 12,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusDesc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  footer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
