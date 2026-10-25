import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5, AntDesign } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as Google from 'expo-auth-session/providers/google';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';
import { useAuth } from '../../src/context/AuthContext';
import { INSTITUTION } from '@profping/shared';

WebBrowser.maybeCompleteAuthSession();

// Institutional accounts available for one-tap sign-in
const GOOGLE_CAMPUS_ACCOUNTS = [
  {
    displayName: 'Dr. Nitika Rai',
    email: 'nitika.rai@sfit.ac.in',
    roleTag: 'HOD • ECS Dept',
    avatarBg: '#341C94',
    avatarText: 'NR',
  },
  {
    displayName: 'Soham Tamhankar',
    email: 'student@sfit.ac.in',
    roleTag: 'Student • CMPN Dept',
    avatarBg: '#0A687B',
    avatarText: 'ST',
  },
];

export default function MobileLoginScreen() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleModalVisible, setGoogleModalVisible] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  // Active focus indicators for input fields
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();

  // Real Google AuthSession Request
  const googleClientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    '475299222486-5b0r6tntanjfg0h9621lllruinab03i7.apps.googleusercontent.com';

  const redirectUri = Platform.select({
    web: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081',
    default: 'https://auth.expo.io/@anonymous/profping',
  });

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: googleClientId,
    webClientId: googleClientId,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || googleClientId,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || googleClientId,
    scopes: ['profile', 'email'],
    prompt: 'select_account',
    redirectUri,
  });

  // Display exact redirect URI in Metro bundler logs for easy Google Cloud Console configuration
  useEffect(() => {
    if (request?.redirectUri) {
      console.log('👉 [Google OAuth] Configured Redirect URI:', request.redirectUri);
    }
  }, [request?.redirectUri]);

  useEffect(() => {
    async function handleAuthResponse() {
      if (response?.type === 'success') {
        const accessToken = response.authentication?.accessToken || response.params?.access_token;
        if (accessToken) {
          setSubmitting(true);
          try {
            const userInfoRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            const googleUser = await userInfoRes.json();
            const res = await loginWithGoogle(googleUser);
            routeUserByRole(res.role);
          } catch (err) {
            setError(err.message || 'Google sign-in failed');
          } finally {
            setSubmitting(false);
          }
        }
      } else if (response?.type === 'error') {
        setError(response.error?.message || 'Google sign-in encountered an error.');
      }
    }
    handleAuthResponse();
  }, [response]);

  // Navigate according to resolved role
  const routeUserByRole = (role) => {
    if (role === 'hod') {
      router.replace('/(hod)');
    } else if (role === 'faculty') {
      router.replace('/(faculty)');
    } else {
      router.replace('/(student)');
    }
  };

  // Standard institutional email & password login
  const handleLogin = async () => {
    setError('');
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      setError('Please enter your institutional email');
      return;
    }
    const isStudentDomain = trimmed.endsWith('@student.sfit.ac.in');
    const isStaffDomain = trimmed.endsWith('@sfit.ac.in');
    if (!isStudentDomain && !isStaffDomain) {
      setError('Only @student.sfit.ac.in or @sfit.ac.in accounts are permitted');
      return;
    }

    setSubmitting(true);
    try {
      const res = await login(trimmed, password);
      routeUserByRole(res.role);
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        setError('Invalid credentials. Check your email or use a demo account.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Continue with Google press: triggers real device Google OAuth session
  const handleGooglePress = async () => {
    setError('');
    setSubmitting(true);

    try {
      if (Platform.OS === 'web') {
        if (request) {
          const result = await promptAsync();
          if (result?.type === 'success') return;
        }
        setGoogleModalVisible(true);
        return;
      }

      // 1. Determine app return URL (e.g. exp://192.168.1.4:8081)
      const appReturnUrl = Linking.createURL('');

      // 2. Build Google OAuth authorization URL with authorized redirect_uri
      const googleRedirectUri = 'https://auth.expo.io/@anonymous/profping';
      const googleAuthParams = new URLSearchParams({
        client_id: googleClientId,
        redirect_uri: googleRedirectUri,
        response_type: 'token',
        scope: 'profile email',
        prompt: 'select_account',
      });
      const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${googleAuthParams.toString()}`;

      // 3. Route through /start to set the proxy 'ru' cookie so it redirects back to the app
      const startUrl = `https://auth.expo.io/@anonymous/profping/start?authUrl=${encodeURIComponent(googleAuthUrl)}&returnUrl=${encodeURIComponent(appReturnUrl)}`;

      console.log('👉 [Google OAuth] Launching browser auth with returnUrl:', appReturnUrl);

      // 4. Open in-app browser waiting for redirect back to appReturnUrl
      const result = await WebBrowser.openAuthSessionAsync(startUrl, appReturnUrl);

      if (result.type === 'success' && result.url) {
        // Extract token from return URL hash (#access_token=... or ?access_token=...)
        const rawHash = result.url.includes('#') ? result.url.split('#')[1] : result.url.split('?')[1] || '';
        const params = Object.fromEntries(new URLSearchParams(rawHash));
        const accessToken = params.access_token;

        if (accessToken) {
          const userInfoRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          const googleUser = await userInfoRes.json();
          const res = await loginWithGoogle(googleUser);
          routeUserByRole(res.role);
          return;
        }
      }

      // If user cancelled or dismissed, stop loading
      if (result.type === 'cancel' || result.type === 'dismiss') {
        return;
      }
    } catch (err) {
      console.warn('Real Google OAuth note:', err);
      setError(err.message || 'Google sign-in encountered an error');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Google Login from picker
  const handleGoogleSelect = async (account) => {
    setGoogleModalVisible(false);
    setError('');
    setSubmitting(true);

    try {
      const res = await loginWithGoogle(account);
      routeUserByRole(res.role);
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCustomGoogleSubmit = async () => {
    const trimmed = customGoogleEmail.trim().toLowerCase();
    if (!trimmed) return;
    const isStudentDomain = trimmed.endsWith('@student.sfit.ac.in');
    const isStaffDomain = trimmed.endsWith('@sfit.ac.in');
    if (!isStudentDomain && !isStaffDomain) {
      setError('Access Denied: Only @student.sfit.ac.in or @sfit.ac.in accounts are permitted.');
      return;
    }
    await handleGoogleSelect({
      email: trimmed,
      displayName: trimmed.split('@')[0].replace('.', ' '),
    });
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingRoot}>
        <StatusBar barStyle="light-content" backgroundColor="#341C94" />
        <ActivityIndicator size="small" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <StatusBar barStyle="light-content" backgroundColor="#341C94" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── 1. TOP HEADER SECTION (Deep Violet Brand Canvas) ─────────── */}
        <View style={styles.topHeader}>
          {/* Subtle Ambient Radial Lighting */}
          <View pointerEvents="none" style={styles.headerGlowTop} />
          <View pointerEvents="none" style={styles.headerGlowBottom} />

          {/* Top Bar with Back Button */}
          <View style={styles.topNavRow}>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/onboarding')}
              style={styles.backButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.8}
            >
              <FontAwesome5 name="arrow-left" size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Academic Shield Icon with Graduation Cap & Broadcast Waves */}
          <View style={styles.brandIconWrapper}>
            {/* Wi-Fi Broadcast Waves at Top-Right */}
            <View style={styles.wifiWaveBox}>
              <FontAwesome5 name="wifi" size={16} color="#C4B5FD" />
            </View>

            {/* Shield with Graduation Cap Inside */}
            <View style={styles.shieldBase}>
              <FontAwesome5 name="shield-alt" size={54} color="#FFFFFF" />
              <View style={styles.capOverlay}>
                <FontAwesome5 name="graduation-cap" size={21} color="#341C94" />
              </View>
            </View>
          </View>

          {/* Main Title: Bold White Inter */}
          <Text style={styles.headerTitle}>Sign in to your{'\n'}Account</Text>

          {/* Subtitle: Soft Lavender Inter */}
          <Text style={styles.headerSubtitle}>
            Enter your email and password to log in
          </Text>
        </View>

        {/* ── 2. WHITE AUTHENTICATION SHEET CONTAINER ─────────────────── */}
        <View style={styles.whiteSheet}>
          {/* Error Banner */}
          {error ? (
            <View style={styles.errorBox}>
              <FontAwesome5
                name="exclamation-circle"
                size={14}
                color="#BA1A1A"
                style={{ marginRight: 8, marginTop: 1 }}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* ── Continue with Google Pill Button ──────────────────────── */}
          <TouchableOpacity
            style={styles.googlePillButton}
            onPress={handleGooglePress}
            activeOpacity={0.88}
            disabled={submitting}
          >
            <View style={styles.googleIconBox}>
              <AntDesign name="google" size={18} color="#EA4335" />
            </View>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* ── OR LOGIN WITH Divider ─────────────────────────────────── */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR LOGIN WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Form Field: Email/Username ────────────────────────────── */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email/Username</Text>
            <View
              style={[
                styles.inputCard,
                emailFocused && styles.inputCardFocused,
              ]}
            >
              <FontAwesome5
                name="envelope"
                size={15}
                color="#94A3B8"
                style={styles.fieldIcon}
              />
              <TextInput
                style={styles.inputField}
                placeholder={`id${INSTITUTION.EMAIL_DOMAIN}`}
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* ── Form Field: Password ──────────────────────────────────── */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View
              style={[
                styles.inputCard,
                passwordFocused && styles.inputCardFocused,
              ]}
            >
              <FontAwesome5
                name="lock"
                size={15}
                color="#94A3B8"
                style={styles.fieldIcon}
              />
              <TextInput
                style={styles.inputField}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeToggle}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <FontAwesome5
                  name={showPassword ? 'eye-slash' : 'eye'}
                  size={14}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Remember Me & Forgot Password Row ─────────────────────── */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkboxSquare,
                  rememberMe && styles.checkboxSquareActive,
                ]}
              >
                {rememberMe && (
                  <FontAwesome5 name="check" size={10} color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.rememberText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                alert(
                  'Please contact SFIT IT helpdesk or your department coordinator to reset password.'
                )
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password ?</Text>
            </TouchableOpacity>
          </View>

          {/* ── Primary Action Button ("Log In") ──────────────────────── */}
          <TouchableOpacity
            style={[styles.loginButton, submitting && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={submitting}
            activeOpacity={0.9}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Log In</Text>
            )}
          </TouchableOpacity>

          {/* ── Sign Up Row ───────────────────────────────────────────── */}
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() =>
                alert(
                  'Institutional accounts are provisioned via your SFIT NetID (@sfit.ac.in). Contact department admin if you need access.'
                )
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* ── Quick Demo Test Accounts (One-Tap Access) ─────────────── */}
          <View style={styles.quickTestSection}>
            <Text style={styles.quickTestHeader}>AUTHORIZED CAMPUS ACCOUNTS</Text>
            <View style={styles.quickTestRow}>
              <TouchableOpacity
                style={styles.quickTestChip}
                onPress={() => {
                  setEmail('nitika.rai@sfit.ac.in');
                  setPassword('Password@123');
                  setError('');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.testDot, { backgroundColor: '#341C94' }]} />
                <Text style={styles.testChipText}>Dr. Nitika Rai (HOD ECS)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickTestChip}
                onPress={() => {
                  setEmail('student@sfit.ac.in');
                  setPassword('Password@123');
                  setError('');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.testDot, { backgroundColor: '#2563EB' }]} />
                <Text style={styles.testChipText}>Student (Soham Tamhankar)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ── Google Institutional Account Picker Modal ────────────────── */}
      <Modal
        visible={googleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setGoogleModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheetCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalBrandRow}>
                <AntDesign name="google" size={18} color="#EA4335" style={{ marginRight: 8 }} />
                <Text style={styles.modalBrandText}>Google</Text>
              </View>
              <Text style={styles.modalTitle}>Sign in with Google</Text>
              <Text style={styles.modalSubtitle}>
                Choose an account to continue to <Text style={{ color: '#492FB1', fontWeight: '700' }}>ProfPing</Text>
              </Text>
            </View>

            <View style={styles.accountList}>
              {GOOGLE_CAMPUS_ACCOUNTS.map((acc, index) => (
                <TouchableOpacity
                  key={acc.email}
                  style={[
                    styles.accountItem,
                    index < GOOGLE_CAMPUS_ACCOUNTS.length - 1 && styles.accountItemBorder,
                  ]}
                  onPress={() => handleGoogleSelect(acc)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.accountAvatar, { backgroundColor: acc.avatarBg }]}>
                    <Text style={styles.accountAvatarText}>{acc.avatarText}</Text>
                  </View>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>{acc.displayName}</Text>
                    <Text style={styles.accountEmail}>{acc.email}</Text>
                    <Text style={styles.accountRoleTag}>{acc.roleTag}</Text>
                  </View>
                  <FontAwesome5 name="chevron-right" size={11} color="#C8C5D3" />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.customEmailBox}>
              <Text style={styles.customEmailLabel}>Or enter another @sfit.ac.in account:</Text>
              <View style={styles.customEmailRow}>
                <TextInput
                  style={styles.customEmailInput}
                  placeholder={`name${INSTITUTION.EMAIL_DOMAIN}`}
                  placeholderTextColor="#746F80"
                  value={customGoogleEmail}
                  onChangeText={setCustomGoogleEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <TouchableOpacity
                  style={styles.customEmailButton}
                  onPress={handleCustomGoogleSubmit}
                >
                  <Text style={styles.customEmailButtonText}>Proceed</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCancelPill}
              onPress={() => setGoogleModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ── EXACT MOCKUP STYLING ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#341C94', // Deep Royal Violet Header Background
  },
  loadingRoot: {
    flex: 1,
    backgroundColor: '#341C94',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flexGrow: 1,
    backgroundColor: '#341C94',
  },

  // ── 1. Top Header Area (Deep Royal Violet) ──────────────────────────────────
  topHeader: {
    backgroundColor: '#341C94',
    paddingTop: Platform.OS === 'ios' ? 62 : 46,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  headerGlowTop: {
    position: 'absolute',
    top: -40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#4C28CF',
    opacity: 0.35,
  },
  headerGlowBottom: {
    position: 'absolute',
    bottom: -30,
    width: 280,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#271279',
    opacity: 0.45,
  },
  topNavRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Brand Icon: Shield + Cap + Broadcast Waves
  brandIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 72,
    marginTop: 2,
    marginBottom: 16,
  },
  shieldBase: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  capOverlay: {
    position: 'absolute',
    top: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wifiWaveBox: {
    position: 'absolute',
    top: 0,
    right: 6,
    transform: [{ rotate: '42deg' }],
  },

  headerTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontWeight: '800',
    fontSize: 27,
    lineHeight: 34,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontWeight: '400',
    fontSize: 13.5,
    lineHeight: 20,
    color: '#D1C8F7',
    textAlign: 'center',
  },

  // ── 2. The White Authentication Sheet ──────────────────────────────────────
  whiteSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    // Soft floating elevation shadow
    shadowColor: '#1A191F',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 10,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFDAD6',
    borderWidth: 1,
    borderColor: '#BA1A1A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    fontSize: 13,
    color: '#93000A',
    flex: 1,
    lineHeight: 18,
  },

  // Continue with Google Pill Button
  googlePillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 9999, // Pill shape
    height: 52,
    paddingHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  googleIconBox: {
    marginRight: 10,
  },
  googleButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 15,
    color: '#1A191F',
    letterSpacing: 0.1,
  },

  // OR LOGIN WITH Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 22,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#EDF2F7',
  },
  dividerText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 10.5,
    color: '#94A3B8',
    marginHorizontal: 12,
    letterSpacing: 0.8,
  },

  // Input Fields
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 13.5,
    color: '#1A191F',
    marginBottom: 8,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputCardFocused: {
    borderColor: '#4326B6',
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  fieldIcon: {
    marginRight: 12,
  },
  inputField: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 14.5,
    color: '#1A191F',
    height: '100%',
  },
  eyeToggle: {
    padding: 6,
  },

  // Options: Remember Me & Forgot Password
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxSquare: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxSquareActive: {
    backgroundColor: '#4326B6',
    borderColor: '#4326B6',
  },
  rememberText: {
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    fontSize: 13,
    color: '#4B4757',
  },
  forgotPasswordText: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 13,
    color: '#4326B6',
  },

  // Primary Action Button ("Log In")
  loginButton: {
    backgroundColor: '#4326B6', // Solid Campus Violet
    borderRadius: 9999, // Pill shape
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#4326B6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.72,
  },
  loginButtonText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // Don't have an account? Sign Up
  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  signupText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13.5,
    color: '#64748B',
  },
  signupLink: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 13.5,
    color: '#4326B6',
  },

  // Quick Demo Section
  quickTestSection: {
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  quickTestHeader: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 10.5,
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  quickTestRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  quickTestChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 9999,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  testDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  testChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    fontSize: 12,
    color: '#1A191F',
  },

  // Modal Dialog
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 25, 31, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalSheetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 380,
    padding: 24,
    shadowColor: '#1A191F',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalBrandText: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    fontSize: 18,
    color: '#1A191F',
  },
  modalTitle: {
    fontFamily: 'Inter_800ExtraBold',
    fontWeight: '800',
    fontSize: 20,
    color: '#1A191F',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#4B4757',
    textAlign: 'center',
  },
  accountList: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C8C5D3',
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  accountItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EFECF6',
  },
  accountAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountAvatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1A191F',
  },
  accountEmail: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11.5,
    color: '#4B4757',
    marginTop: 1,
  },
  accountRoleTag: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10.5,
    fontWeight: '600',
    color: '#492FB1',
    marginTop: 2,
  },
  customEmailBox: {
    backgroundColor: '#F4F2FA',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#C8C5D3',
    marginBottom: 16,
  },
  customEmailLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    fontWeight: '600',
    color: '#4B4757',
    marginBottom: 6,
  },
  customEmailRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customEmailInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C8C5D3',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 12.5,
    color: '#1A191F',
    height: 38,
  },
  customEmailButton: {
    backgroundColor: '#492FB1',
    borderRadius: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
  },
  customEmailButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalCancelPill: {
    backgroundColor: '#F4F2FA',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#C8C5D3',
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13.5,
    fontWeight: '700',
    color: '#4B4757',
  },
});
