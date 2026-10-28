import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import FloatingNavbar from '../../src/components/FloatingNavbar';
import AccessRevokedModal from '../../src/components/AccessRevokedModal';
import DepartmentChooserModal from '../../src/components/DepartmentChooserModal';
import { useAuth } from '../../src/context/AuthContext';

export default function StudentLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, loading, accessRevoked, dismissRevocationAndLogout, needsDepartmentSelection, declareStudentDepartment } = useAuth();

  useEffect(() => {
    if (!loading && (role === 'faculty' || role === 'hod' || role === 'principal')) {
      router.replace('/(faculty)');
    }
  }, [role, loading, router]);

  if (loading || role === 'faculty' || role === 'hod' || role === 'principal') {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF8FE', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#492FB1" />
      </View>
    );
  }

  // Determine active tab based on route pathname
  let activeTab = 'home';
  if (pathname.includes('/maps')) {
    activeTab = 'maps';
  } else if (pathname.includes('/favorites')) {
    activeTab = 'favorites';
  } else if (pathname.includes('/profile')) {
    activeTab = 'profile';
  }

  const handleRevokedConfirm = async () => {
    await dismissRevocationAndLogout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Slot />
      </View>
      <FloatingNavbar activeTab={activeTab} />
      <AccessRevokedModal
        visible={accessRevoked}
        onConfirm={handleRevokedConfirm}
      />
      <DepartmentChooserModal
        visible={needsDepartmentSelection}
        onSelectDepartment={declareStudentDepartment}
      />
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
