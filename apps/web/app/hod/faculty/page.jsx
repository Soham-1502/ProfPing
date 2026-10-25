'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../src/hooks/useAuth';
import {
  subscribeToDepartmentFaculty,
  addFacultyMember,
  updateFacultyMember,
  deleteFacultyMember,
} from '../../../src/lib/hodService';
import { Plus, Edit2, Trash2, Lock, Search, CheckCircle2, X } from 'lucide-react';
import { INSTITUTION } from '@profping/shared';

export default function FacultyDirectoryPage() {
  const { department } = useAuth();
  const effectiveDept = department || 'CMPN';

  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formFacultyId, setFormFacultyId] = useState('');
  const [formCabin, setFormCabin] = useState('');
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
      setFormError('Please fill in all required institutional fields.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formName.trim(),
        email: trimmedEmail,
        facultyId: formFacultyId.trim().toUpperCase(),
        cabin: formCabin.trim(),
        intercom: formIntercom.trim() || 'Ext. N/A',
        designation: formDesignation,
        officeHours: formOfficeHours.trim(),
        department: effectiveDept,
      };

      if (editingFaculty) {
        await updateFacultyMember(editingFaculty.uid, payload);
        setActionSuccess(`Faculty member "${payload.name}" updated successfully.`);
      } else {
        await addFacultyMember(payload);
        setActionSuccess(`New faculty "${payload.name}" provisioned. Locked institutional data is active.`);
      }

      setModalOpen(false);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      console.error('Save faculty error:', err);
      setFormError(err.message || 'Failed to save faculty record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (f) => {
    if (confirm(`Are you sure you want to remove ${f.name} from the department directory? This will revoke their faculty permissions.`)) {
      try {
        await deleteFacultyMember(f.uid);
        setActionSuccess(`Faculty member "${f.name}" removed.`);
        setTimeout(() => setActionSuccess(''), 4000);
      } catch (err) {
        alert('Failed to delete faculty: ' + err.message);
      }
    }
  };

  const filteredFaculty = faculty.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      (f.name || '').toLowerCase().includes(q) ||
      (f.email || '').toLowerCase().includes(q) ||
      (f.cabin || '').toLowerCase().includes(q) ||
      (f.facultyId || '').toLowerCase().includes(q)
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
            Provision professors and lock official institutional records (Name, Cabin, ID)
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
            transition: 'background-color 0.2s',
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
          Official Name, Cabin Assignment, Faculty ID, and Department configured here are synchronized as read-only on the faculty mobile application. Professors cannot alter these fields without HOD administrative authorization.
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
          placeholder="Search by faculty name, official email, cabin number, or faculty ID..."
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

      {/* Faculty Table */}
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
                <th style={{ padding: '14px 20px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px' }}>FACULTY NAME</th>
                <th style={{ padding: '14px 18px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px' }}>OFFICIAL EMAIL</th>
                <th style={{ padding: '14px 18px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px' }}>FACULTY ID</th>
                <th style={{ padding: '14px 18px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px' }}>CABIN LOCATION</th>
                <th style={{ padding: '14px 18px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px' }}>INTERCOM</th>
                <th style={{ padding: '14px 18px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px' }}>OFFICE HOURS</th>
                <th style={{ padding: '14px 20px', color: '#4B4757', fontWeight: 700, fontSize: '11.5px', letterSpacing: '0.4px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculty.map((f, idx) => (
                <tr
                  key={f.uid || idx}
                  style={{
                    borderBottom: '1px solid #E9E7F1',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(73, 47, 177, 0.02)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 700, color: '#1A191F' }}>{f.name}</div>
                    <div style={{ fontSize: '11.5px', color: '#492FB1', fontWeight: 600 }}>{f.designation || 'Faculty'}</div>
                  </td>
                  <td style={{ padding: '16px 18px', color: '#4B4757', fontFamily: 'monospace', fontSize: '12px' }}>
                    {f.email}
                  </td>
                  <td style={{ padding: '16px 18px' }}>
                    <span style={{
                      backgroundColor: '#F4F2FA',
                      color: '#1A191F',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      border: '1px solid #C8C5D3',
                    }}>
                      {f.facultyId || 'UNASSIGNED'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 18px', color: '#1A191F', fontWeight: 600 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Lock size={12} color="#777585" />
                      {f.cabin || 'Cabin Not Assigned'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 18px', color: '#4B4757' }}>
                    {f.intercom || 'N/A'}
                  </td>
                  <td style={{ padding: '16px 18px', color: '#4B4757', fontSize: '12px' }}>
                    {f.officeHours || '10:00 AM - 12:00 PM'}
                  </td>
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
                          fontWeight: 600,
                        }}
                      >
                        <Edit2 size={13} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(f)}
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
                          fontWeight: 600,
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Faculty Modal */}
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
            maxWidth: '540px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            border: '1px solid #C8C5D3',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 25px 50px -12px rgba(25, 13, 74, 0.25)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#1A191F' }}>
                  {editingFaculty ? 'Edit Faculty Institutional Profile' : 'Onboard New Faculty Member'}
                </h3>
                <span style={{ fontSize: '12px', color: '#4B4757' }}>
                  Data configured here is locked and transmitted directly to the faculty mobile app
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
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#4B4757', marginBottom: '4px' }}>
                    FULL NAME (LOCKED) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Anjali Mehta"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
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
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#4B4757', marginBottom: '4px' }}>
                    OFFICIAL EMAIL *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder={`name${INSTITUTION.EMAIL_DOMAIN}`}
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    disabled={!!editingFaculty}
                    style={{
                      width: '100%',
                      backgroundColor: editingFaculty ? '#EFECF6' : '#F4F2FA',
                      border: '1px solid #C8C5D3',
                      borderRadius: '10px',
                      padding: '9px 12px',
                      color: editingFaculty ? '#777585' : '#1A191F',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#4B4757', marginBottom: '4px' }}>
                    FACULTY ID (LOCKED) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={`SFIT-${effectiveDept}-012`}
                    value={formFacultyId}
                    onChange={(e) => setFormFacultyId(e.target.value)}
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
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#4B4757', marginBottom: '4px' }}>
                    DESIGNATION
                  </label>
                  <select
                    value={formDesignation}
                    onChange={(e) => setFormDesignation(e.target.value)}
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
                  >
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                    <option value="Dean">Dean</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#4B4757', marginBottom: '4px' }}>
                    CABIN LOCATION (LOCKED) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Room 302, 3rd Floor"
                    value={formCabin}
                    onChange={(e) => setFormCabin(e.target.value)}
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
                  <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#4B4757', marginBottom: '4px' }}>
                    INTERCOM EXTENSION
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ext. 3024"
                    value={formIntercom}
                    onChange={(e) => setFormIntercom(e.target.value)}
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

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#4B4757', marginBottom: '4px' }}>
                  DEFAULT OFFICE HOURS
                </label>
                <input
                  type="text"
                  placeholder="e.g. 10:00 AM - 12:00 PM"
                  value={formOfficeHours}
                  onChange={(e) => setFormOfficeHours(e.target.value)}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    backgroundColor: '#492FB1',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    padding: '9px 22px',
                    borderRadius: '9999px',
                    fontSize: '13px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(73, 47, 177, 0.2)',
                  }}
                >
                  {submitting ? 'Saving...' : editingFaculty ? 'Save Locked Changes' : 'Provision Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
