import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, StatusBar } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

export default function AccessRevokedModal({ visible, onConfirm }) {
  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <StatusBar barStyle="dark-content" />
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <FontAwesome5 name="user-slash" size={30} color="#DC2626" />
          </View>

          <Text style={styles.title}>Access Revoked</Text>
          <Text style={styles.message}>
            Your student portal access has been revoked by the department administrator. Please contact your Department HOD if you believe this is an error.
          </Text>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onConfirm}
            activeOpacity={0.88}
          >
            <Ionicons name="log-out-outline" size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.actionBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 16, 68, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: '#1A191F',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actionBtn: {
    width: '100%',
    backgroundColor: '#DC2626',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
