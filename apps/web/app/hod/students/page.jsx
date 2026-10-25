'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import { subscribeToStudents, toggleStudentAccess } from '../../../src/lib/hodService';
import { ShieldCheck, ShieldAlert, Search, AlertOctagon, CheckCircle2, UserX, UserCheck, Info } from 'lucide-react';

export default function StudentAccessControlPage() {
  const { department } = useAuth();
  const effectiveDept = (department || 'CMPN').toUpperCase();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [studentToToggle, setStudentToToggle] = useState(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Realtime subscription scoped to students whose self-declared department matches effectiveDept
    const unsubscribe = subscribeToStudents(effectiveDept, (list) => {
      setStudents(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [effectiveDept]);

  const handleConfirmToggle = async () => {
    if (!studentToToggle) return;
    setToggling(true);
    try {
      const isCurrentlyActive = studentToToggle.is_active !== false && !studentToToggle.revoked;
      const newStatus = await toggleStudentAccess(studentToToggle.uid, isCurrentlyActive);
      const msg = newStatus
        ? `Access restored for ${studentToToggle.name || studentToToggle.email}. Student can now access the mobile app.`
        : `Kill Switch engaged: Access revoked for ${studentToToggle.name || studentToToggle.email}. Mobile app will immediately lock and sign out.`;
      setToastMessage(msg);
      setStudentToToggle(null);
      setTimeout(() => setToastMessage(''), 5000);
    } catch (err) {
      alert('Failed to toggle student access: ' + err.message);
    } finally {
      setToggling(false);
    }
  };

  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Never';
    const num = typeof timestamp === 'number' ? timestamp : Date.parse(timestamp);
    if (!num || isNaN(num)) return 'Recently';

    const diff = Math.floor((Date.now() - num) / 60000);
    if (diff <= 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const diffHrs = Math.floor(diff / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(num).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return students;
    return students.filter((s) => {
      return (
        (s.name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.rollNo || '').toLowerCase().includes(q)
      );
    });
  }, [students, searchQuery]);

  const stats = useMemo(() => {
    let active = 0;
    let revoked = 0;
    students.forEach((s) => {
      if (s.is_active !== false && !s.revoked) active++;
      else revoked++;
    });
    return { total: students.length, active, revoked };
  }, [students]);

  return (
    <div>
      {/* Title & Description */}
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#1A191F' }}>
          Student Access Control — Dept. of {effectiveDept}
        </h2>
        <p style={{ fontSize: '13px', color: '#4B4757', margin: '4px 0 0 0' }}>
          Real-time governance of students with self-declared membership in {effectiveDept} Department
        </p>
      </div>

      {/* Section 6 Mandatory Note: Department is Self-Declared */}
      <div style={{
        backgroundColor: '#E0D8FD',
        border: '1px solid rgba(73, 47, 177, 0.25)',
        borderRadius: '14px',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}>
        <Info size={18} color="#492FB1" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '13px', color: '#190D4A', lineHeight: '1.5' }}>
          <strong>Self-Declared Department Membership: </strong>
          Students self-declare their department during their first mobile sign-in. There is no manual add-student action here; institutional student accounts are auto-provisioned upon Google OAuth verification. HODs can audit activity and engage individual kill switches.
        </div>
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
          {toastMessage.includes('revoked') ? <AlertOctagon size={16} /> : <CheckCircle2 size={16} />}
          {toastMessage}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px -2px rgba(25, 13, 74, 0.04)',
        }}>
          <span style={{ fontSize: '12px', color: '#4B4757', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            {effectiveDept} Students
          </span>
          <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '6px', color: '#1A191F' }}>
            {stats.total}
          </div>
          <span style={{ fontSize: '12px', color: '#492FB1', fontWeight: 600 }}>Self-declared department roster</span>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(21, 128, 61, 0.3)',
          boxShadow: '0 4px 20px -2px rgba(21, 128, 61, 0.05)',
        }}>
          <span style={{ fontSize: '12px', color: '#15803D', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Active Student Access
          </span>
          <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '6px', color: '#15803D' }}>
            {stats.active}
          </div>
          <span style={{ fontSize: '12px', color: '#4B4757' }}>Authorized to view faculty live presence</span>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          boxShadow: '0 4px 20px -2px rgba(220, 38, 38, 0.05)',
        }}>
          <span style={{ fontSize: '12px', color: '#DC2626', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            Access Revoked (Kill Switch)
          </span>
          <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '6px', color: '#DC2626' }}>
            {stats.revoked}
          </div>
          <span style={{ fontSize: '12px', color: '#4B4757' }}>Locked out from mobile directory</span>
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
          placeholder={`Search ${effectiveDept} students by name or email...`}
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

      {/* Student Audit Table (Section 6: name, email, last seen, status, Revoke/Restore toggle) */}
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
                <th style={{ padding: '14px 20px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px' }}>STUDENT</th>
                <th style={{ padding: '14px 18px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px' }}>COLLEGE EMAIL</th>
                <th style={{ padding: '14px 18px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px' }}>DECLARED DEPT</th>
                <th style={{ padding: '14px 18px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px' }}>LAST SEEN</th>
                <th style={{ padding: '14px 18px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px' }}>STATUS</th>
                <th style={{ padding: '14px 20px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#64748B' }}>
                    {students.length === 0
                      ? `No students have declared ${effectiveDept} Department yet. Students are automatically listed here upon their first mobile sign-in.`
                      : 'No students match your search filter.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => {
                  const isActive = s.is_active !== false && !s.revoked;

                  return (
                    <tr
                      key={s.uid}
                      style={{
                        borderBottom: '1px solid #E9E7F1',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(73, 47, 177, 0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Name */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 700, color: '#1A191F' }}>{s.name || 'Student Member'}</div>
                        {s.rollNo && (
                          <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
                            Roll: {s.rollNo}
                          </div>
                        )}
                      </td>

                      {/* College Email */}
                      <td style={{ padding: '16px 18px', color: '#4B4757', fontFamily: 'monospace', fontSize: '12px' }}>
                        {s.email}
                      </td>

                      {/* Declared Department */}
                      <td style={{ padding: '16px 18px' }}>
                        <span style={{
                          backgroundColor: '#E0D8FD',
                          color: '#190D4A',
                          padding: '3px 9px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}>
                          {s.department || effectiveDept}
                        </span>
                      </td>

                      {/* Last Seen */}
                      <td style={{ padding: '16px 18px', color: '#64748B', fontSize: '12px' }}>
                        {formatLastSeen(s.lastSeen)}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 18px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          backgroundColor: isActive ? '#DCFCE7' : '#FEE2E2',
                          color: isActive ? '#14532D' : '#7F1D1D',
                          border: `1px solid ${isActive ? 'rgba(21, 128, 61, 0.3)' : 'rgba(220, 38, 38, 0.3)'}`,
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isActive ? '#15803D' : '#DC2626' }} />
                          {isActive ? 'Active Access' : 'Access Revoked'}
                        </span>
                      </td>

                      {/* Action: Revoke / Restore Toggle (Section 6) */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <button
                          onClick={() => setStudentToToggle(s)}
                          style={{
                            backgroundColor: isActive ? '#FFFFFF' : '#DCFCE7',
                            border: `1px solid ${isActive ? '#DC2626' : '#15803D'}`,
                            color: isActive ? '#DC2626' : '#14532D',
                            padding: '6px 14px',
                            borderRadius: '9999px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                          {isActive ? 'Revoke Access' : 'Restore Access'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Confirmation Modal: Revoke / Restore (Section 6) ── */}
      {studentToToggle && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(26, 25, 31, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 110,
          padding: '20px',
        }}>
          <div style={{
            maxWidth: '460px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            border: '1px solid #C8C5D3',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(25, 13, 74, 0.25)',
          }}>
            {studentToToggle.is_active !== false && !studentToToggle.revoked ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AlertOctagon size={20} color="#DC2626" />
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#1A191F' }}>
                    Revoke Student Access?
                  </h3>
                </div>

                <p style={{ fontSize: '13px', color: '#4B4757', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                  Are you sure you want to engage the kill-switch for <strong>{studentToToggle.name}</strong> ({studentToToggle.email})?
                </p>

                <div style={{
                  backgroundColor: '#FEE2E2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '20px',
                  fontSize: '12px',
                  color: '#991B1B',
                  lineHeight: '1.4',
                }}>
                  <strong>Immediate Effect:</strong> The student's mobile app will instantly display an "Access Revoked" dialog and log them out of the app.
                </div>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={20} color="#15803D" />
                  </div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#1A191F' }}>
                    Restore Student Access?
                  </h3>
                </div>

                <p style={{ fontSize: '13px', color: '#4B4757', lineHeight: '1.5', margin: '0 0 16px 0' }}>
                  Are you sure you want to restore mobile app access for <strong>{studentToToggle.name}</strong> ({studentToToggle.email})?
                </p>

                <div style={{
                  backgroundColor: '#DCFCE7',
                  border: '1px solid #BBF7D0',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  marginBottom: '20px',
                  fontSize: '12px',
                  color: '#14532D',
                  lineHeight: '1.4',
                }}>
                  <strong>Immediate Effect:</strong> The student will be allowed to log back into the ProfPing mobile app and view faculty live status.
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStudentToToggle(null)}
                disabled={toggling}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #C8C5D3',
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  color: '#4B4757',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmToggle}
                disabled={toggling}
                style={{
                  backgroundColor: studentToToggle.is_active !== false && !studentToToggle.revoked ? '#DC2626' : '#15803D',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '9999px',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: toggling ? 'not-allowed' : 'pointer',
                }}
              >
                {toggling ? 'Updating...' : studentToToggle.is_active !== false && !studentToToggle.revoked ? 'Confirm Revoke' : 'Confirm Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
