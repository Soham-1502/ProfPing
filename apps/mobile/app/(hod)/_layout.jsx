import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import FacultyNavbar from '../../src/components/FacultyNavbar';
import { FacultyProvider } from '../../src/context/FacultyContext';

export default function HodLayout() {
  return (
    <FacultyProvider>
      <View style={styles.container}>
        <View style={styles.content}>
          <Slot />
        </View>
        <FacultyNavbar activeTab="department" />
      </View>
    </FacultyProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8FE',
    position: 'relative',
  },
  content: {
    flex: 1,
  },
});
