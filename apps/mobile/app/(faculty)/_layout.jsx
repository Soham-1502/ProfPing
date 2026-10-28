import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import FacultyNavbar from '../../src/components/FacultyNavbar';
import { FacultyProvider } from '../../src/context/FacultyContext';
import { useAuth } from '../../src/context/AuthContext';

export default function FacultyLayout() {
  const { role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && role === 'student') {
      router.replace('/(student)');
    }
  }, [role, loading, router]);

  if (loading || role === 'student') {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF8FE', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#492FB1" />
      </View>
    );
  }

  // Determine active tab based on route pathname
  let activeTab = 'home';
  if (pathname.includes('/history')) {
    activeTab = 'history';
  } else if (pathname.includes('/department')) {
    activeTab = 'department';
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
