import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const router = useRouter();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const handleStart = () => {
    router.push('/(auth)/login');
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF8FE" />
        <ActivityIndicator size="small" color="#492FB1" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8FE" />

      {/* ── Soft Ethereal Gradient Blurred Orbs ──────────────────────── */}
      <View pointerEvents="none" style={styles.orbCanvas}>
        {/* Campus Violet faint ambient orb */}
        <View style={styles.orbViolet} />
        {/* Insight Teal faint ambient orb */}
        <View style={styles.orbTeal} />
        {/* Center ambient glow orb */}
        <View style={styles.orbCenterGlow} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ── 1. Hero 3D Illustration Area ─────────────────────────── */}
          <View style={styles.heroSection}>
            <View style={styles.imageWrapper}>
              <Image
                source={require('../../assets/student-hero.jpg')}
                style={styles.heroImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* ── 2. Typography Section ─────────────────────────────────── */}
          <View style={styles.textSection}>
            <Text style={styles.headline}>Find Your Professor Instantly</Text>
            <Text style={styles.bodyText}>
              Know their real-time availability and exact campus location before
              you walk to their cabin.
            </Text>
          </View>

          {/* ── 3. Call to Action ─────────────────────────────────────── */}
          <View style={styles.ctaSection}>
            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStart}
              activeOpacity={0.88}
            >
              <Text style={styles.startButtonText}>Let's Start</Text>
              <FontAwesome5
                name="arrow-right"
                size={14}
                color="#FFFFFF"
                style={styles.arrowIcon}
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── EXACT CAMPUS CLARITY SYSTEM STYLING ──────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAF8FE', // Whisper Violet App Canvas
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAF8FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: Platform.OS === 'ios' ? 24 : 32,
  },

  // ── Ethereal Gradient Orbs ─────────────────────────────────────────────────
  orbCanvas: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orbViolet: {
    position: 'absolute',
    top: -50,
    left: -40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#492FB1', // Campus Violet
    opacity: 0.12,
  },
  orbTeal: {
    position: 'absolute',
    top: 60,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#0A687B', // Insight Teal
    opacity: 0.12,
  },
  orbCenterGlow: {
    position: 'absolute',
    top: height * 0.22,
    alignSelf: 'center',
    width: 300,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#E0D8FD', // primary-container
    opacity: 0.25,
  },

  // ── 1. Hero 3D Illustration Area ───────────────────────────────────────────
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  imageWrapper: {
    width: Math.min(width * 0.85, 350),
    height: Math.min(height * 0.38, 350),
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },

  // ── 2. Typography Section ──────────────────────────────────────────────────
  textSection: {
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 32,
  },
  headline: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 28, // Bold 28px Inter font per spec
    lineHeight: 36,
    color: '#1A191F', // Ink
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  bodyText: {
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    fontSize: 14, // Regular 14px Inter font per spec
    lineHeight: 22,
    color: '#4B4757', // Muted Plum-Gray
    textAlign: 'center',
    maxWidth: 320,
    paddingHorizontal: 4,
  },

  // ── 3. Call to Action ──────────────────────────────────────────────────────
  ctaSection: {
    width: '100%',
    alignItems: 'center',
  },
  startButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#492FB1', // Solid Campus Violet
    borderRadius: 9999, // Prominent, full-width pill shape
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // Soft floating drop shadow with faint violet tint (0 12px 28px -6px rgba(73, 47, 177, 0.3)):
    shadowColor: '#492FB1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 8,
  },
  startButtonText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 16.5,
    color: '#FFFFFF', // Bold white text
    letterSpacing: 0.2,
  },
  arrowIcon: {
    marginLeft: 10,
    marginTop: 1,
  },
});

