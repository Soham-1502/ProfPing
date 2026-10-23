import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const TABS = ['home', 'history', 'profile'];

export default function FacultyNavbar({ activeTab = 'home' }) {
  const router = useRouter();
  const activeIndex = Math.max(0, TABS.indexOf(activeTab));

  const screenWidth = Dimensions.get('window').width;
  const initialContentWidth = Math.max(0, screenWidth - 32 - 16);
  const [contentWidth, setContentWidth] = useState(initialContentWidth);

  const tabWidth = contentWidth > 0 ? contentWidth / TABS.length : 0;
  const slideAnim = useRef(new Animated.Value(activeIndex * (initialContentWidth / TABS.length))).current;

  useEffect(() => {
    if (tabWidth > 0) {
      Animated.spring(slideAnim, {
        toValue: activeIndex * tabWidth,
        friction: 8,
        tension: 65,
        useNativeDriver: true,
      }).start();
    }
  }, [activeIndex, tabWidth]);

  const handleTabPress = (tabName, index) => {
    if (activeTab !== tabName) {
      if (tabWidth > 0) {
        Animated.spring(slideAnim, {
          toValue: index * tabWidth,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }).start();
      }
      if (tabName === 'home') {
        router.replace('/(faculty)');
      } else if (tabName === 'history') {
        router.replace('/(faculty)/history');
      } else if (tabName === 'profile') {
        router.replace('/(faculty)/profile');
      }
    }
  };

  const pillWidth = Math.max(0, tabWidth - 8);

  return (
    <View
      style={styles.floatingNavBar}
      onLayout={(e) => {
        const measured = e.nativeEvent.layout.width - 16; // subtract paddingHorizontal (8 * 2)
        if (measured > 0 && Math.abs(measured - contentWidth) > 1) {
          setContentWidth(measured);
        }
      }}
    >
      {/* Fluid Sliding Purple Pill */}
      {pillWidth > 0 && (
        <Animated.View
          style={[
            styles.slidingPill,
            {
              width: pillWidth,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        />
      )}

      {/* Home Tab */}
      <TouchableOpacity
        style={styles.floatingTabItem}
        onPress={() => handleTabPress('home', 0)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={activeTab === 'home' ? 'home' : 'home-outline'}
          size={19}
          color={activeTab === 'home' ? '#4326B6' : '#64748B'}
        />
        <Text style={[styles.floatingTabLabel, activeTab === 'home' && styles.floatingTabLabelActive]}>
          Home
        </Text>
      </TouchableOpacity>

      {/* History Tab */}
      <TouchableOpacity
        style={styles.floatingTabItem}
        onPress={() => handleTabPress('history', 1)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={activeTab === 'history' ? 'time' : 'time-outline'}
          size={19}
          color={activeTab === 'history' ? '#4326B6' : '#64748B'}
        />
        <Text style={[styles.floatingTabLabel, activeTab === 'history' && styles.floatingTabLabelActive]}>
          History
        </Text>
      </TouchableOpacity>

      {/* Profile Tab */}
      <TouchableOpacity
        style={styles.floatingTabItem}
        onPress={() => handleTabPress('profile', 2)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={activeTab === 'profile' ? 'person' : 'person-outline'}
          size={19}
          color={activeTab === 'profile' ? '#4326B6' : '#64748B'}
        />
        <Text style={[styles.floatingTabLabel, activeTab === 'profile' && styles.floatingTabLabelActive]}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingNavBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    height: 64,
    backgroundColor: '#FFFFFF',
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#1A191F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 12,
    zIndex: 99,
  },
  slidingPill: {
    position: 'absolute',
    top: 8,
    left: 12, // paddingHorizontal (8) + pill margin (4)
    height: 48,
    backgroundColor: '#EDE9FE',
    borderRadius: 9999,
    zIndex: 1,
  },
  floatingTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  floatingTabLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  floatingTabLabelActive: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    color: '#4326B6',
  },
});

