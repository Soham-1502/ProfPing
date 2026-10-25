'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import { getDepartmentSettings, updateDepartmentSettings } from '../../../src/lib/hodService';
import { Clock, Shield, Building, CheckCircle2, Save, AlertCircle } from 'lucide-react';
import { INSTITUTION } from '@profping/shared';

export default function DepartmentSettingsPage() {
  const { department, user } = useAuth();
  const effectiveDept = department || 'CMPN';

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form Fields
  const [hoursStart, setHoursStart] = useState('08:30');
  const [hoursEnd, setHoursEnd] = useState('17:00');
  const [autoResetOffCampus, setAutoResetOffCampus] = useState(true);
  const [hodOffice, setHodOffice] = useState('Room 301, 3rd Floor Main Building');
  const [hodIntercom, setHodIntercom] = useState('Ext. 3010');
  const [allowCustomNotes, setAllowCustomNotes] = useState(true);
  const [requireIntercom, setRequireIntercom] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      const data = await getDepartmentSettings(effectiveDept);
      setSettings(data);
      if (data) {
        setHoursStart(data.hoursStart || '08:30');
        setHoursEnd(data.hoursEnd || '17:00');
        setAutoResetOffCampus(data.autoResetOffCampus !== false);
        setHodOffice(data.hodOffice || 'Room 301, 3rd Floor Main Building');
        setHodIntercom(data.hodIntercom || 'Ext. 3010');
        setAllowCustomNotes(data.allowCustomStatusNotes !== false);
        setRequireIntercom(data.requireIntercomOnDesk !== false);
      }
      setLoading(false);
    }
    loadSettings();
  }, [effectiveDept]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...settings,
        hoursStart,
        hoursEnd,
        autoResetOffCampus,
        autoResetTime: '17:01',
        hodOffice,
        hodIntercom,
        allowCustomStatusNotes: allowCustomNotes,
        requireIntercomOnDesk: requireIntercom,
      };

      await updateDepartmentSettings(effectiveDept, payload);
      setSuccessMessage('Department settings and automated reset rules successfully synchronized to Firebase.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      alert('Failed to save department settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#1A191F' }}>
          Global Department Governance & Automations ({effectiveDept})
        </h2>
        <p style={{ fontSize: '13px', color: '#4B4757', margin: '4px 0 0 0' }}>
          Configure department operating hours, evening status wiping rules, and role domain access permissions
        </p>
      </div>

      {successMessage && (
        <div style={{
          backgroundColor: '#DCFCE7',
          border: '1px solid rgba(21, 128, 61, 0.3)',
          borderRadius: '12px',
          padding: '12px 18px',
          color: '#14532D',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <CheckCircle2 size={16} />
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Section 1: Department Operating Hours & Automated Reset */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #C8C5D3',
          borderRadius: '16px',
          boxShadow: '0 4px 20px -2px rgba(25, 13, 74, 0.04)',
          padding: '24px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Clock size={18} color="#492FB1" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#1A191F' }}>
              Official Department Hours & Automated Evening Reset
            </h3>
          </div>

          <p style={{ fontSize: '13px', color: '#4B4757', lineHeight: '1.5', marginBottom: '20px' }}>
            A Firebase Cloud Function reads these hours daily. If automated reset is enabled, all faculty members in {effectiveDept} are automatically set to <strong style={{ color: '#DC2626' }}>🔴 Off Campus</strong> at the end of the department day (5:01 PM). This ensures students never visit an empty cabin due to a professor forgetting to update their status.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4B4757', marginBottom: '6px' }}>
                DEPARTMENT OPENING TIME
              </label>
              <input
                type="time"
                value={hoursStart}
                onChange={(e) => setHoursStart(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#F4F2FA',
                  border: '1px solid #C8C5D3',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  color: '#1A191F',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4B4757', marginBottom: '6px' }}>
                DEPARTMENT CLOSING TIME
              </label>
              <input
                type="time"
                value={hoursEnd}
                onChange={(e) => setHoursEnd(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#F4F2FA',
                  border: '1px solid #C8C5D3',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  color: '#1A191F',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#F4F2FA',
            padding: '14px 18px',
            borderRadius: '12px',
            border: '1px solid #C8C5D3',
            cursor: 'pointer',
          }}>
            <input
              type="checkbox"
              checked={autoResetOffCampus}
              onChange={(e) => setAutoResetOffCampus(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#492FB1' }}
            />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1A191F' }}>
                Enable Automated Daily Evening Status Reset
              </div>
              <div style={{ fontSize: '12px', color: '#4B4757' }}>
                Triggers at 17:01 PM to wipe active statuses and prevent stale next-morning student visits.
              </div>
            </div>
          </label>
        </div>

        {/* Section 2: Role Access Governance & Email Mapping */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #C8C5D3',
          borderRadius: '16px',
          boxShadow: '0 4px 20px -2px rgba(25, 13, 74, 0.04)',
          padding: '24px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Shield size={18} color="#492FB1" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#1A191F' }}>
              Authentication Gate: Email Domain & Role Rules
            </h3>
          </div>

          <p style={{ fontSize: '13px', color: '#4B4757', lineHeight: '1.5', marginBottom: '16px' }}>
            The institutional system automatically validates which Google email domains can authenticate as which role:
          </p>

          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#F4F2FA',
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1px solid #C8C5D3',
            }}>
              <div>
                <strong style={{ color: '#1A191F', fontSize: '13px' }}>HOD Portal Access</strong>
                <div style={{ fontSize: '12px', color: '#4B4757' }}>Designated Department Head email accounts</div>
              </div>
              <span style={{
                backgroundColor: '#E0D8FD',
                color: '#190D4A',
                fontFamily: 'monospace',
                fontSize: '11.5px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '9999px',
              }}>
                hod.{effectiveDept.toLowerCase()}@sfit.ac.in
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#F4F2FA',
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1px solid #C8C5D3',
            }}>
              <div>
                <strong style={{ color: '#1A191F', fontSize: '13px' }}>Faculty Mobile Broadcaster</strong>
                <div style={{ fontSize: '12px', color: '#4B4757' }}>Must match a provisioned Faculty Directory record</div>
              </div>
              <span style={{
                backgroundColor: '#DCFCE7',
                color: '#14532D',
                fontFamily: 'monospace',
                fontSize: '11.5px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '9999px',
              }}>
                *@sfit.ac.in (Role: faculty)
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#F4F2FA',
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1px solid #C8C5D3',
            }}>
              <div>
                <strong style={{ color: '#1A191F', fontSize: '13px' }}>Student Mobile Viewer</strong>
                <div style={{ fontSize: '12px', color: '#4B4757' }}>Institutional student Google accounts (Subject to Kill Switch)</div>
              </div>
              <span style={{
                backgroundColor: '#FEF3C7',
                color: '#78350F',
                fontFamily: 'monospace',
                fontSize: '11.5px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '9999px',
              }}>
                *@student.sfit.ac.in
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Department Office & Contact */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #C8C5D3',
          borderRadius: '16px',
          boxShadow: '0 4px 20px -2px rgba(25, 13, 74, 0.04)',
          padding: '24px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Building size={18} color="#492FB1" />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#1A191F' }}>
              Department Head Office Details
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4B4757', marginBottom: '6px' }}>
                HOD OFFICE LOCATION
              </label>
              <input
                type="text"
                value={hodOffice}
                onChange={(e) => setHodOffice(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#F4F2FA',
                  border: '1px solid #C8C5D3',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  color: '#1A191F',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4B4757', marginBottom: '6px' }}>
                HOD INTERCOM EXTENSION
              </label>
              <input
                type="text"
                value={hodIntercom}
                onChange={(e) => setHodIntercom(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#F4F2FA',
                  border: '1px solid #C8C5D3',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  color: '#1A191F',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              backgroundColor: '#492FB1',
              border: 'none',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '13.5px',
              padding: '12px 28px',
              borderRadius: '9999px',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(73, 47, 177, 0.25)',
            }}
          >
            <Save size={16} />
            {saving ? 'Synchronizing Rules...' : 'Save Department Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
