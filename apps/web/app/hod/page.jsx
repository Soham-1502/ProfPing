'use client';

import React, { useMemo } from 'react';
import RoleGuard from '../../src/components/RoleGuard';
import { useAuth } from '../../src/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getScopedFaculty } from '../../src/lib/dashboardService';
import LiveStatusTable from '../../src/components/LiveStatusTable';
import DeskHourChart from '../../src/components/DeskHourChart';
import { STATUS_KEYS } from '@profping/shared';

export default function HodDashboardPage() {
  const { user, department, logout } = useAuth();
  const router = useRouter();

  const effectiveDept = department || 'CMPN';
  const facultyList = useMemo(() => getScopedFaculty(effectiveDept), [effectiveDept]);

  // Aggregate stats
  const stats = useMemo(() => {
    let available = 0;
    let inLecture = 0;
    let compliant = 0;
    facultyList.forEach((f) => {
      if (f.status?.state === STATUS_KEYS.AVAILABLE) available++;
      if (f.status?.state === STATUS_KEYS.IN_LECTURE) inLecture++;
      if (f.compliance === 'COMPLIANT') compliant++;
    });
    return {
      total: facultyList.length,
      available,
      inLecture,
      compliant,
      rate: facultyList.length ? Math.round((compliant / facultyList.length) * 100) : 0,
    };
  }, [facultyList]);

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
          flexWrap: 'wrap',
          gap: '12px',
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
                HOD Portal — Department of {effectiveDept}
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
              Role: HOD ({effectiveDept})
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

        {/* Content Body */}
        <main style={{ maxWidth: '1240px', margin: '32px auto', padding: '0 24px' }}>
          {/* Summary Stat Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}>
            <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Department Faculty</span>
              <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: '#ffffff' }}>{stats.total}</div>
              <span style={{ fontSize: '11px', color: '#38bdf8' }}>Scaped to {effectiveDept} only</span>
            </div>

            <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Available at Desk</span>
              <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: '#10b981' }}>{stats.available}</div>
              <span style={{ fontSize: '11px', color: '#10b981' }}>Consultation active</span>
            </div>

            <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>In Lecture / Lab</span>
              <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: '#3b82f6' }}>{stats.inLecture}</div>
              <span style={{ fontSize: '11px', color: '#3b82f6' }}>Active teaching session</span>
            </div>

            <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Desk-Hour Compliance</span>
              <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: '#f59e0b' }}>{stats.rate}%</div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{stats.compliant} of {stats.total} met target (≥3h)</span>
            </div>
          </div>

          {/* Recharts Duration Analytics Chart */}
          <DeskHourChart facultyList={facultyList} title={`${effectiveDept} Faculty Desk-Hour Analysis`} />

          {/* Live Status Table */}
          <LiveStatusTable facultyList={facultyList} title={`${effectiveDept} Faculty Live Roster`} />
        </main>
      </div>
    </RoleGuard>
  );
}
