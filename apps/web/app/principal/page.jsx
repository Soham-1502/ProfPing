'use client';

import React, { useState, useMemo } from 'react';
import RoleGuard from '../../src/components/RoleGuard';
import { useAuth } from '../../src/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getScopedFaculty } from '../../src/lib/dashboardService';
import LiveStatusTable from '../../src/components/LiveStatusTable';
import DeskHourChart from '../../src/components/DeskHourChart';
import { STATUS_KEYS, DEPARTMENTS } from '@profping/shared';

export default function PrincipalDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [selectedDept, setSelectedDept] = useState('ALL');

  // Campus-wide faculty list
  const allFaculty = useMemo(() => getScopedFaculty(null), []);

  // Filtered by department if selected
  const displayFaculty = useMemo(() => {
    if (selectedDept === 'ALL') return allFaculty;
    return allFaculty.filter((f) => f.department === selectedDept);
  }, [allFaculty, selectedDept]);

  // Campus Stats
  const campusStats = useMemo(() => {
    let available = 0;
    let inLecture = 0;
    let compliant = 0;
    displayFaculty.forEach((f) => {
      if (f.status?.state === STATUS_KEYS.AVAILABLE) available++;
      if (f.status?.state === STATUS_KEYS.IN_LECTURE) inLecture++;
      if (f.compliance === 'COMPLIANT') compliant++;
    });
    return {
      total: displayFaculty.length,
      available,
      inLecture,
      compliant,
      rate: displayFaculty.length ? Math.round((compliant / displayFaculty.length) * 100) : 0,
    };
  }, [displayFaculty]);

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
          flexWrap: 'wrap',
          gap: '12px',
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
                Principal Executive Portal — Institutional Campus Overview
              </h1>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                Cross-department live availability, faculty compliance metrics, and audit records
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
              Role: Principal (Campus Super Admin)
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
          {/* Department Selection Filter Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}>
            <button
              onClick={() => setSelectedDept('ALL')}
              style={{
                backgroundColor: selectedDept === 'ALL' ? '#8b5cf6' : '#0f172a',
                border: `1px solid ${selectedDept === 'ALL' ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)'}`,
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              All Departments ({allFaculty.length})
            </button>
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setSelectedDept(dept.id)}
                style={{
                  backgroundColor: selectedDept === dept.id ? '#8b5cf6' : '#0f172a',
                  border: `1px solid ${selectedDept === dept.id ? '#8b5cf6' : 'rgba(255, 255, 255, 0.1)'}`,
                  color: selectedDept === dept.id ? '#ffffff' : '#94a3b8',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {dept.id}
              </button>
            ))}
          </div>

          {/* Campus Stat Metrics */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}>
            <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Faculty in Scope</span>
              <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: '#ffffff' }}>{campusStats.total}</div>
              <span style={{ fontSize: '11px', color: '#c4b5fd' }}>{selectedDept === 'ALL' ? 'Campus Total' : selectedDept}</span>
            </div>

            <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Available in Cabin</span>
              <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: '#10b981' }}>{campusStats.available}</div>
              <span style={{ fontSize: '11px', color: '#10b981' }}>Available for students</span>
            </div>

            <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>In Lectures / Labs</span>
              <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: '#3b82f6' }}>{campusStats.inLecture}</div>
              <span style={{ fontSize: '11px', color: '#3b82f6' }}>Active classes</span>
            </div>

            <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Institutional Compliance</span>
              <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '6px', color: '#f59e0b' }}>{campusStats.rate}%</div>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>{campusStats.compliant} of {campusStats.total} met target (≥3h)</span>
            </div>
          </div>

          {/* Recharts Analytics Chart */}
          <DeskHourChart
            facultyList={displayFaculty}
            title={selectedDept === 'ALL' ? 'Institutional Campus-Wide Desk-Hour Analytics' : `${selectedDept} Department Desk-Hour Analytics`}
          />

          {/* Live Status Table */}
          <LiveStatusTable
            facultyList={displayFaculty}
            title={selectedDept === 'ALL' ? 'Campus-Wide Faculty Availability Roster' : `${selectedDept} Faculty Availability Roster`}
          />
        </main>
      </div>
    </RoleGuard>
  );
}
