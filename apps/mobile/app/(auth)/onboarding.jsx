import React, { useState, useRef } from 'react';
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
  FlatList,
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

const SLIDES = [
  {
    id: 'slide-1',
    image: require('../../assets/onboarding-slide1.jpg'),
    headline: 'Find Your Professor Instantly',
    body: 'Know their real-time availability and exact campus location before you walk to their cabin.',
  },
  {
    id: 'slide-2',
    image: require('../../assets/onboarding-slide2.jpg'),
    headline: 'Set Status in One Click',
    body: 'Faculty can instantly broadcast their availability, current classroom, or custom notes to the entire department.',
  },
  {
    id: 'slide-3',
    image: require('../../assets/onboarding-slide3.jpg'),
    headline: 'Interactive Campus Maps',
    body: 'A live digital twin of your department. See exactly which desk, lab, or lecture hall your professor is currently in.',
  },
  {
    id: 'slide-4',
    image: require('../../assets/onboarding-slide4.jpg'),
    headline: 'Never Wait Outside Again',
    body: 'Skip the waiting game. Star your important professors and get automatic push notifications the second they switch to "Available".',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setCurrentIndex(nextIndex);
    } else {
      handleStart();
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/login');
  };

  const handleMomentumScrollEnd = (event) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    if (index >= 0 && index < SLIDES.length) {
      setCurrentIndex(index);
    }
  };

  const scrollToSlide = (index) => {
    flatListRef.current?.scrollToIndex({
      index,
      animated: true,
    });
    setCurrentIndex(index);
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
        {/* ── TOP BAR (Skip Button) ──────────────────────────────────── */}
        <View style={styles.topBar}>
          <Image
            source={require('../../assets/profping-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          {currentIndex < SLIDES.length - 1 ? (
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={handleSkip}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.skipPlaceholder} />
          )}
        </View>

        {/* ── HORIZONTAL CAROUSEL SLIDES ─────────────────────────────── */}
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          renderItem={({ item }) => (
            <View style={styles.slideContainer}>
              {/* 1. Hero 3D Illustration Area */}
              <View style={styles.heroSection}>
                <View style={styles.imageWrapper}>
                  <Image
                    source={item.image}
                    style={styles.heroImage}
                    resizeMode="contain"
                  />
                </View>
              </View>

              {/* 2. Typography Section */}
              <View style={styles.textSection}>
                <Text style={styles.headline}>{item.headline}</Text>
                <Text style={styles.bodyText}>{item.body}</Text>
              </View>
            </View>
          )}
          style={styles.flatList}
        />

        {/* ── BOTTOM CONTROLS (Dots + CTA) ────────────────────────────── */}
        <View style={styles.bottomSection}>
          {/* Pagination Indicator Dots */}
          <View style={styles.paginationRow}>
            {SLIDES.map((_, idx) => {
              const isActive = idx === currentIndex;
              return (
                <TouchableOpacity
                  key={`dot-${idx}`}
                  style={[styles.dot, isActive ? styles.dotActive : styles.dotInactive]}
                  onPress={() => scrollToSlide(idx)}
                  activeOpacity={0.8}
                  hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                />
              );
            })}
          </View>

          {/* Dynamic CTA Button */}
          <View style={styles.ctaWrapper}>
            {currentIndex < SLIDES.length - 1 ? (
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleNext}
                activeOpacity={0.88}
              >
                <Text style={styles.startButtonText}>Next</Text>
                <FontAwesome5
                  name="arrow-right"
                  size={14}
                  color="#FFFFFF"
                  style={styles.arrowIcon}
                />
              </TouchableOpacity>
            ) : (
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
            )}
          </View>
        </View>
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
    justifyContent: 'space-between',
  },

  // ── Top Bar ────────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 4 : 12,
    paddingBottom: 8,
    zIndex: 10,
  },
  logoImage: {
    width: 108,
    height: 26,
  },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: '#EDE9FE',
  },
  skipBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 12.5,
    color: '#492FB1',
    letterSpacing: 0.2,
  },
  skipPlaceholder: {
    width: 50,
    height: 28,
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

  // ── Horizontal Carousel FlatList ───────────────────────────────────────────
  flatList: {
    flex: 1,
  },
  slideContainer: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  // ── 1. Hero 3D Illustration Area ───────────────────────────────────────────
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  imageWrapper: {
    width: Math.min(width * 0.82, 330),
    height: Math.min(height * 0.36, 330),
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
    maxWidth: 340,
  },
  headline: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 27, // Bold 27px Inter font per spec
    lineHeight: 35,
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
    paddingHorizontal: 6,
  },

  // ── 3. Bottom Controls ─────────────────────────────────────────────────────
  bottomSection: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 20 : 28,
    alignItems: 'center',
  },

  // ── Pagination Dots ────────────────────────────────────────────────────────
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#E9E7F1', // soft gray
  },
  dotActive: {
    width: 26, // wide soft-pill
    backgroundColor: '#492FB1', // Campus Violet
  },

  // ── CTA Button ─────────────────────────────────────────────────────────────
  ctaWrapper: {
    width: '100%',
  },
  startButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#492FB1', // Solid Campus Violet
    borderRadius: 9999, // Prominent, full-width pill shape
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // Soft floating drop shadow with faint violet tint:
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
