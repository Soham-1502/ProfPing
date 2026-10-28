'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../src/hooks/useAuth';
import { INSTITUTION } from '@profping/shared';
import { AlertCircle, ArrowLeft } from 'lucide-react';

const DEMO_PRESETS = [
  { label: 'Principal Portal', email: 'principal@sfit.ac.in', role: 'principal' },
  { label: 'HOD ECS (Dr. Nitika Rai)', email: 'nitika.rai@sfit.ac.in', role: 'hod' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { user, role, loading, login, loginWithGoogleWeb } = useAuth();
  const router = useRouter();

  // If already logged in, redirect directly to portal without waiting
  useEffect(() => {
    if (!loading && user && role) {
      if (role === 'principal') {
        router.replace('/principal');
      } else if (role === 'hod') {
        router.replace('/hod');
      }
    }
  }, [user, role, loading, router]);

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const profile = await loginWithGoogleWeb('hod');
      if (profile) {
        router.replace('/hod');
      }
    } catch (err) {
      console.error('Google HOD login error:', err);
      setError(err.message || 'Google sign-in failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Please enter your institutional email address.');
      return;
    }

    if (!trimmedEmail.endsWith(INSTITUTION.EMAIL_DOMAIN)) {
      setError(`Access is restricted to ${INSTITUTION.EMAIL_DOMAIN} accounts.`);
      return;
    }

    setSubmitting(true);
    try {
      const result = await login(trimmedEmail, password);
      const targetRole = result?.role || role;
      if (targetRole === 'principal') {
        router.replace('/principal');
      } else if (targetRole === 'hod') {
        router.replace('/hod');
      } else {
        router.replace('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid credentials. Check your email or use a preset account below.');
      } else {
        setError(err.message || 'Authentication failed. Please verify credentials.');
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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAF8FE',
      backgroundImage: 'radial-gradient(circle at 50% 15%, rgba(73, 47, 177, 0.08), transparent 60%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      color: '#1A191F',
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        border: '1px solid #C8C5D3',
        borderRadius: '16px',
        padding: '36px',
        boxShadow: '0 12px 28px -6px rgba(73, 47, 177, 0.08), 0 4px 10px -2px rgba(26, 25, 31, 0.04)',
      }}>
        {/* Top Bar with Back Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => router.push('/')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#F4F2FA',
              border: '1px solid #C8C5D3',
              color: '#4B4757',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: '9999px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#190D4A';
              e.currentTarget.style.backgroundColor = '#E0D8FD';
              e.currentTarget.style.borderColor = '#492FB1';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#4B4757';
              e.currentTarget.style.backgroundColor = '#F4F2FA';
              e.currentTarget.style.borderColor = '#C8C5D3';
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
          }}>
            <img
              src="/icon.png"
              alt="ProfPing Logo Icon"
              style={{
                height: '42px',
                width: '42px',
                borderRadius: '10px',
                boxShadow: '0 4px 12px rgba(73, 47, 177, 0.2)',
              }}
            />
            <img
              src="/profping-logo.png"
              alt="ProfPing"
              style={{
                height: '32px',
                width: 'auto',
                maxWidth: '190px',
                objectFit: 'contain',
              }}
            />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#1A191F', letterSpacing: '-0.02em', margin: 0 }}>
            Institutional Portal
          </h1>
          <p style={{ color: '#4B4757', fontSize: '13px', marginTop: '6px' }}>
            Administrative command for Principal & Heads of Department
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            backgroundColor: '#FFDAD6',
            border: '1px solid #BA1A1A',
            borderRadius: '10px',
            padding: '12px 14px',
            color: '#93000A',
            fontSize: '12.5px',
            fontWeight: 600,
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}>
            <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || submitting}
          style={{
            width: '100%',
            backgroundColor: '#FFFFFF',
            color: '#1A191F',
            fontWeight: 700,
            fontSize: '13.5px',
            padding: '12px 16px',
            borderRadius: '9999px',
            border: '1px solid #C8C5D3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            cursor: googleLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            boxShadow: '0 2px 6px rgba(26, 25, 31, 0.04)',
            marginBottom: '20px',
            opacity: googleLoading ? 0.7 : 1,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          {googleLoading ? 'Verifying HOD Authorization...' : 'Sign in with Google'}
        </button>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '20px 0',
          color: '#746F80',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.04em',
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#EFECF6' }} />
          <span>OR SIGN IN WITH PASSWORD</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#EFECF6' }} />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#4B4757', marginBottom: '6px', letterSpacing: '0.02em' }}>
              INSTITUTIONAL EMAIL ({INSTITUTION.EMAIL_DOMAIN})
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`id${INSTITUTION.EMAIL_DOMAIN}`}
              required
              style={{
                width: '100%',
                backgroundColor: '#F4F2FA',
                border: '1px solid #C8C5D3',
                borderRadius: '10px',
                padding: '11px 14px',
                color: '#1A191F',
                fontSize: '13.5px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border 0.15s ease',
              }}
            />
          </div>

          <div style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#4B4757', letterSpacing: '0.02em' }}>
                PASSWORD
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#492FB1',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                backgroundColor: '#F4F2FA',
                border: '1px solid #C8C5D3',
                borderRadius: '10px',
                padding: '11px 14px',
                color: '#1A191F',
                fontSize: '13.5px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              backgroundColor: '#492FB1',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '14px',
              padding: '13px 20px',
              borderRadius: '9999px',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease',
              boxShadow: '0 4px 14px rgba(73, 47, 177, 0.25)',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Verifying Credentials...' : 'Sign In to Dashboard'}
          </button>
        </form>

        {/* Quick Demo Presets */}
        <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #EFECF6' }}>
          <p style={{
            fontSize: '11px',
            color: '#746F80',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '10px',
            textAlign: 'center',
          }}>
            One-Click Demo Profiles (Testing)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {DEMO_PRESETS.map((preset) => (
              <button
                key={preset.email}
                type="button"
                onClick={() => applyPreset(preset)}
                style={{
                  backgroundColor: '#E0D8FD',
                  border: '1px solid #C8C5D3',
                  borderRadius: '9999px',
                  padding: '7px 10px',
                  color: '#190D4A',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
