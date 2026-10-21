'use client';

import React, { useState, useEffect } from 'react';
import { STATUS_CONFIG, STATUS_KEYS, ROLES, DEPARTMENTS, calculateDailyDeskHours } from '@profping/shared';
import { auth, db } from '../src/lib/firebase';

export default function Home() {
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
      backgroundColor: '#090d16',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      padding: '40px 24px',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '24px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                backgroundColor: '#3b82f6',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '6px',
                letterSpacing: '1px',
              }}>
                PHASE 1 FOUNDATION
              </span>
              <span style={{ color: '#10b981', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                Firebase & Shared Package Linked
              </span>
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, marginTop: '8px', letterSpacing: '-0.5px' }}>
              ProfPing Administrative Portal
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '15px', marginTop: '4px' }}>
              Real-time faculty availability and administrative desk-hour analytics system
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#cbd5e1',
            }}>
              Role: Principal / HOD
            </span>
          </div>
        </header>

        {/* Status Protocol Indicators */}
        <section style={{ marginBottom: '36px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#e2e8f0', marginBottom: '16px' }}>
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
                  backgroundColor: 'rgba(30, 41, 59, 0.7)',
                  border: `1px solid ${cfg.borderColor}40`,
                  borderRadius: '12px',
                  padding: '20px',
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
                  <span style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>{cfg.label}</span>
                  <span style={{
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: cfg.color,
                  }}>
                    {cfg.key}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.4' }}>{cfg.description}</p>
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748b' }}>
                  Default broadcast: <em style={{ color: '#cbd5e1' }}>"{cfg.defaultMessage}"</em>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Engine Verification & Departments */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Desk-Hour Computation Test */}
          <div style={{
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '24px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f1f5f9', marginBottom: '12px' }}>
              Desk-Hour Engine (Section 9 Verification)
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
              Testing delta-t algorithm with working-hours clipping (8:30 AM – 5:30 PM):
            </p>
            {testCalculation ? (
              <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Computed Desk Hours:</span>
                  <strong style={{ color: '#10b981', fontSize: '16px' }}>{testCalculation.deskHours} hrs</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Sample Log State Transitions:</span>
                  <span style={{ color: '#cbd5e1', fontSize: '14px' }}>{testCalculation.logCount} transitions</span>
                </div>
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '12px', color: '#64748b' }}>
                  State breakdown: Available: {testCalculation.stateDurationsHours.available}h | In Lecture: {testCalculation.stateDurationsHours.in_lecture}h | Busy: {testCalculation.stateDurationsHours.busy}h
                </div>
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>Calculating...</p>
            )}
          </div>

          {/* Configured Departments */}
          <div style={{
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '24px',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f1f5f9', marginBottom: '12px' }}>
              Configured Institutional Departments
            </h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
              Departments supported for HOD department-scoped security rules:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {DEPARTMENTS.map((dept) => (
                <div
                  key={dept.id}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                >
                  <span style={{ color: '#38bdf8', fontWeight: 700, marginRight: '6px' }}>{dept.id}</span>
                  <span style={{ color: '#94a3b8' }}>{dept.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phase 1 Completion Status Banner */}
        <footer style={{
          marginTop: '40px',
          padding: '20px',
          borderRadius: '10px',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <span style={{ color: '#10b981', fontWeight: 700, fontSize: '14px' }}>Phase 1 Exit Criteria Met:</span>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
              Monorepo established with npm workspaces, Expo mobile app scaffolded with Metro monorepo resolver, Next.js web portal running with shared constants and deskHours telemetry engine.
            </p>
          </div>
          <span
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              padding: '10px 18px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Ready for Phase 2: Auth →
          </span>
        </footer>
      </div>
    </div>
  );
}
