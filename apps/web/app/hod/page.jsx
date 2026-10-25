'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../src/hooks/useAuth';
import { subscribeToDepartmentFaculty } from '../../src/lib/hodService';
import LiveStatusTable from '../../src/components/LiveStatusTable';
import DeskHourChart from '../../src/components/DeskHourChart';
import { enrichWithDeskHours } from '../../src/lib/dashboardService';
import { STATUS_KEYS } from '@profping/shared';
import { Radio, Search, Users, CheckCircle2, BookOpen, Target, Clock } from 'lucide-react';

export default function HodCommandCenterPage() {
  const { department } = useAuth();
  const effectiveDept = (department || 'CMPN').toUpperCase();

  const [rawFaculty, setRawFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('ALL');
  const [institutionTargetHours, setInstitutionTargetHours] = useState(3.0);

  // Load institution target from settings
  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings?.deskTargetHours) {
          setInstitutionTargetHours(Number(data.settings.deskTargetHours));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    // Realtime Firebase snapshot listener scoped to HOD's department
    const unsubscribe = subscribeToDepartmentFaculty(effectiveDept, (list) => {
      setRawFaculty(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [effectiveDept]);

  // Enrich with desk hour analytics
  const facultyList = useMemo(() => {
    return enrichWithDeskHours(rawFaculty);
  }, [rawFaculty]);

  // Aggregate departmental metrics (Section 6: Department Faculty, Available, In Lecture, Meeting Target)
  const stats = useMemo(() => {
    let available = 0;
    let inLecture = 0;
    let busy = 0;
    let offCampus = 0;
    let compliant = 0;

    facultyList.forEach((f) => {
      const state = (f.status?.state || STATUS_KEYS.OFF_CAMPUS).toLowerCase();
      if (state === STATUS_KEYS.AVAILABLE) available++;
      else if (state === STATUS_KEYS.IN_LECTURE) inLecture++;
      else if (state === STATUS_KEYS.BUSY) busy++;
      else offCampus++;

      const hours = typeof f.deskHours === 'number' ? f.deskHours : 0;
      if (hours >= institutionTargetHours || f.compliance === 'COMPLIANT') {
        compliant++;
      }
    });

    const total = facultyList.length;
    return {
      total,
      available,
      inLecture,
      busy,
      offCampus,
      compliant,
      complianceRate: total > 0 ? Math.round((compliant / total) * 100) : 0,
    };
  }, [facultyList, institutionTargetHours]);

  // Filtered list for table
  const filteredList = useMemo(() => {
    return facultyList.filter((f) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !query ||
        (f.name || '').toLowerCase().includes(query) ||
        (f.email || '').toLowerCase().includes(query) ||
        (f.cabin || '').toLowerCase().includes(query) ||
        (f.designation || '').toLowerCase().includes(query) ||
        (f.status?.message || '').toLowerCase().includes(query);

      const state = (f.status?.state || STATUS_KEYS.OFF_CAMPUS).toLowerCase();
      const matchesFilter = filterState === 'ALL' || state === filterState.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [facultyList, searchQuery, filterState]);

  return (
    <div>
      {/* Live Stream Status Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E9E7F1',
        borderRadius: '16px',
        boxShadow: '0 4px 20px -2px rgba(25, 13, 74, 0.04)',
        padding: '16px 22px',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#DCFCE7',
            color: '#14532D',
            border: '1px solid rgba(21, 128, 61, 0.3)',
            padding: '5px 12px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 700,
          }}>
            <Radio size={14} className="animate-pulse" />
            LIVE FIREBASE RTDB STREAM
          </div>
          <span style={{ fontSize: '13px', color: '#4B4757' }}>
            Faculty status updates from mobile broadcaster apps reflect in real time with zero latency.
          </span>
        </div>

        <div style={{ fontSize: '12px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={13} color="#492FB1" />
          Desk Target: <strong>{institutionTargetHours} hrs / day</strong> (Set by Principal)
        </div>
      </div>

      {/* ── Section 6 KPI Cards: Department Faculty, Available, In Lecture, Meeting Target ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {/* 1. Department Faculty */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px -2px rgba(25, 13, 74, 0.04)',
          position: 'relative',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', color: '#4B4757', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              Department Faculty
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} color="#492FB1" />
            </div>
          </div>
          <div style={{ fontSize: '34px', fontWeight: 800, marginTop: '8px', color: '#1A191F' }}>
            {stats.total}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <span style={{ fontSize: '12px', color: '#492FB1', fontWeight: 700 }}>{effectiveDept} Dept. Roster</span>
            <span style={{ fontSize: '11px', color: '#64748B' }}>• {stats.busy} Busy • {stats.offCampus} Away</span>
          </div>
        </div>

        {/* 2. Available */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(21, 128, 61, 0.25)',
          boxShadow: '0 4px 20px -2px rgba(21, 128, 61, 0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', color: '#15803D', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              Available
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={16} color="#15803D" />
            </div>
          </div>
          <div style={{ fontSize: '34px', fontWeight: 800, marginTop: '8px', color: '#15803D' }}>
            {stats.available}
          </div>
          <span style={{ fontSize: '12px', color: '#4B4757', display: 'block', marginTop: '6px' }}>
            In office / Open for student doubts
          </span>
        </div>

        {/* 3. In Lecture */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(37, 99, 235, 0.25)',
          boxShadow: '0 4px 20px -2px rgba(37, 99, 235, 0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              In Lecture
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={16} color="#2563EB" />
            </div>
          </div>
          <div style={{ fontSize: '34px', fontWeight: 800, marginTop: '8px', color: '#2563EB' }}>
            {stats.inLecture}
          </div>
          <span style={{ fontSize: '12px', color: '#4B4757', display: 'block', marginTop: '6px' }}>
            Classroom teaching or laboratory sessions
          </span>
        </div>

        {/* 4. Meeting Target */}
        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(122, 77, 137, 0.25)',
          boxShadow: '0 4px 20px -2px rgba(122, 77, 137, 0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '12px', color: '#492FB1', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              Meeting Target
            </span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#E0D8FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={16} color="#492FB1" />
            </div>
          </div>
          <div style={{ fontSize: '34px', fontWeight: 800, marginTop: '8px', color: '#1A191F' }}>
            {stats.compliant} <span style={{ fontSize: '16px', fontWeight: 600, color: '#64748B' }}>/ {stats.total}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <span style={{
              backgroundColor: stats.complianceRate >= 70 ? '#DCFCE7' : '#FEF3C7',
              color: stats.complianceRate >= 70 ? '#14532D' : '#78350F',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
            }}>
              {stats.complianceRate}% Rate
            </span>
            <span style={{ fontSize: '12px', color: '#4B4757' }}>
              ≥ {institutionTargetHours} hrs desk presence
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '16px',
        boxShadow: '0 4px 20px -2px rgba(25, 13, 74, 0.04)',
        padding: '14px 20px',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '14px',
      }}>
        <div style={{ position: 'relative', minWidth: '280px', flex: '1' }}>
          <Search size={16} color="#777585" style={{ position: 'absolute', left: '16px', top: '12px' }} />
          <input
            type="text"
            placeholder="Search faculty name, cabin room, designation, or note..."
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

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { label: `All Faculty (${stats.total})`, val: 'ALL' },
            { label: `Available (${stats.available})`, val: STATUS_KEYS.AVAILABLE },
            { label: `In Lecture (${stats.inLecture})`, val: STATUS_KEYS.IN_LECTURE },
            { label: `Busy (${stats.busy})`, val: STATUS_KEYS.BUSY },
            { label: `Off Campus (${stats.offCampus})`, val: STATUS_KEYS.OFF_CAMPUS },
          ].map((pill) => {
            const isActive = filterState === pill.val;
            return (
              <button
                key={pill.val}
                onClick={() => setFilterState(pill.val)}
                style={{
                  backgroundColor: isActive ? '#492FB1' : '#F4F2FA',
                  color: isActive ? '#FFFFFF' : '#4B4757',
                  border: `1px solid ${isActive ? '#492FB1' : '#C8C5D3'}`,
                  padding: '8px 16px',
                  borderRadius: '9999px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual Analytics Chart: Today and Last 7 Days range */}
      <div style={{ marginBottom: '24px' }}>
        <DeskHourChart
          facultyList={facultyList}
          title={`${effectiveDept} Faculty Desk-Hour Analysis`}
        />
      </div>

      {/* Realtime Live Status Table */}
      <LiveStatusTable
        facultyList={filteredList}
        title={`${effectiveDept} Department Live Faculty Roster`}
      />
    </div>
  );
}
