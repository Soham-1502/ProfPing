import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Slot, usePathname, useGlobalSearchParams } from 'expo-router';
import FloatingNavbar from '../../src/components/FloatingNavbar';

export default function StudentLayout() {
  const pathname = usePathname();
  const params = useGlobalSearchParams();

  // Determine active tab based on route pathname
  let activeTab = 'home';
  if (pathname.includes('/maps')) {
    activeTab = 'maps';
  } else if (pathname.includes('/favorites')) {
    activeTab = 'favorites';
  } else if (pathname.includes('/profile')) {
    activeTab = 'profile';
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Slot />
      </View>
      <FloatingNavbar activeTab={activeTab} />
    </View>
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
