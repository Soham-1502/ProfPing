import React, { useState } from 'react';
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
  Image,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { INSTITUTION } from '@profping/shared';

// Demo accounts by role tab
const PRESETS = {
  student: { email: 'student@sfit.ac.in', password: 'Password@123' },
  faculty: { email: 'faculty.snehal@sfit.ac.in', password: 'Password@123' },
};

export default function MobileLoginScreen() {
  const [activeTab, setActiveTab] = useState('student'); // 'student' | 'faculty'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setEmail('');
    setPassword('');
    setError('');
  };

  const handleLogin = async () => {
    setError('');
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      setError('Please enter your institutional email');
      return;
    }
    if (!trimmed.endsWith(INSTITUTION.EMAIL_DOMAIN)) {
      setError(`Only ${INSTITUTION.EMAIL_DOMAIN} accounts are permitted`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await login(trimmed, password);
      if (res.role === 'faculty') {
        router.replace('/(faculty)');
      } else if (res.role === 'student') {
        router.replace('/(student)');
      } else if (res.role === 'hod' || res.role === 'principal') {
        router.replace('/(student)');
      } else {
        router.replace('/(student)');
      }
    } catch (err) {
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        setError('Invalid credentials. Try a demo preset below.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // One-tap demo fill
  const applyPreset = () => {
    const preset = PRESETS[activeTab];
    setEmail(preset.email);
    setPassword(preset.password);
    setError('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#dde4f5" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── TOP SECTION: lavender gradient ─────────────────────────── */}
        <View style={styles.topSection}>
          {/* Status pill + help button */}
          <View style={styles.topBar}>
            <View style={styles.statusPill}>
              <View style={styles.greenDot} />
              <Text style={styles.statusText}>Portal Active • Fast Ping</Text>
            </View>
            <TouchableOpacity style={styles.helpBtn}>
              <FontAwesome5 name="question" size={13} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* App Icon */}
          <Image
            source={require('../../assets/profping-icon.jpg')}
            style={styles.appIcon}
            resizeMode="cover"
          />

          {/* Brand Name */}
          <View style={styles.brandRow}>
            <Text style={styles.brandProf}>PROF– </Text>
            <Text style={styles.brandPing}>PING</Text>
            <FontAwesome5 name="wifi" size={16} color="#2563eb" style={{ marginLeft: 6, alignSelf: 'center' }} />
          </View>
          <Text style={styles.brandTagline}>
            Find your professor. Know their status.
          </Text>

          {/* Drag handle for bottom sheet feel */}
          <View style={styles.dragHandle} />
        </View>

        {/* ── BOTTOM SECTION: white card ──────────────────────────────── */}
        <View style={styles.card}>
          {/* Heading */}
          <Text style={styles.signInTitle}>Sign in</Text>
          <Text style={styles.signInSub}>Enter your account details to sign in</Text>

          {/* Student / Faculty Toggle */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, activeTab === 'student' && styles.toggleBtnActive]}
              onPress={() => handleTabSwitch('student')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, activeTab === 'student' && styles.toggleTextActive]}>
                Student
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, activeTab === 'faculty' && styles.toggleBtnActive]}
              onPress={() => handleTabSwitch('faculty')}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, activeTab === 'faculty' && styles.toggleTextActive]}>
                Faculty
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Banner */}
          {error ? (
            <View style={styles.errorBox}>
              <FontAwesome5 name="exclamation-circle" size={14} color="#dc2626" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email Field */}
          <Text style={styles.fieldLabel}>Institutional Email</Text>
          <View style={styles.inputWrapper}>
            <FontAwesome5 name="envelope" size={16} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={`netid${INSTITUTION.EMAIL_DOMAIN}`}
              placeholderTextColor="#b0b8cc"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>

          {/* Password Field */}
          <View style={styles.passwordLabelRow}>
            <Text style={styles.fieldLabel}>Password</Text>
            <TouchableOpacity>
              <Text style={styles.forgotLink}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputWrapper}>
            <FontAwesome5 name="lock" size={16} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••••••"
              placeholderTextColor="#b0b8cc"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <FontAwesome5 name={showPassword ? 'eye-slash' : 'eye'} size={15} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.signInBtn, submitting && styles.signInBtnDisabled]}
            onPress={handleLogin}
            disabled={submitting}
            activeOpacity={0.88}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.signInBtnInner}>
                <Text style={styles.signInBtnText}>Sign in</Text>
                <FontAwesome5 name="arrow-right" size={14} color="#ffffff" style={{ marginLeft: 8 }} />
              </View>
            )}
          </TouchableOpacity>

          {/* OR divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* SSO / Demo Preset Button */}
          <TouchableOpacity style={styles.ssoBtn} onPress={applyPreset} activeOpacity={0.85}>
            <FontAwesome5 name="id-card" size={18} color="#1a2340" />
            <Text style={styles.ssoBtnText}>
              {activeTab === 'student' ? 'Log in as Demo Student' : 'Log in as Demo Faculty'}
            </Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footerRow}>
            <FontAwesome5 name="shield-alt" size={12} color="#94a3b8" style={{ marginRight: 6 }} />
            <Text style={styles.footer}>Institutional 256-bit TLS Encryption</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const LAVENDER = '#dde4f5';
