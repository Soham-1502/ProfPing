'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import {
  subscribeToDepartmentFaculty,
  addFacultyMember,
  updateFacultyMember,
  deleteFacultyMember,
} from '../../../src/lib/hodService';
import { Plus, Edit2, Trash2, Lock, Search, CheckCircle2, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import { INSTITUTION } from '@profping/shared';

export default function FacultyDirectoryPage() {
  const { user, department } = useAuth();
  const effectiveDept = (department || 'CMPN').toUpperCase();

  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');
  const [facultyToDelete, setFacultyToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form State (Section 6: name, email, faculty ID, designation, cabin, floor, wing, intercom, office hours)
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formFacultyId, setFormFacultyId] = useState('');
  const [formCabin, setFormCabin] = useState('');
  const [formFloor, setFormFloor] = useState('3rd Floor');
  const [formWing, setFormWing] = useState('Main Wing');
  const [formIntercom, setFormIntercom] = useState('');
  const [formDesignation, setFormDesignation] = useState('Assistant Professor');
  const [formOfficeHours, setFormOfficeHours] = useState('10:00 AM - 12:00 PM');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToDepartmentFaculty(effectiveDept, (list) => {
      setFaculty(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [effectiveDept]);

  const openAddModal = () => {
    setEditingFaculty(null);
    setFormName('');
    setFormEmail('');
    setFormFacultyId(`SFIT-${effectiveDept}-`);
    setFormCabin('');
    setFormFloor('3rd Floor');
    setFormWing('Main Wing');
    setFormIntercom('');
    setFormDesignation('Assistant Professor');
    setFormOfficeHours('10:00 AM - 12:00 PM');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (f) => {
    setEditingFaculty(f);
    setFormName(f.name || '');
    setFormEmail(f.email || '');
    setFormFacultyId(f.facultyId || `SFIT-${effectiveDept}-`);
    setFormCabin(f.cabin || '');
    setFormFloor(f.floor || '3rd Floor');
    setFormWing(f.wing || 'Main Wing');
    setFormIntercom(f.intercom || '');
    setFormDesignation(f.designation || 'Assistant Professor');
    setFormOfficeHours(f.officeHours || '10:00 AM - 12:00 PM');
    setFormError('');
    setModalOpen(true);
  };

  const handleSaveFaculty = async (e) => {
    e.preventDefault();
    setFormError('');

    const trimmedEmail = formEmail.trim().toLowerCase();
    if (!trimmedEmail.endsWith(INSTITUTION.EMAIL_DOMAIN)) {
      setFormError(`Official email must end with ${INSTITUTION.EMAIL_DOMAIN}`);
      return;
    }

    if (!formName.trim() || !formCabin.trim() || !formFacultyId.trim()) {
      setFormError('Please fill in all required institutional fields (Name, Faculty ID, Cabin).');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        email: trimmedEmail,
        facultyId: formFacultyId.trim().toUpperCase(),
        cabin: formCabin.trim(),
        floor: formFloor.trim(),
        wing: formWing.trim(),
        intercom: formIntercom.trim() || 'Ext. N/A',
        designation: formDesignation,
        officeHours: formOfficeHours.trim(),
        department: effectiveDept,
      };

      const callerMeta = {
        email: user?.email,
        role: 'hod',
        department: effectiveDept,
      };

      if (editingFaculty) {
        await updateFacultyMember(editingFaculty.uid, payload, callerMeta);
        setActionSuccess(`Faculty member "${payload.name}" updated successfully.`);
      } else {
        await addFacultyMember(payload, callerMeta);
        setActionSuccess(`New faculty "${payload.name}" provisioned. Locked institutional data is active.`);
      }

      setModalOpen(false);
      setTimeout(() => setActionSuccess(''), 4500);
    } catch (err) {
      console.error('Save faculty error:', err);
      setFormError(err.message || 'Failed to save faculty record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!facultyToDelete) return;
    setDeleting(true);
    try {
      const callerMeta = {
        email: user?.email,
        role: 'hod',
        department: effectiveDept,
      };

      await deleteFacultyMember(facultyToDelete.uid, facultyToDelete.email, callerMeta);
      setActionSuccess(`Faculty member "${facultyToDelete.name}" removed. Active sessions were revoked and logs preserved.`);
      setFacultyToDelete(null);
      setTimeout(() => setActionSuccess(''), 4500);
    } catch (err) {
      alert('Failed to delete faculty member: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredFaculty = faculty.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      (f.name || '').toLowerCase().includes(q) ||
      (f.email || '').toLowerCase().includes(q) ||
      (f.cabin || '').toLowerCase().includes(q) ||
      (f.facultyId || '').toLowerCase().includes(q) ||
      (f.designation || '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Page Title & Add Button Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#1A191F' }}>
            Faculty Directory Manager ({effectiveDept})
          </h2>
          <p style={{ fontSize: '13px', color: '#4B4757', margin: '4px 0 0 0' }}>
            Provision professors and lock official institutional records (Name, ID, Cabin, Floor, Wing, Office Hours)
          </p>
        </div>

        <button
          onClick={openAddModal}
          style={{
            backgroundColor: '#492FB1',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '13px',
            padding: '10px 20px',
            borderRadius: '9999px',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(73, 47, 177, 0.2)',
          }}
        >
          <Plus size={16} />
          Add Faculty Member
        </button>
      </div>

      {/* Success Banner */}
      {actionSuccess && (
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
          {actionSuccess}
        </div>
      )}

      {/* Institutional Security Notice */}
      <div style={{
        backgroundColor: '#E0D8FD',
        border: '1px solid rgba(73, 47, 177, 0.25)',
        borderRadius: '14px',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}>
        <Lock size={18} color="#492FB1" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div style={{ fontSize: '13px', color: '#190D4A', lineHeight: '1.5' }}>
          <strong>Institutional Integrity Lock: </strong>
          Official Name, Faculty ID, Cabin, Floor, Wing, and Department configured here are synchronized as read-only on the faculty and HOD mobile apps. Professors cannot alter these fields without HOD administrative authorization.
        </div>
      </div>

      {/* Search Bar */}
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
          placeholder="Search by faculty name, official email, cabin room, or faculty ID..."
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

      {/* Faculty Table (Section 6: List with Pending/Active status, Edit and Remove) */}
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
                <th style={{ padding: '14px 20px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px' }}>FACULTY MEMBER</th>
                <th style={{ padding: '14px 18px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px' }}>FACULTY ID</th>
                <th style={{ padding: '14px 18px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px' }}>CABIN & LOCATION</th>
                <th style={{ padding: '14px 18px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px' }}>INTERCOM</th>
                <th style={{ padding: '14px 18px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px' }}>OFFICE HOURS</th>
                <th style={{ padding: '14px 18px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px' }}>STATUS</th>
                <th style={{ padding: '14px 20px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculty.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#64748B' }}>
                    {faculty.length === 0
                      ? `No faculty members provisioned in ${effectiveDept} Department yet. Click "Add Faculty Member" above to onboard your department roster.`
                      : 'No faculty members match your search query.'}
                  </td>
                </tr>
              ) : (
                filteredFaculty.map((f, idx) => {
                  const isActive = Boolean(f.hasSignedIn || f.claimedAt || f.status?.updatedAt);

                  return (
                    <tr
                      key={f.uid || idx}
                      style={{
                        borderBottom: '1px solid #E9E7F1',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(73, 47, 177, 0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Name & Email */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 700, color: '#1A191F' }}>{f.name}</div>
                        <div style={{ fontSize: '11.5px', color: '#492FB1', fontWeight: 600 }}>{f.designation || 'Faculty'}</div>
                        <div style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace', marginTop: '2px' }}>
                          {f.email}
                        </div>
                      </td>

                      {/* Faculty ID */}
                      <td style={{ padding: '16px 18px' }}>
                        <span style={{
                          backgroundColor: '#F4F2FA',
                          color: '#1A191F',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          border: '1px solid #C8C5D3',
                        }}>
                          {f.facultyId || 'UNASSIGNED'}
                        </span>
                      </td>

                      {/* Cabin, Floor, Wing */}
                      <td style={{ padding: '16px 18px', color: '#1A191F' }}>
                        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Lock size={12} color="#777585" />
                          {f.cabin || 'Cabin Not Set'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                          {f.floor || '3rd Floor'} • {f.wing || 'Main Wing'}
                        </div>
                      </td>

                      {/* Intercom */}
                      <td style={{ padding: '16px 18px', color: '#4B4757', fontWeight: 500 }}>
                        {f.intercom || 'N/A'}
                      </td>

                      {/* Office Hours */}
                      <td style={{ padding: '16px 18px', color: '#4B4757', fontSize: '12px' }}>
                        {f.officeHours || '10:00 AM - 12:00 PM'}
                      </td>

                      {/* Status: Active vs Pending (Section 6) */}
                      <td style={{ padding: '16px 18px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 10px',
                          borderRadius: '9999px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: isActive ? '#DCFCE7' : '#FEF3C7',
                          color: isActive ? '#14532D' : '#78350F',
                          border: `1px solid ${isActive ? 'rgba(21, 128, 61, 0.3)' : 'rgba(180, 83, 9, 0.3)'}`,
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isActive ? '#15803D' : '#D97706' }} />
                          {isActive ? 'Active' : 'Pending Claim'}
                        </span>
                      </td>

                      {/* Actions: Edit and Remove (Section 6) */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => openEditModal(f)}
                            title="Edit faculty locked data"
                            style={{
                              backgroundColor: '#E0D8FD',
                              border: '1px solid rgba(73, 47, 177, 0.25)',
                              color: '#190D4A',
                              padding: '6px 12px',
                              borderRadius: '9999px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          >
                            <Edit2 size={13} />
                            Edit
                          </button>
                          <button
                            onClick={() => setFacultyToDelete(f)}
                            title="Remove from directory"
                            style={{
                              backgroundColor: '#FEE2E2',
                              border: '1px solid rgba(220, 38, 38, 0.25)',
                              color: '#7F1D1D',
                              padding: '6px 12px',
                              borderRadius: '9999px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          >
                            <Trash2 size={13} />
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Add / Edit Faculty Modal (Section 6 Fields) ── */}
      {modalOpen && (
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
          zIndex: 100,
          padding: '20px',
        }}>
          <div style={{
            maxWidth: '580px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            border: '1px solid #C8C5D3',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(25, 13, 74, 0.25)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#1A191F' }}>
                  {editingFaculty ? 'Edit Faculty Institutional Profile' : 'Onboard New Faculty Member'}
                </h3>
                <span style={{ fontSize: '12px', color: '#4B4757' }}>
                  Department is locked to <strong>{effectiveDept}</strong>. Data configured here is locked and read-only in the app.
                </span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#777585', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{
                backgroundColor: '#FEE2E2',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#7F1D1D',
                fontSize: '12.5px',
                marginBottom: '16px',
              }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveFaculty}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                {/* Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4B4757', marginBottom: '4px' }}>
                    FULL NAME *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Kavita Sonawane"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #C8C5D3',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4B4757', marginBottom: '4px' }}>
                    OFFICIAL COLLEGE EMAIL (@sfit.ac.in) *
                  </label>
                  <input
                    type="email"
                    required
                    disabled={!!editingFaculty}
                    placeholder="e.g. kavita.s@sfit.ac.in"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #C8C5D3',
                      fontSize: '13px',
                      backgroundColor: editingFaculty ? '#F4F2FA' : '#FFFFFF',
                      boxSizing: 'border-box',
                      color: editingFaculty ? '#64748B' : '#1A191F',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                {/* Faculty ID */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4B4757', marginBottom: '4px' }}>
                    FACULTY ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={`e.g. SFIT-${effectiveDept}-101`}
                    value={formFacultyId}
                    onChange={(e) => setFormFacultyId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #C8C5D3',
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Designation */}
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4B4757', marginBottom: '4px' }}>
                    DESIGNATION
                  </label>
                  <select
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #C8C5D3',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                    <option value="Professor & HOD">Professor & HOD</option>
                    <option value="Adjunct Faculty">Adjunct Faculty</option>
                    <option value="Visiting Lecturer">Visiting Lecturer</option>
                  </select>
                </div>
              </div>

              {/* Location: Cabin, Floor, Wing */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4B4757', marginBottom: '4px' }}>
                    CABIN / ROOM *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 304"
                    value={formCabin}
                    onChange={(e) => setFormCabin(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #C8C5D3',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4B4757', marginBottom: '4px' }}>
                    FLOOR
                  </label>
                  <select
                    value={formFloor}
                    onChange={(e) => setFormFloor(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #C8C5D3',
                      fontSize: '13px',
                      backgroundColor: '#FFFFFF',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Ground Floor">Ground Floor</option>
                    <option value="1st Floor">1st Floor</option>
                    <option value="2nd Floor">2nd Floor</option>
                    <option value="3rd Floor">3rd Floor</option>
                    <option value="4th Floor">4th Floor</option>
                    <option value="5th Floor">5th Floor</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4B4757', marginBottom: '4px' }}>
                    WING
                  </label>
                  <select
                    value={formWing}
                    onChange={(e) => setFormWing(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #C8C5D3',
                      fontSize: '13px',
                      backgroundColor: '#FFFFFF',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Main Wing">Main Wing</option>
                    <option value="A-Wing">A-Wing</option>
                    <option value="B-Wing">B-Wing</option>
                    <option value="C-Wing">C-Wing</option>
                  </select>
                </div>
              </div>

              {/* Intercom & Office Hours */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4B4757', marginBottom: '4px' }}>
                    CABIN INTERCOM
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ext. 402"
                    value={formIntercom}
                    onChange={(e) => setFormIntercom(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #C8C5D3',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4B4757', marginBottom: '4px' }}>
                    OFFICIAL OFFICE / DOUBT HOURS
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM - 12:00 PM"
                    value={formOfficeHours}
                    onChange={(e) => setFormOfficeHours(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #C8C5D3',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Department Fixed Badge */}
              <div style={{
                backgroundColor: '#F4F2FA',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid #E2E8F0',
              }}>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>ASSIGNED DEPARTMENT</span>
                <span style={{
                  backgroundColor: '#E0D8FD',
                  color: '#190D4A',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                }}>
                  {effectiveDept} (FIXED BY HOD GOVERNANCE)
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #C8C5D3',
                    padding: '9px 16px',
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
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: '#492FB1',
                    border: 'none',
                    padding: '9px 20px',
                    borderRadius: '9999px',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(73, 47, 177, 0.25)',
                  }}
                >
                  {submitting ? 'Saving...' : editingFaculty ? 'Update Record' : 'Provision Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal: Remove Faculty (Section 6) ── */}
      {facultyToDelete && (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} color="#DC2626" />
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: '#1A191F' }}>
                Remove Faculty Member?
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: '#4B4757', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              Are you sure you want to remove <strong>{facultyToDelete.name}</strong> ({facultyToDelete.email}) from the {effectiveDept} faculty directory?
            </p>

            <div style={{
              backgroundColor: '#FEF3C7',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '20px',
              fontSize: '12px',
              color: '#92400E',
              lineHeight: '1.4',
            }}>
              <strong>Section 6 Integrity Rule:</strong> This action deletes their faculty profile and revokes all active mobile sessions. Their historical broadcast attendance logs will be preserved.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setFacultyToDelete(null)}
                disabled={deleting}
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
                onClick={handleConfirmDelete}
                disabled={deleting}
                style={{
                  backgroundColor: '#DC2626',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '9999px',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                }}
              >
                {deleting ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
