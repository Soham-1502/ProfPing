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
        backgroundColor: '#090d16',
        color: '#94a3b8',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid rgba(59, 130, 246, 0.2)',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginBottom: '16px',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ fontSize: '14px', letterSpacing: '0.5px' }}>Verifying Institutional RBAC Session...</p>
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
        backgroundColor: '#090d16',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div style={{
          maxWidth: '480px',
          width: '100%',
          backgroundColor: '#0f172a',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '16px',
          padding: '32px',
          textAlign: 'center',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '22px',
            fontWeight: 'bold',
          }}>
            ✕
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
            Access Restricted
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '20px' }}>
            Your account (<strong style={{ color: '#cbd5e1' }}>{user.email}</strong>) has the role{' '}
            <span style={{
              color: '#38bdf8',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontWeight: 600,
            }}>
              {role || 'unassigned'}
            </span>
            , but this portal requires{' '}
            <strong style={{ color: '#f1f5f9' }}>{allowedRoles.join(' or ')}</strong> access.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => router.push(role === 'hod' ? '/hod' : role === 'principal' ? '/principal' : '/')}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
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
                backgroundColor: '#ef4444',
                border: 'none',
                color: '#ffffff',
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
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
