'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

export default function RoleGuard({ allowedRoles = [], children }) {
  const { user, role, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FAF8FE',
        color: '#4B4757',
        fontFamily: 'inherit',
      }}>
        <div style={{
          width: '38px',
          height: '38px',
          border: '3px solid #E0D8FD',
          borderTopColor: '#492FB1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '16px',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: '14px', letterSpacing: '0.2px', fontWeight: 600 }}>Verifying Institutional RBAC Session...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  // Check role authorization
  const hasRequiredRole = allowedRoles.length === 0 || (role && allowedRoles.includes(role));

  if (!hasRequiredRole) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#FAF8FE',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'inherit',
      }}>
        <div style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          border: '1px solid #C8C5D3',
          borderRadius: '16px',
          padding: '36px',
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(25, 13, 74, 0.08)',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#FEE2E2',
            color: '#DC2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '22px',
            fontWeight: 'bold',
          }}>
            ✕
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1A191F', marginBottom: '8px' }}>
            Access Restricted
          </h2>
          <p style={{ fontSize: '13.5px', color: '#4B4757', lineHeight: '1.5', marginBottom: '24px' }}>
            Your account (<strong style={{ color: '#1A191F' }}>{user.email}</strong>) has the role{' '}
            <span style={{
              color: '#190D4A',
              backgroundColor: '#E0D8FD',
              padding: '3px 10px',
              borderRadius: '9999px',
              fontWeight: 700,
            }}>
              {role || 'unassigned'}
            </span>
            , but this portal requires{' '}
            <strong style={{ color: '#1A191F' }}>{allowedRoles.join(' or ')}</strong> access.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push(role === 'hod' ? '/hod' : role === 'principal' ? '/principal' : '/')}
              style={{
                backgroundColor: '#492FB1',
                border: 'none',
                color: '#FFFFFF',
                padding: '10px 20px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(73, 47, 177, 0.2)',
              }}
            >
              Go to Your Portal
            </button>
            <button
              onClick={async () => {
                await logout();
                router.push('/login');
              }}
              style={{
                backgroundColor: '#FEE2E2',
                border: '1px solid rgba(220, 38, 38, 0.25)',
                color: '#7F1D1D',
                padding: '10px 20px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Sign In Different Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
