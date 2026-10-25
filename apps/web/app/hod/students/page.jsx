'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { subscribeToStudents, toggleStudentAccess } from '../../../src/lib/hodService';
import { ShieldCheck, ShieldAlert, Search, AlertOctagon, CheckCircle, UserX, UserCheck } from 'lucide-react';

export default function StudentAccessControlPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [togglingUid, setTogglingUid] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToStudents((list) => {
      setStudents(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggle = async (student) => {
    setTogglingUid(student.uid);
    try {
      const newStatus = await toggleStudentAccess(student.uid, student.is_active !== false);
      const msg = newStatus
        ? `Access restored for ${student.name || student.email}. Student can now use mobile app.`
        : `Kill Switch engaged: Access revoked for ${student.name || student.email}. Mobile app will block access on next open.`;
      setToastMessage(msg);
      setTimeout(() => setToastMessage(''), 5000);
    } catch (err) {
      alert('Failed to toggle student access: ' + err.message);
    } finally {
      setTogglingUid(null);
    }
  };

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return students.filter((s) => {
      return (
        (s.name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.rollNo || '').toLowerCase().includes(q) ||
        (s.department || '').toLowerCase().includes(q)
      );
    });
  }, [students, searchQuery]);

  const stats = useMemo(() => {
    let active = 0;
    let revoked = 0;
    students.forEach((s) => {
      if (s.is_active !== false) active++;
      else revoked++;
    });
    return { total: students.length, active, revoked };
  }, [students]);

  return (
    <div>
      {/* Title & Description */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#1A191F' }}>
          Student Access Governance & Audit Log
        </h2>
        <p style={{ fontSize: '13px', color: '#4B4757', margin: '4px 0 0 0' }}>
          Real-time audit log of institutional student mobile sessions with individual kill-switch controls
        </p>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          backgroundColor: toastMessage.includes('revoked') ? '#FEE2E2' : '#DCFCE7',
          border: `1px solid ${toastMessage.includes('revoked') ? 'rgba(220, 38, 38, 0.3)' : 'rgba(21, 128, 61, 0.3)'}`,
          color: toastMessage.includes('revoked') ? '#7F1D1D' : '#14532D',
          borderRadius: '12px',
          padding: '12px 18px',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          {toastMessage.includes('revoked') ? <AlertOctagon size={16} /> : <CheckCircle size={16} />}
          {toastMessage}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid #C8C5D3',
          boxShadow: '0 4px 20px -2px rgba(25, 13, 74, 0.04)',
        }}>
          <span style={{ fontSize: '12px', color: '#4B4757', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>Total Registered Students</span>
          <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '6px', color: '#1A191F' }}>{stats.total}</div>
          <span style={{ fontSize: '12px', color: '#492FB1', fontWeight: 600 }}>Auto-provisioned via Google</span>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(21, 128, 61, 0.3)',
          boxShadow: '0 4px 20px -2px rgba(21, 128, 61, 0.05)',
        }}>
          <span style={{ fontSize: '12px', color: '#15803D', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>Active Student Sessions</span>
          <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '6px', color: '#15803D' }}>{stats.active}</div>
          <span style={{ fontSize: '12px', color: '#4B4757' }}>Authorized to view faculty location</span>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          boxShadow: '0 4px 20px -2px rgba(220, 38, 38, 0.05)',
        }}>
          <span style={{ fontSize: '12px', color: '#DC2626', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>Access Revoked (Kill Switch)</span>
          <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '6px', color: '#DC2626' }}>{stats.revoked}</div>
          <span style={{ fontSize: '12px', color: '#4B4757' }}>Blocked from mobile app</span>
        </div>
      </div>

      {/* Search Input */}
      <div style={{
        position: 'relative',
        marginBottom: '20px',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '12px 18px',
        border: '1px solid #C8C5D3',
        boxShadow: '0 4px 20px -2px rgba(25, 13, 74, 0.04)',
      }}>
        <Search size={16} color="#777585" style={{ position: 'absolute', left: '32px', top: '22px' }} />
        <input
          type="text"
          placeholder="Search by student name, roll number, or @student.sfit.ac.in email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: '#F4F2FA',
            border: '1px solid #C8C5D3',
            borderRadius: '9999px',
            padding: '10px 16px 10px 42px',
            color: '#1A191F',
            fontSize: '13px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Student Audit Table */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #C8C5D3',
        borderRadius: '16px',
        boxShadow: '0 4px 20px -2px rgba(25, 13, 74, 0.04)',
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#EFECF6', borderBottom: '1px solid #C8C5D3' }}>
                <th style={{ padding: '14px 20px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px' }}>STUDENT NAME</th>
                <th style={{ padding: '14px 18px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px' }}>INSTITUTIONAL EMAIL</th>
                <th style={{ padding: '14px 18px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px' }}>DEPT / YEAR</th>
                <th style={{ padding: '14px 18px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px' }}>LAST APP ACCESS</th>
                <th style={{ padding: '14px 18px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px' }}>ACCESS PERMISSION</th>
                <th style={{ padding: '14px 20px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px', textAlign: 'right' }}>KILL SWITCH TOGGLE</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s, idx) => {
                const isActive = s.is_active !== false;
                const isToggling = togglingUid === s.uid;

                return (
                  <tr
                    key={s.uid || idx}
                    style={{
                      borderBottom: '1px solid #E9E7F1',
                      backgroundColor: isActive ? 'transparent' : 'rgba(220, 38, 38, 0.04)',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (isActive) e.currentTarget.style.backgroundColor = 'rgba(73, 47, 177, 0.02)';
                    }}
                    onMouseLeave={(e) => {
                      if (isActive) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 700, color: '#1A191F' }}>
                        {s.name || s.displayName || s.email?.split('@')[0]}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#777585', fontFamily: 'monospace' }}>
                        UID: {s.uid?.slice(0, 16)}...
                      </div>
                    </td>
                    <td style={{ padding: '16px 18px', color: '#4B4757', fontFamily: 'monospace', fontSize: '12px' }}>
                      {s.email}
                    </td>
                    <td style={{ padding: '16px 18px' }}>
                      <span style={{
                        backgroundColor: '#E0D8FD',
                        color: '#190D4A',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}>
                        {s.department || 'CMPN'} {s.year ? `• ${s.year}` : ''}
                      </span>
                    </td>
                    <td style={{ padding: '16px 18px', color: '#777585', fontSize: '12px' }}>
                      {s.lastLoginAt
                        ? new Date(s.lastLoginAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Active Session'}
                    </td>
                    <td style={{ padding: '16px 18px' }}>
                      {isActive ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#DCFCE7',
                          color: '#14532D',
                          border: '1px solid rgba(21, 128, 61, 0.3)',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                        }}>
                          <ShieldCheck size={13} />
                          AUTHORIZED
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#FEE2E2',
                          color: '#7F1D1D',
                          border: '1px solid rgba(220, 38, 38, 0.3)',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                        }}>
                          <ShieldAlert size={13} />
                          REVOKED
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleToggle(s)}
                        disabled={isToggling}
                        style={{
                          backgroundColor: isActive ? '#FEE2E2' : '#DCFCE7',
                          border: `1px solid ${isActive ? 'rgba(220, 38, 38, 0.3)' : 'rgba(21, 128, 61, 0.3)'}`,
                          color: isActive ? '#7F1D1D' : '#14532D',
                          padding: '7px 16px',
                          borderRadius: '9999px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: isToggling ? 'not-allowed' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isActive ? (
                          <>
                            <UserX size={13} />
                            {isToggling ? 'Revoking...' : 'Revoke Access'}
                          </>
                        ) : (
                          <>
                            <UserCheck size={13} />
                            {isToggling ? 'Restoring...' : 'Restore Access'}
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
