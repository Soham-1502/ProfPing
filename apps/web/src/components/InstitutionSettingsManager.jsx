'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Clock, Shield, CheckCircle2, AlertCircle, Save, RotateCcw } from 'lucide-react';
import { DEFAULT_INSTITUTION_SETTINGS } from '@profping/shared';

export default function InstitutionSettingsManager() {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form Fields
  const [workStart, setWorkStart] = useState('08:30');
  const [workEnd, setWorkEnd] = useState('17:30');
  const [deskTargetHours, setDeskTargetHours] = useState('3.0');
  const [resetTime, setResetTime] = useState('17:01');
  const [resetEnabled, setResetEnabled] = useState(true);

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setWorkStart(data.settings.workStart || '08:30');
        setWorkEnd(data.settings.workEnd || '17:30');
        setDeskTargetHours(String(data.settings.deskTargetHours || 3.0));
        setResetTime(data.settings.resetTime || '17:01');
        setResetEnabled(data.settings.resetEnabled !== false);
      }
    } catch (err) {
      setError('Failed to load institution settings from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handlePreSubmit = (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validate start before end
    const [startH, startM] = workStart.split(':').map(Number);
    const [endH, endM] = workEnd.split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    if (startMins >= endMins) {
      setError('Working hours start must be strictly before working hours end.');
      return;
    }

    const windowHours = (endMins - startMins) / 60;
    const target = parseFloat(deskTargetHours);
    if (isNaN(target) || target <= 0 || target > windowHours) {
      setError(`Desk-hour target must be greater than 0 and within the working window (${windowHours.toFixed(1)} hrs).`);
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirmModal(false);
    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workStart,
          workEnd,
          deskTargetHours: parseFloat(deskTargetHours),
          resetTime,
          resetEnabled,
          callerRole: role,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update institution settings.');
      }

      setSuccessMsg('Institution settings saved and synchronized across all campus telemetry screens.');
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#1A191F' }}>
          Institution-Wide Operational Settings
        </h2>
        <p style={{ fontSize: '13px', color: '#4B4757', margin: '4px 0 0 0' }}>
          Master working hours, daily desk-hour target, and evening status reset rules enforced across all campus dashboards and mobile apps.
        </p>
      </div>

      {successMsg && (
        <div style={{
          backgroundColor: '#DCFCE7',
          border: '1px solid rgba(21, 128, 61, 0.3)',
          borderRadius: '12px',
          padding: '12px 18px',
          color: '#14532D',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <CheckCircle2 size={16} />
          {successMsg}
        </div>
      )}

      {error && (
        <div style={{
          backgroundColor: '#FEE2E2',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          borderRadius: '12px',
          padding: '12px 18px',
          color: '#7F1D1D',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #C8C5D3',
        borderRadius: '16px',
        padding: '24px 28px',
        boxShadow: '0 4px 20px -2px rgba(25, 13, 74, 0.04)',
        maxWidth: '820px',
      }}>
        <form onSubmit={handlePreSubmit}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px',
            marginBottom: '28px',
          }}>
            {/* Working Hours Start */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1A191F', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Working Window Start
              </label>
              <input
                type="time"
                value={workStart}
                onChange={(e) => setWorkStart(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #C8C5D3',
                  backgroundColor: '#FAF8FE',
                  color: '#1A191F',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{ fontSize: '11.5px', color: '#777585', marginTop: '4px', display: 'block' }}>
                Earliest time desk hour credits begin (default: 08:30)
              </span>
            </div>

            {/* Working Hours End */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1A191F', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Working Window End
              </label>
              <input
                type="time"
                value={workEnd}
                onChange={(e) => setWorkEnd(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #C8C5D3',
                  backgroundColor: '#FAF8FE',
                  color: '#1A191F',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{ fontSize: '11.5px', color: '#777585', marginTop: '4px', display: 'block' }}>
                Closing time for official faculty availability (default: 17:30)
              </span>
            </div>

            {/* Desk-Hour Target */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1A191F', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Desk-Hour Daily Target (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="12.0"
                value={deskTargetHours}
                onChange={(e) => setDeskTargetHours(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #C8C5D3',
                  backgroundColor: '#FAF8FE',
                  color: '#1A191F',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{ fontSize: '11.5px', color: '#777585', marginTop: '4px', display: 'block' }}>
                Threshold for compliance in telemetry & progress bars (default: 3.0 hrs)
              </span>
            </div>

            {/* Evening Reset Time */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#1A191F', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Evening Automated Reset Time
              </label>
              <input
                type="time"
                value={resetTime}
                onChange={(e) => setResetTime(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #C8C5D3',
                  backgroundColor: '#FAF8FE',
                  color: '#1A191F',
                  fontSize: '14px',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <span style={{ fontSize: '11.5px', color: '#777585', marginTop: '4px', display: 'block' }}>
                Time when active statuses revert to Off Campus (default: 17:01)
              </span>
            </div>
          </div>

          {/* Evening Reset Enabled Switch */}
          <div style={{
            backgroundColor: '#F4F2FA',
            border: '1px solid #C8C5D3',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '28px',
          }}>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#1A191F' }}>
                Enable Automated Evening Reset
              </div>
              <div style={{ fontSize: '12px', color: '#4B4757', marginTop: '2px' }}>
                Automatically sets all non-Off Campus faculty to Off Campus and logs append-only events.
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={resetEnabled}
                onChange={(e) => setResetEnabled(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: '#492FB1', cursor: 'pointer' }}
              />
            </label>
          </div>

          {/* Submit Action */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={fetchSettings}
              disabled={loading || saving}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #C8C5D3',
                color: '#4B4757',
                padding: '9px 18px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RotateCcw size={14} />
              Reset
            </button>

            <button
              type="submit"
              disabled={loading || saving}
              style={{
                backgroundColor: '#492FB1',
                border: 'none',
                color: '#FFFFFF',
                padding: '9px 24px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(73, 47, 177, 0.25)',
              }}
            >
              <Save size={15} />
              {saving ? 'Saving...' : 'Save Institutional Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(25, 13, 74, 0.4)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1A191F', margin: '0 0 8px 0' }}>
              Confirm Institution Settings Update
            </h3>
            <p style={{ fontSize: '13px', color: '#4B4757', lineHeight: 1.5, margin: '0 0 16px 0' }}>
              Updating these parameters will immediately alter desk-hour accumulation and compliance target calculations across all departments and faculty profiles:
            </p>
            <div style={{
              backgroundColor: '#FAF8FE',
              border: '1px solid #E9E7F1',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '12.5px',
              color: '#1A191F',
              marginBottom: '20px',
            }}>
              <div>Working Window: <strong>{workStart} – {workEnd}</strong></div>
              <div>Daily Desk Target: <strong>{deskTargetHours} hrs</strong></div>
              <div>Automated Reset: <strong>{resetEnabled ? `Enabled at ${resetTime}` : 'Disabled'}</strong></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #C8C5D3',
                  color: '#4B4757',
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                style={{
                  backgroundColor: '#492FB1',
                  border: 'none',
                  color: '#FFFFFF',
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Confirm & Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
