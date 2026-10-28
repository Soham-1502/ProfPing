import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';

function NavigationRouter() {
  const { user, role, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const currentSegment = segments[0];
    const inAuthGroup = currentSegment === '(auth)';

    if (!user) {
      if (!inAuthGroup) {
        router.replace('/(auth)/onboarding');
      }
      return;
    }

    const isStaff = role === 'faculty' || role === 'hod' || role === 'principal';

    // 1. Cross-portal enforcement: Prevent students from entering faculty portal
    if (!isStaff && (currentSegment === '(faculty)' || currentSegment === '(hod)')) {
      router.replace('/(student)');
      return;
    }

    // 2. Cross-portal enforcement: Prevent faculty from entering student portal
    if (isStaff && currentSegment === '(student)') {
      router.replace('/(faculty)');
      return;
    }

    // 3. Initial login or root landing auto-redirect
    if (inAuthGroup || currentSegment === undefined || currentSegment === 'index') {
      if (isStaff) {
        router.replace('/(faculty)');
      } else {
        router.replace('/(student)');
      }
    }
  }, [user, role, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF8FE', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#492FB1" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#FAF8FE' },
        headerTintColor: '#1A191F',
        headerTitleStyle: { fontWeight: 'bold' },
        headerShown: false,
        animation: 'none',
      }}
    >
      <Stack.Screen name="(auth)/onboarding" options={{ title: 'ProfPing Onboarding', headerShown: false }} />
      <Stack.Screen name="(auth)/login" options={{ title: 'ProfPing Login', headerShown: false }} />
      <Stack.Screen name="(faculty)" options={{ headerShown: false }} />
      <Stack.Screen name="(hod)" options={{ headerShown: false }} />
      <Stack.Screen name="(student)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ title: 'ProfPing', headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Disable translucent development overlay gear icon
    try {
      const { requireOptionalNativeModule } = require('expo');
      const DevMenuPreferences = requireOptionalNativeModule('DevMenuPreferences');
      if (DevMenuPreferences?.setPreferencesAsync) {
        DevMenuPreferences.setPreferencesAsync({
          showFloatingActionButton: false,
        });
      }
    } catch (_) {}
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <NavigationRouter />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
