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

    const inAuthGroup = segments[0] === '(auth)';

    if (!user) {
      if (!inAuthGroup) {
        router.replace('/(auth)/login');
      }
    } else {
      if (inAuthGroup || segments[0] === undefined) {
        if (role === 'faculty') {
          router.replace('/(faculty)');
        } else {
          router.replace('/(student)');
        }
      }
    }
  }, [user, role, loading, segments, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#090d16', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0f172a' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="(auth)/login" options={{ title: 'ProfPing Login', headerShown: false }} />
      <Stack.Screen name="(faculty)/index" options={{ title: 'Faculty Broadcast', headerShown: false }} />
      <Stack.Screen name="(student)/index" options={{ title: 'Faculty Directory', headerShown: false }} />
      <Stack.Screen name="index" options={{ title: 'ProfPing', headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <NavigationRouter />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
