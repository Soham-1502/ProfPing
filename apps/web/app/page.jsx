'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { STATUS_CONFIG, STATUS_KEYS, ROLES, DEPARTMENTS, calculateDailyDeskHours } from '@profping/shared';
import { useAuth } from '../src/hooks/useAuth';

export default function Home() {
  const { user, role, department, logout } = useAuth();
  const router = useRouter();
  const [testCalculation, setTestCalculation] = useState(null);

  useEffect(() => {
    // Verify deskHours computation engine with sample day logs
    const sampleLogs = [
      { state: STATUS_KEYS.AVAILABLE, timestamp: new Date().setHours(9, 0, 0, 0) },
      { state: STATUS_KEYS.IN_LECTURE, timestamp: new Date().setHours(11, 30, 0, 0) },
      { state: STATUS_KEYS.AVAILABLE, timestamp: new Date().setHours(13, 0, 0, 0) },
      { state: STATUS_KEYS.BUSY, timestamp: new Date().setHours(15, 0, 0, 0) },
      { state: STATUS_KEYS.OFF_CAMPUS, timestamp: new Date().setHours(17, 0, 0, 0) },
    ];

    const result = calculateDailyDeskHours(sampleLogs, new Date(), {
      currentTimeMs: new Date().setHours(17, 30, 0, 0),
    });
    setTestCalculation(result);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAF8FE',
      color: '#1A191F',
      padding: '40px 24px',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #C8C5D3',
          boxShadow: '0 4px 20px -2px rgba(25, 13, 74, 0.04)',
          padding: '28px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
              <img
                src="/profping-logo.png"
                alt="ProfPing"
                style={{
                  height: '32px',
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
              <span style={{
                backgroundColor: '#E0D8FD',
                color: '#190D4A',
                fontSize: '11.5px',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: '9999px',
                letterSpacing: '0.5px',
              }}>
                CAMPUS CLARITY SYSTEM
              </span>
              <span style={{ color: '#15803D', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#15803D', display: 'inline-block' }} />
                Firebase & Shared Backend Linked
              </span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 4px', color: '#1A191F', letterSpacing: '-0.5px' }}>
              Institutional Command Portal
            </h1>
            <p style={{ color: '#4B4757', fontSize: '14.5px', margin: 0 }}>
              Real-time faculty availability and administrative desk-hour analytics system
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user ? (
              <>
                <span style={{
                  backgroundColor: '#E0D8FD',
                  border: '1px solid rgba(73, 47, 177, 0.25)',
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  color: '#190D4A',
                  fontWeight: 700,
                }}>
                  {role?.toUpperCase()} {department ? `(${department})` : ''}
                </span>
                <button
                  onClick={() => router.push(role === 'hod' ? '/hod' : role === 'principal' ? '/principal' : '/login')}
                  style={{
                    backgroundColor: '#492FB1',
                    border: 'none',
                    color: '#FFFFFF',
                    padding: '9px 20px',
                    borderRadius: '9999px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(73, 47, 177, 0.2)',
                  }}
                >
                  Enter Portal →
                </button>
                <button
                  onClick={logout}
                  style={{
                    backgroundColor: '#F4F2FA',
                    border: '1px solid #C8C5D3',
                    color: '#4B4757',
                    padding: '9px 18px',
                    borderRadius: '9999px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push('/login')}
                style={{
                  backgroundColor: '#492FB1',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '10px 24px',
                  borderRadius: '9999px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(73, 47, 177, 0.2)',
                }}
              >
                Sign In to Portal →
              </button>
            )}
          </div>
        </header>

        {/* Status Protocol Indicators */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1A191F', marginBottom: '16px' }}>
            Live Status Protocol Matrix
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
          }}>
            {Object.values(STATUS_CONFIG).map((cfg) => (
              <div
                key={cfg.key}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #C8C5D3',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px -2px rgba(25, 13, 74, 0.04)',
                  padding: '22px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  backgroundColor: cfg.color,
                }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '17px', fontWeight: 700, color: '#1A191F' }}>{cfg.label}</span>
                  <span style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    backgroundColor: `${cfg.color}15`,
                    color: cfg.color,
                    border: `1px solid ${cfg.color}30`,
                  }}>
                    {cfg.key}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#4B4757', lineHeight: '1.4' }}>{cfg.description}</p>
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#777585' }}>
                  Default note: <em style={{ color: '#1A191F' }}>"{cfg.defaultMessage}"</em>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Engine Verification & Departments */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Desk-Hour Computation Test */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #C8C5D3',
            borderRadius: '16px',
            boxShadow: '0 4px 20px -2px rgba(25, 13, 74, 0.04)',
            padding: '24px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1A191F', marginBottom: '10px' }}>
              Desk-Hour Telemetry Engine (Audit Compliant)
            </h3>
            <p style={{ fontSize: '13px', color: '#4B4757', marginBottom: '16px' }}>
              Testing delta-t algorithm with working-hours clipping (8:30 AM – 5:30 PM):
            </p>
            {testCalculation ? (
              <div style={{ backgroundColor: '#F4F2FA', padding: '16px', borderRadius: '12px', border: '1px solid #C8C5D3' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#4B4757', fontSize: '14px' }}>Computed Desk Hours:</span>
                  <strong style={{ color: '#15803D', fontSize: '16px' }}>{testCalculation.deskHours} hrs</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#4B4757', fontSize: '14px' }}>Sample Log State Transitions:</span>
                  <span style={{ color: '#1A191F', fontSize: '14px', fontWeight: 600 }}>{testCalculation.logCount} transitions</span>
                </div>
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #C8C5D3', fontSize: '12px', color: '#777585' }}>
                  State breakdown: Available: {testCalculation.stateDurationsHours.available}h | In Lecture: {testCalculation.stateDurationsHours.in_lecture}h | Busy: {testCalculation.stateDurationsHours.busy}h
                </div>
              </div>
            ) : (
              <p style={{ color: '#4B4757', fontSize: '13px' }}>Calculating...</p>
            )}
          </div>

          {/* Configured Departments */}
          <div style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #C8C5D3',
            borderRadius: '16px',
            boxShadow: '0 4px 20px -2px rgba(25, 13, 74, 0.04)',
            padding: '24px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1A191F', marginBottom: '10px' }}>
              Configured Institutional Departments
            </h3>
            <p style={{ fontSize: '13px', color: '#4B4757', marginBottom: '16px' }}>
              Departments supported for HOD department-scoped security rules:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {DEPARTMENTS.map((dept) => (
                <div
                  key={dept.id}
                  style={{
                    backgroundColor: '#F4F2FA',
                    border: '1px solid #C8C5D3',
                    padding: '8px 14px',
                    borderRadius: '9999px',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ color: '#492FB1', fontWeight: 800, marginRight: '6px' }}>{dept.id}</span>
                  <span style={{ color: '#4B4757' }}>{dept.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
