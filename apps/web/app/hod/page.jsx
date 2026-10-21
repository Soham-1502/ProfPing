'use client';

import React from 'react';
import RoleGuard from '../../src/components/RoleGuard';
import { useAuth } from '../../src/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function HodDashboardPage() {
  const { user, department, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <RoleGuard allowedRoles={['hod']}>
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
              backgroundColor: '#3b82f6',
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
                HOD Dashboard — Department of {department || 'Department'}
              </h1>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Department-scoped live telemetry & desk-hour compliance
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: '#38bdf8',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              fontSize: '12px',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '6px',
            }}>
              Role: HOD ({department || 'CMPN'})
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
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
                Department Telemetry: {department || 'CMPN'} Faculty
              </h2>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5' }}>
              You are authenticated as Head of Department with RBAC scoping active. Realtime Database security rules restrict your read access to faculty within your assigned department (<strong style={{ color: '#f1f5f9' }}>{department}</strong>).
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
              Live faculty status table and daily desk-hour telemetry charts will connect here in Phases 6 & 7.
            </p>
          </div>
        </main>
      </div>
    </RoleGuard>
  );
}
