import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, StatusBar } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

const DEPARTMENTS = [
  { id: 'CMPN', name: 'Computer Engineering', icon: 'laptop-code', code: 'CMPN' },
  { id: 'INFT', name: 'Information Technology', icon: 'server', code: 'INFT' },
  { id: 'EXTC', name: 'Electronics & Telecom', icon: 'broadcast-tower', code: 'EXTC' },
  { id: 'ECS', name: 'Electronics & Computer Sci', icon: 'microchip', code: 'ECS' },
];

export default function DepartmentChooserModal({ visible, onSelectDepartment }) {
  const [selected, setSelected] = useState('CMPN');

  if (!visible) return null;

  const handleConfirm = () => {
    if (selected && onSelectDepartment) {
      onSelectDepartment(selected);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <StatusBar barStyle="dark-content" />
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Ionicons name="school" size={30} color="#4326B6" />
          </View>

          <Text style={styles.title}>Select Your Department</Text>
          <Text style={styles.subtitle}>
            Please select your enrolled engineering department. You can change this later from your Profile.
          </Text>

          <View style={styles.deptList}>
            {DEPARTMENTS.map((dept) => {
              const isSelected = selected === dept.id;
              return (
                <TouchableOpacity
                  key={dept.id}
                  style={[
                    styles.deptOption,
                    isSelected && styles.deptOptionActive,
                  ]}
                  onPress={() => setSelected(dept.id)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.deptIconBox, isSelected && styles.deptIconBoxActive]}>
                    <FontAwesome5
                      name={dept.icon}
                      size={15}
                      color={isSelected ? '#FFFFFF' : '#4326B6'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.deptCode, isSelected && styles.deptCodeActive]}>
                      {dept.code}
                    </Text>
                    <Text style={styles.deptName}>{dept.name}</Text>
                  </View>
                  <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                    {isSelected && <View style={styles.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleConfirm}
            activeOpacity={0.88}
          >
            <Text style={styles.confirmBtnText}>Continue to Campus Directory</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
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
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FAF8FE',
    borderWidth: 1,
    borderColor: '#E9E7F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 19,
    color: '#1A191F',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  deptList: {
    width: '100%',
    gap: 10,
    marginBottom: 22,
  },
  deptOption: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FAF8FE',
    borderWidth: 1.5,
    borderColor: '#E9E7F1',
  },
  deptOptionActive: {
    backgroundColor: '#FAF8FE',
    borderColor: '#4326B6',
  },
  deptIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ECEAEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deptIconBoxActive: {
    backgroundColor: '#4326B6',
  },
  deptCode: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#1A191F',
  },
  deptCodeActive: {
    color: '#4326B6',
  },
  deptName: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11.5,
    color: '#777585',
    marginTop: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#C8C5D3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: '#4326B6',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4326B6',
  },
  confirmBtn: {
    width: '100%',
    backgroundColor: '#4326B6',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