const CARD_WHITE = '#ffffff';
const NAVY = '#1a2340';
const BLUE_BRAND = '#2563eb';
const GRAY_TEXT = '#6b7280';
const FIELD_BG = '#f3f5fa';
const FIELD_BORDER = '#e2e6f0';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: LAVENDER,
  },
  scroll: {
    flexGrow: 1,
  },

  // ── TOP SECTION ──────────────────────────────────────────────────────
  topSection: {
    backgroundColor: LAVENDER,
    alignItems: 'center',
    paddingTop: 52,
    paddingBottom: 0,
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 28,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    gap: 6,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  helpBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: '#c4cde0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  helpText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  appIcon: {
    width: 96,
    height: 96,
    borderRadius: 22,
    marginBottom: 16,
    shadowColor: '#1d4ed8',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  brandProf: {
    fontSize: 26,
    fontWeight: '900',
    color: NAVY,
    letterSpacing: -0.5,
  },
  brandPing: {
    fontSize: 26,
    fontWeight: '900',
    color: BLUE_BRAND,
    letterSpacing: -0.5,
  },
  brandWifi: {
    fontSize: 16,
    fontWeight: '700',
    color: BLUE_BRAND,
  },
  brandTagline: {
    fontSize: 14,
    color: '#5a6a8a',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#c0c9df',
    marginBottom: 0,
  },

  // ── BOTTOM CARD ──────────────────────────────────────────────────────
  card: {
    backgroundColor: CARD_WHITE,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    flex: 1,
    minHeight: 540,
    // shadow
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 8,
  },
  signInTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: NAVY,
    textAlign: 'center',
    marginBottom: 4,
  },
  signInSub: {
    fontSize: 13,
    color: GRAY_TEXT,
    textAlign: 'center',
    marginBottom: 22,
  },

  // Tab toggle
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f3f9',
    borderRadius: 50,
    padding: 4,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 50,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: GRAY_TEXT,
  },
  toggleTextActive: {
    color: NAVY,
    fontWeight: '700',
  },

  // Error
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },

  // Fields
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: NAVY,
    marginBottom: 8,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 16,
  },
  forgotLink: {
    fontSize: 13,
    color: BLUE_BRAND,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FIELD_BG,
    borderWidth: 1,
    borderColor: FIELD_BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    width: 20,
    textAlign: 'center',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: NAVY,
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  eyeIcon: {
    fontSize: 16,
  },

  // Sign In button
  signInBtn: {
    backgroundColor: '#111827',
    borderRadius: 50,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signInBtnDisabled: {
    opacity: 0.6,
  },
  signInBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e9f2',
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
  },

  // SSO button
  ssoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e6f0',
    borderRadius: 12,
    height: 52,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  ssoIcon: {
    fontSize: 20,
  },
  ssoBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: NAVY,
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  footer: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
