'use client';

import React from 'react';
import RoleGuard from '../../src/components/RoleGuard';
import { useAuth } from '../../src/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function PrincipalDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <RoleGuard allowedRoles={['principal']}>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#090d16',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        {/* Navigation Bar */}
        <nav style={{
          backgroundColor: '#0f172a',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '16px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              backgroundColor: '#8b5cf6',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '16px',
              padding: '6px 10px',
              borderRadius: '8px',
            }}>
              ProfPing
            </span>
            <div>
              <h1 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                Principal Executive Portal — Campus Overview
              </h1>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Campus-wide live availability, cross-department analytics, and audit logs
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              color: '#c4b5fd',
              border: '1px solid rgba(139, 92, 246, 0.2)',
              fontSize: '12px',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '6px',
            }}>
              Role: Principal (Super Admin)
            </span>
            <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
              {user?.email}
            </span>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Sign Out
            </button>
          </div>
        </nav>

        {/* Content Shell */}
        <main style={{ maxWidth: '1200px', margin: '32px auto', padding: '0 24px' }}>
          <div style={{
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#8b5cf6' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
                Campus-Wide Overview: All Academic Departments
              </h2>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5' }}>
              Full administrative privileges active. Realtime Database security rules grant read permissions across all departmental logs (<strong style={{ color: '#f1f5f9' }}>/logs/*</strong>) and private user profiles (<strong style={{ color: '#f1f5f9' }}>/users/*</strong>).
            </p>
          </div>

          <div style={{
            backgroundColor: '#0f172a',
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center',
            color: '#64748b',
          }}>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#94a3b8' }}>
              Phase 2 RBAC Verification Active
            </p>
            <p style={{ fontSize: '13px', marginTop: '6px' }}>
              Full campus live table and aggregated institutional analytics will connect here in Phases 6 & 7.
            </p>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
