'use client';

import React, { useState, useEffect, useMemo } from 'react';
import RoleGuard from '../../src/components/RoleGuard';
import SignOutModal from '../../src/components/SignOutModal';
import { useAuth } from '../../src/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getScopedFaculty, enrichWithDeskHours } from '../../src/lib/dashboardService';
import { subscribeToDepartmentFaculty } from '../../src/lib/hodService';
import LiveStatusTable from '../../src/components/LiveStatusTable';
import DeskHourChart from '../../src/components/DeskHourChart';
import DepartmentComparisonChart from '../../src/components/DepartmentComparisonChart';
import RoleManagementTable from '../../src/components/RoleManagementTable';
import InstitutionSettingsManager from '../../src/components/InstitutionSettingsManager';
import { STATUS_KEYS, DEPARTMENTS } from '@profping/shared';
import { LogOut, LayoutDashboard, UserCheck, ShieldCheck, CheckCircle2, Clock, Sliders } from 'lucide-react';

export default function PrincipalDashboardPage() {
  const { user, logout } = useAuth();
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const router = useRouter();

  // Primary portal views: 'overview' | 'roles'
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [rawFaculty, setRawFaculty] = useState([]);

  useEffect(() => {
    // Live Firebase snapshot listener across all academic departments
    const unsubscribe = subscribeToDepartmentFaculty('ALL', (list) => {
      setRawFaculty(list);
    });
    return () => unsubscribe();
  }, []);

  // Campus-wide faculty list with live desk hours enrichment
  const allFaculty = useMemo(() => {
    if (rawFaculty && rawFaculty.length > 0) {
      return enrichWithDeskHours(rawFaculty);
    }
    return enrichWithDeskHours(getScopedFaculty(null));
  }, [rawFaculty]);

  // Filtered by department if selected
  const displayFaculty = useMemo(() => {
    if (selectedDept === 'ALL') return allFaculty;
    return allFaculty.filter((f) => f.department === selectedDept);
  }, [allFaculty, selectedDept]);

  // Campus Stats & Adoption Metrics
  const campusStats = useMemo(() => {
    let available = 0;
    let inLecture = 0;
    let targetMet = 0;
    let updatedTodayCount = 0;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    displayFaculty.forEach((f) => {
      if (f.status?.state === STATUS_KEYS.AVAILABLE) available++;
      if (f.status?.state === STATUS_KEYS.IN_LECTURE) inLecture++;
      if (f.compliance === 'COMPLIANT' || (f.deskHours && f.deskHours >= 3.0)) targetMet++;

      const updatedAt = f.status?.updatedAt;
      if (updatedAt && updatedAt >= todayStart.getTime()) {
        updatedTodayCount++;
      }
    });

    const total = displayFaculty.length;
    const availabilityRate = total > 0 ? Math.round((targetMet / total) * 100) : 0;
    const adoptionRate = total > 0 ? Math.round((updatedTodayCount / total) * 100) : 0;

    return {
      total,
      available,
      inLecture,
      targetMet,
      availabilityRate,
      updatedTodayCount,
      adoptionRate,
    };
  }, [displayFaculty]);

  const handleConfirmLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <RoleGuard allowedRoles={['principal']}>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#FAF8FE',
        color: '#1A191F',
      }}>
        {/* Navigation Bar */}
        <nav style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #EFECF6',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 2px 8px rgba(73, 47, 177, 0.04)',
          padding: '16px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src="/icon.png"
                alt="ProfPing Logo Icon"
                style={{
                  height: '32px',
                  width: '32px',
                  borderRadius: '8px',
                }}
              />
              <img
                src="/profping-logo.png"
                alt="ProfPing"
                style={{
                  height: '24px',
                  width: 'auto',
                  objectFit: 'contain',
                }}
              />
            </div>
            <div style={{ height: '22px', width: '1px', backgroundColor: '#C8C5D3' }} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#1A191F', letterSpacing: '-0.01em' }}>
                  Principal Executive Portal
                </h1>
                <span style={{
                  backgroundColor: '#E0D8FD',
                  color: '#190D4A',
                  border: '1px solid #C8C5D3',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  letterSpacing: '0.04em',
                }}>
                  CAMPUS SUPER ADMIN
                </span>
              </div>
              <span style={{ fontSize: '12.5px', color: '#4B4757' }}>
                Campus-wide faculty availability oversight and secure institutional role governance
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="hod-user-meta">
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#1A191F' }}>
                {user?.displayName || 'Principal Office'}
              </div>
              <div style={{ fontSize: '11.5px', color: '#4B4757' }}>
                {user?.email}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSignOutModal(true)}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #BA1A1A',
                color: '#BA1A1A',
                padding: '7px 16px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </nav>

        {/* Content Body */}
        <main style={{ maxWidth: '1360px', margin: '28px auto', padding: '0 28px 60px' }}>
          {/* Main Navigation Tabs */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '24px',
            borderBottom: '1px solid #E9E7F1',
            paddingBottom: '12px',
          }}>
            <button
              onClick={() => setActiveTab('overview')}
              style={{
                backgroundColor: activeTab === 'overview' ? '#492FB1' : '#FFFFFF',
                color: activeTab === 'overview' ? '#FFFFFF' : '#4B4757',
                border: `1px solid ${activeTab === 'overview' ? '#492FB1' : '#C8C5D3'}`,
                padding: '9px 18px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: activeTab === 'overview' ? '0 4px 12px rgba(73, 47, 177, 0.2)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <LayoutDashboard size={16} />
              Campus Live Overview & Telemetry
            </button>

            <button
              onClick={() => setActiveTab('roles')}
              style={{
                backgroundColor: activeTab === 'roles' ? '#492FB1' : '#FFFFFF',
                color: activeTab === 'roles' ? '#FFFFFF' : '#4B4757',
                border: `1px solid ${activeTab === 'roles' ? '#492FB1' : '#C8C5D3'}`,
                padding: '9px 18px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: activeTab === 'roles' ? '0 4px 12px rgba(73, 47, 177, 0.2)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <ShieldCheck size={16} />
              Department HOD Management
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              style={{
                backgroundColor: activeTab === 'settings' ? '#492FB1' : '#FFFFFF',
                color: activeTab === 'settings' ? '#FFFFFF' : '#4B4757',
                border: `1px solid ${activeTab === 'settings' ? '#492FB1' : '#C8C5D3'}`,
                padding: '9px 18px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: activeTab === 'settings' ? '0 4px 12px rgba(73, 47, 177, 0.2)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Sliders size={16} />
              Institution Settings
            </button>
          </div>

          {activeTab === 'overview' ? (
            <>
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
                    backgroundColor: selectedDept === 'ALL' ? '#492FB1' : '#FFFFFF',
                    border: `1px solid ${selectedDept === 'ALL' ? '#492FB1' : '#C8C5D3'}`,
                    color: selectedDept === 'ALL' ? '#FFFFFF' : '#4B4757',
                    padding: '8px 18px',
                    borderRadius: '9999px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: selectedDept === 'ALL' ? '0 4px 12px rgba(73, 47, 177, 0.15)' : 'none',
                  }}
                >
                  All Departments ({allFaculty.length})
                </button>
                {DEPARTMENTS.map((dept) => {
                  const isSelected = selectedDept === dept.id;
                  return (
                    <button
                      key={dept.id}
                      onClick={() => setSelectedDept(dept.id)}
                      style={{
                        backgroundColor: isSelected ? '#492FB1' : '#FFFFFF',
                        border: `1px solid ${isSelected ? '#492FB1' : '#C8C5D3'}`,
                        color: isSelected ? '#FFFFFF' : '#4B4757',
                        padding: '8px 18px',
                        borderRadius: '9999px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 4px 12px rgba(73, 47, 177, 0.15)' : 'none',
                      }}
                    >
                      {dept.id} — {dept.name}
                    </button>
                  );
                })}
              </div>

              {/* Campus KPI Metrics (5 Cards including Adoption Today & Availability Rate) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
              }}>
                {/* 1. Campus Faculty */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid #C8C5D3',
                  boxShadow: '0 4px 20px -2px rgba(25, 13, 74, 0.04)',
                }}>
                  <span style={{ fontSize: '11.5px', color: '#4B4757', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                    Campus Faculty
                  </span>
                  <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '6px', color: '#1A191F' }}>
                    {campusStats.total}
                  </div>
                  <span style={{ fontSize: '12px', color: '#492FB1', fontWeight: 600 }}>
                    {selectedDept === 'ALL' ? 'Total Across Campus' : `${selectedDept} Department`}
                  </span>
                </div>

                {/* 2. Available at Desk */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid rgba(21, 128, 61, 0.3)',
                  boxShadow: '0 4px 20px -2px rgba(21, 128, 61, 0.05)',
                }}>
                  <span style={{ fontSize: '11.5px', color: '#15803D', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                    Available at Desk
                  </span>
                  <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '6px', color: '#15803D' }}>
                    {campusStats.available}
                  </div>
                  <span style={{ fontSize: '12px', color: '#4B4757' }}>Ready for student consultations</span>
                </div>

                {/* 3. In Lecture / Lab */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid rgba(37, 99, 235, 0.3)',
                  boxShadow: '0 4px 20px -2px rgba(37, 99, 235, 0.05)',
                }}>
                  <span style={{ fontSize: '11.5px', color: '#2563EB', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                    In Lecture / Lab
                  </span>
                  <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '6px', color: '#2563EB' }}>
                    {campusStats.inLecture}
                  </div>
                  <span style={{ fontSize: '12px', color: '#4B4757' }}>Active classrooms & labs</span>
                </div>

                {/* 4. Availability Rate (Renamed from Compliance Rate) */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid rgba(73, 47, 177, 0.3)',
                  boxShadow: '0 4px 20px -2px rgba(73, 47, 177, 0.05)',
                }}>
                  <span style={{ fontSize: '11.5px', color: '#492FB1', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                    Availability Rate
                  </span>
                  <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '6px', color: '#492FB1' }}>
                    {campusStats.availabilityRate}%
                  </div>
                  <span style={{ fontSize: '12px', color: '#4B4757' }}>
                    {campusStats.targetMet} of {campusStats.total} met target (≥3h)
                  </span>
                </div>

                {/* 5. Adoption Today (Small addition) */}
                <div style={{
                  backgroundColor: '#FFFFFF',
                  padding: '20px',
                  borderRadius: '16px',
                  border: '1px solid rgba(180, 83, 9, 0.3)',
                  boxShadow: '0 4px 20px -2px rgba(180, 83, 9, 0.05)',
                }}>
                  <span style={{ fontSize: '11.5px', color: '#B45309', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                    Adoption Today
                  </span>
                  <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '6px', color: '#B45309' }}>
                    {campusStats.updatedTodayCount} <span style={{ fontSize: '16px', fontWeight: 600, color: '#777585' }}>/ {campusStats.total}</span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#4B4757' }}>
                    {campusStats.adoptionRate}% updated status today
                  </span>
                </div>
              </div>

              {/* Department Comparison Chart (Section Requirement) */}
              <DepartmentComparisonChart facultyList={allFaculty} />

              {/* Individual Faculty DeskHourChart with Date Selector */}
              <DeskHourChart
                facultyList={displayFaculty}
                title={selectedDept === 'ALL' ? 'Institutional Campus-Wide Desk-Hour Analytics' : `${selectedDept} Department Desk-Hour Analytics`}
              />

              {/* Live Status Table with Cabin & Stale Marker */}
              <LiveStatusTable
                facultyList={displayFaculty}
                title={selectedDept === 'ALL' ? 'Campus-Wide Faculty Availability Roster' : `${selectedDept} Faculty Availability Roster`}
              />
            </>
          ) : activeTab === 'roles' ? (
            /* Role Management Tab */
            <RoleManagementTable />
          ) : (
            /* Institution Settings Tab */
            <InstitutionSettingsManager />
          )}

          {/* Privacy Respecting Footer */}
          <footer style={{
            marginTop: '48px',
            paddingTop: '24px',
            borderTop: '1px solid #E9E7F1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '12px',
            color: '#777585',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={15} color="#15803D" />
              <span>
                <strong>Privacy Policy:</strong> Faculty availability status is self-reported in accordance with institutional guidelines. ProfPing does not perform automated surveillance or location tracking.
              </span>
            </div>
            <div>
              Working Window: <strong>8:30 AM – 5:30 PM</strong> | Target: <strong>3.0 hrs</strong>
            </div>
          </footer>
        </main>

        {/* Confirmation Sign Out Modal */}
        <SignOutModal
          isOpen={showSignOutModal}
          onClose={() => setShowSignOutModal(false)}
          onConfirm={handleConfirmLogout}
          portalName="Principal Executive Portal"
        />
      </div>
    </RoleGuard>
  );
}
