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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { INSTITUTION } from '@profping/shared';

const MOBILE_PRESETS = [
  { label: 'Faculty (Snehal - CMPN)', email: 'faculty.snehal@sfit.ac.in', role: 'faculty' },
  { label: 'Faculty (Rahul - CMPN)', email: 'faculty.rahul@sfit.ac.in', role: 'faculty' },
  { label: 'Student (Soham - CMPN)', email: 'student@sfit.ac.in', role: 'student' },
  { label: 'HOD (Dr. Sonawane)', email: 'hod.cmpn@sfit.ac.in', role: 'hod' },
];

export default function MobileLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    setError('');
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      setError('Please enter your institutional email');
      return;
    }

    if (!trimmed.endsWith(INSTITUTION.EMAIL_DOMAIN)) {
      setError(`Only institutional accounts (${INSTITUTION.EMAIL_DOMAIN}) are permitted`);
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
        router.replace('/(student)'); // HODs can also view mobile directory or switch to web
      } else {
        router.replace('/(student)');
      }
    } catch (err) {
      console.error('Mobile login failed:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found') {
        setError('Invalid credentials. Check email or tap a demo preset below.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const applyPreset = (preset) => {
    setEmail(preset.email);
    setPassword('Password@123');
    setError('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          {/* Logo / Badge */}
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>P</Text>
          </View>
          <Text style={styles.title}>ProfPing Mobile</Text>
          <Text style={styles.subtitle}>Institutional Faculty Availability Broadcast</Text>

          {/* Error Banner */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠ {error}</Text>
            </View>
          ) : null}

          {/* Input Fields */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>INSTITUTIONAL EMAIL ({INSTITUTION.EMAIL_DOMAIN})</Text>
            <TextInput
              style={styles.input}
              placeholder={`user${INSTITUTION.EMAIL_DOMAIN}`}
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••••••"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Preset Buttons */}
          <View style={styles.presetSection}>
            <Text style={styles.presetHeading}>Testing Presets (One-Tap Fill):</Text>
            <View style={styles.presetGrid}>
              {MOBILE_PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.email}
                  style={styles.presetBtn}
                  onPress={() => applyPreset(p)}
                >
                  <Text style={styles.presetLabel}>{p.label}</Text>
                  <Text style={styles.presetRole}>{p.role.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090d16',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },
  logoText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  presetSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetHeading: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 10,
    textAlign: 'center',
  },
  presetGrid: {
    gap: 8,
  },
  presetBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  presetLabel: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  presetRole: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '700',
  },
});
