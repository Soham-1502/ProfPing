import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot, usePathname } from 'expo-router';
import FacultyNavbar from '../../src/components/FacultyNavbar';
import { FacultyProvider } from '../../src/context/FacultyContext';

export default function FacultyLayout() {
  const pathname = usePathname();

  // Determine active tab based on route pathname
  let activeTab = 'home';
  if (pathname.includes('/history')) {
    activeTab = 'history';
  } else if (pathname.includes('/profile')) {
    activeTab = 'profile';
  }

  return (
    <FacultyProvider>
      <View style={styles.container}>
        <View style={styles.content}>
          <Slot />
        </View>
        <FacultyNavbar activeTab={activeTab} />
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
