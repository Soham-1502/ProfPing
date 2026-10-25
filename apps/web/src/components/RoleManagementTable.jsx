'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { DEPARTMENTS } from '@profping/shared';
import { ShieldAlert, Trash2, AlertCircle, RefreshCw, CheckCircle2, UserPlus, Clock } from 'lucide-react';

export default function RoleManagementTable() {
  const { user, role } = useAuth();
  const [hods, setHods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form State: Add HOD (above the list)
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [deptInput, setDeptInput] = useState('CMPN');
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Modal State: Delete Confirmation
  const [hodToDelete, setHodToDelete] = useState(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  const fetchHods = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/roles');
      const data = await res.json();
      if (data.success && Array.isArray(data.hods)) {
        setHods(data.hods);
      } else {
        setError(data.error || 'Failed to load department HODs.');
      }
    } catch (err) {
      setError('Network error connecting to role assignment server endpoint.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHods();
  }, []);

  // Submit Handler: Add HOD
  const handleAddHOD = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const email = emailInput.trim().toLowerCase();
    const name = nameInput.trim();
    const department = deptInput.trim().toUpperCase();

    // 1. Client-side Domain Validation
    if (!email.endsWith('@sfit.ac.in')) {
      setError('Email must be an institutional college email ending with @sfit.ac.in.');
      return;
    }

    // 2. Client-side One HOD per Department Rule Check
    const existing = hods.find((h) => h.department === department);
    if (existing) {
      setError(`Department ${department} already has an assigned HOD (${existing.name}). Please delete the current HOD first before adding a new one.`);
      return;
    }

    setSubmittingAdd(true);
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_hod',
          name,
          email,
          department,
          callerEmail: user?.email,
          callerRole: role,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to add HOD.');
      }

      setSuccessMsg(result.message || `Successfully pre-approved ${name} as HOD of ${department}.`);
      setNameInput('');
      setEmailInput('');
      await fetchHods();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Submit Handler: Delete HOD
  const handleConfirmDelete = async () => {
    if (!hodToDelete) return;
    setSubmittingDelete(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_hod',
          targetUid: hodToDelete.uid,
          callerEmail: user?.email,
          callerRole: role,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to remove HOD.');
      }

      setSuccessMsg(result.message || `Removed ${hodToDelete.name} as HOD. Faculty records remain untouched.`);
      setHodToDelete(null);
      await fetchHods();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingDelete(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '24px', marginBottom: '36px' }}>
      {/* 1. Add HOD Form (Above the List) */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #C8C5D3',
        boxShadow: '0 4px 20px -2px rgba(25, 13, 74, 0.04)',
        padding: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#E0D8FD',
            color: '#190D4A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <UserPlus size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#1A191F' }}>
              Add Department Head (HOD)
            </h3>
            <p style={{ fontSize: '12.5px', color: '#4B4757', margin: '2px 0 0' }}>
              Pre-approves an HOD. The role and department scope are assigned automatically on their first Google sign-in.
            </p>
          </div>
        </div>

        <form onSubmit={handleAddHOD} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr)) auto',
          gap: '14px',
          alignItems: 'end',
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4B4757', marginBottom: '6px' }}>
              HOD Full Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Kavita Sonawane"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #C8C5D3',
                backgroundColor: '#F4F2FA',
                fontSize: '13px',
                color: '#1A191F',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4B4757', marginBottom: '6px' }}>
              College Email (@sfit.ac.in)
            </label>
            <input
              type="email"
              required
              placeholder="e.g. hod.cmpn@sfit.ac.in"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #C8C5D3',
                backgroundColor: '#F4F2FA',
                fontSize: '13px',
                color: '#1A191F',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4B4757', marginBottom: '6px' }}>
              Academic Department
            </label>
            <select
              value={deptInput}
              onChange={(e) => setDeptInput(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid #C8C5D3',
                backgroundColor: '#F4F2FA',
                fontSize: '13px',
                fontWeight: 600,
                color: '#1A191F',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.id} — {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <button
              type="submit"
              disabled={submittingAdd}
              style={{
                backgroundColor: '#492FB1',
                border: 'none',
                color: '#FFFFFF',
                padding: '10px 22px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(73, 47, 177, 0.25)',
                whiteSpace: 'nowrap',
              }}
            >
              <UserPlus size={15} />
              {submittingAdd ? 'Adding...' : 'Add HOD'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '12px', fontSize: '11.5px', color: '#777585' }}>
          * <strong>Rule:</strong> One HOD per department. If the department already has an HOD, delete the current HOD first.
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#FEE2E2',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          borderRadius: '10px',
          color: '#7F1D1D',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: '#DCFCE7',
          border: '1px solid rgba(21, 128, 61, 0.3)',
          borderRadius: '10px',
          color: '#14532D',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. Department HODs Table (HODs only, one row per HOD) */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #C8C5D3',
        boxShadow: '0 4px 20px -2px rgba(25, 13, 74, 0.04)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #E9E7F1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#1A191F', margin: 0 }}>
              Department Head (HOD) Appointments ({hods.length})
            </h3>
            <p style={{ fontSize: '12.5px', color: '#4B4757', margin: '2px 0 0' }}>
              One active or pending HOD per academic department.
            </p>
          </div>

          <button
            onClick={fetchHods}
            disabled={loading}
            style={{
              backgroundColor: '#F4F2FA',
              border: '1px solid #C8C5D3',
              color: '#1A191F',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#EFECF6', borderBottom: '1px solid #C8C5D3' }}>
                <th style={{ padding: '14px 24px', color: '#4B4757', fontWeight: 700, letterSpacing: '0.4px', fontSize: '11.5px' }}>NAME</th>
                <th style={{ padding: '14px 20px', color: '#4B4757', fontWeight: 700, letterSpacing: '0.4px', fontSize: '11.5px' }}>COLLEGE EMAIL</th>
                <th style={{ padding: '14px 16px', color: '#4B4757', fontWeight: 700, letterSpacing: '0.4px', fontSize: '11.5px' }}>DEPARTMENT</th>
                <th style={{ padding: '14px 16px', color: '#4B4757', fontWeight: 700, letterSpacing: '0.4px', fontSize: '11.5px' }}>STATUS</th>
                <th style={{ padding: '14px 24px', color: '#4B4757', fontWeight: 700, letterSpacing: '0.4px', fontSize: '11.5px', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: '#777585' }}>
                    Loading HOD appointments...
                  </td>
                </tr>
              ) : hods.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '40px 24px', textAlign: 'center', color: '#777585' }}>
                    No Department HODs assigned. Use the form above to appoint an HOD.
                  </td>
                </tr>
              ) : (
                hods.map((h) => {
                  const isPending = h.status === 'Pending';

                  return (
                    <tr
                      key={h.uid || h.email}
                      style={{
                        borderBottom: '1px solid #E9E7F1',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(73, 47, 177, 0.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      {/* Name */}
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            backgroundColor: '#E0D8FD',
                            color: '#190D4A',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '12px',
                          }}>
                            {(h.name || h.email).slice(0, 2).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 700, color: '#1A191F' }}>
                            {h.name}
                          </span>
                        </div>
                      </td>

                      {/* College Email */}
                      <td style={{ padding: '16px 20px', color: '#4B4757' }}>
                        {h.email}
                      </td>

                      {/* Department */}
                      <td style={{ padding: '16px 16px' }}>
                        <span style={{
                          backgroundColor: '#E0D8FD',
                          color: '#190D4A',
                          border: '1px solid rgba(73, 47, 177, 0.25)',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '11.5px',
                          fontWeight: 800,
                        }}>
                          {h.department}
                        </span>
                      </td>

                      {/* Status: Pending or Active */}
                      <td style={{ padding: '16px 16px' }}>
                        {isPending ? (
                          <span style={{
                            backgroundColor: '#FEF3C7',
                            color: '#92400E',
                            border: '1px solid rgba(180, 83, 9, 0.25)',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}>
                            <Clock size={11} />
                            Pending (Awaiting First Sign-in)
                          </span>
                        ) : (
                          <span style={{
                            backgroundColor: '#DCFCE7',
                            color: '#14532D',
                            border: '1px solid rgba(21, 128, 61, 0.25)',
                            padding: '3px 10px',
                            borderRadius: '9999px',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}>
                            <CheckCircle2 size={11} />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Action: Delete */}
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setHodToDelete(h);
                            setError(null);
                            setSuccessMsg(null);
                          }}
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #BA1A1A',
                            color: '#BA1A1A',
                            padding: '6px 14px',
                            borderRadius: '9999px',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            transition: 'all 0.15s ease',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
                        >
                          <Trash2 size={13} />
                          Delete
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

      {/* Delete Confirmation Modal */}
      {hodToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(25, 13, 74, 0.45)',
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
            border: '1px solid #C8C5D3',
            maxWidth: '480px',
            width: '100%',
            padding: '28px',
            boxShadow: '0 20px 40px -8px rgba(25, 13, 74, 0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#FEE2E2',
                color: '#BA1A1A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ShieldAlert size={20} />
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#1A191F' }}>
                Remove Department HOD
              </h4>
            </div>

            <p style={{ fontSize: '13.5px', color: '#1A191F', lineHeight: '1.5', margin: '0 0 16px' }}>
              Remove <strong>{hodToDelete.name}</strong> as HOD of <strong>{hodToDelete.department}</strong>?
            </p>

            <div style={{
              backgroundColor: '#FAF8FE',
              border: '1px solid #EFECF6',
              borderRadius: '8px',
              padding: '12px 14px',
              fontSize: '12.5px',
              color: '#4B4757',
              marginBottom: '20px',
              lineHeight: '1.45',
            }}>
              • They will lose access to the HOD portal and their server session will be revoked.<br />
              • Faculty they added, live statuses, and desk-hour logs <strong>stay in the system untouched</strong>.<br />
              • The department will show no HOD assigned, allowing you to add a new one.
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setHodToDelete(null)}
                disabled={submittingDelete}
                style={{
                  padding: '9px 18px',
                  borderRadius: '9999px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #C8C5D3',
                  color: '#4B4757',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={submittingDelete}
                style={{
                  padding: '9px 20px',
                  borderRadius: '9999px',
                  backgroundColor: '#BA1A1A',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(186, 26, 26, 0.25)',
                }}
              >
                {submittingDelete ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
