'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../src/hooks/useAuth';
import { subscribeToDepartmentFaculty } from '../../src/lib/hodService';
import LiveStatusTable from '../../src/components/LiveStatusTable';
import DeskHourChart from '../../src/components/DeskHourChart';
import { enrichWithDeskHours } from '../../src/lib/dashboardService';
import { STATUS_KEYS, STATUS_CONFIG } from '@profping/shared';
import { Activity, Clock, CheckCircle, AlertTriangle, Radio, Search } from 'lucide-react';

export default function HodCommandCenterPage() {
  const { department } = useAuth();
  const effectiveDept = department || 'CMPN';

  const [rawFaculty, setRawFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    // Realtime Firebase snapshot listener
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

  // Aggregate metrics
  const stats = useMemo(() => {
    let available = 0;
    let inLecture = 0;
    let busy = 0;
    let offCampus = 0;
    let compliant = 0;

    facultyList.forEach((f) => {
      const state = f.status?.state || STATUS_KEYS.OFF_CAMPUS;
      if (state === STATUS_KEYS.AVAILABLE) available++;
      else if (state === STATUS_KEYS.IN_LECTURE) inLecture++;
      else if (state === STATUS_KEYS.BUSY) busy++;
      else offCampus++;

      if (f.compliance === 'COMPLIANT') compliant++;
    });

    const total = facultyList.length;
    return {
      total,
      available,
      inLecture,
      busy,
      offCampus,
      compliant,
      rate: total ? Math.round((compliant / total) * 100) : 0,
    };
  }, [facultyList]);

  // Filtered list for table
  const filteredList = useMemo(() => {
    return facultyList.filter((f) => {
      const matchesSearch =
        (f.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.cabin || '').toLowerCase().includes(searchQuery.toLowerCase());

      const state = f.status?.state || STATUS_KEYS.OFF_CAMPUS;
      const matchesFilter = filterState === 'ALL' || state === filterState;

      return matchesSearch && matchesFilter;
    });
  }, [facultyList, searchQuery, filterState]);

  return (
    <div>
      {/* Live Indicator Banner */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        border: '1px solid #C8C5D3',
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
            LIVE FIREBASE STREAM ACTIVE
          </div>
          <span style={{ fontSize: '13px', color: '#4B4757' }}>
            Broadcaster updates from faculty mobile phones reflect here automatically with zero reload.
          </span>
        </div>

        <div style={{ fontSize: '12px', color: '#777585' }}>
          Last synced: Just now
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
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
          <span style={{ fontSize: '12px', color: '#4B4757', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>Total Department Faculty</span>
          <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '6px', color: '#1A191F' }}>{stats.total}</div>
          <span style={{ fontSize: '12px', color: '#492FB1', fontWeight: 600 }}>Dept. of {effectiveDept} roster</span>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(21, 128, 61, 0.3)',
          boxShadow: '0 4px 20px -2px rgba(21, 128, 61, 0.05)',
        }}>
          <span style={{ fontSize: '12px', color: '#15803D', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>🟢 Available at Desk</span>
          <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '6px', color: '#15803D' }}>{stats.available}</div>
          <span style={{ fontSize: '12px', color: '#4B4757' }}>Open for student consultation</span>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(37, 99, 235, 0.3)',
          boxShadow: '0 4px 20px -2px rgba(37, 99, 235, 0.05)',
        }}>
          <span style={{ fontSize: '12px', color: '#2563EB', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>🔵 In Lecture / Lab</span>
          <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '6px', color: '#2563EB' }}>{stats.inLecture}</div>
          <span style={{ fontSize: '12px', color: '#4B4757' }}>Active classroom teaching</span>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(180, 83, 9, 0.3)',
          boxShadow: '0 4px 20px -2px rgba(180, 83, 9, 0.05)',
        }}>
          <span style={{ fontSize: '12px', color: '#B45309', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>🟡 Busy / Meeting</span>
          <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '6px', color: '#B45309' }}>{stats.busy}</div>
          <span style={{ fontSize: '12px', color: '#4B4757' }}>In cabin / committee work</span>
        </div>

        <div style={{
          backgroundColor: '#FFFFFF',
          padding: '20px',
          borderRadius: '16px',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          boxShadow: '0 4px 20px -2px rgba(220, 38, 38, 0.05)',
        }}>
          <span style={{ fontSize: '12px', color: '#DC2626', fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>🔴 Off Campus</span>
          <div style={{ fontSize: '32px', fontWeight: 800, marginTop: '6px', color: '#DC2626' }}>{stats.offCampus}</div>
          <span style={{ fontSize: '12px', color: '#4B4757' }}>Away from institution</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        border: '1px solid #C8C5D3',
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
            placeholder="Search faculty name, cabin room, or email..."
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
            { label: 'All Statuses', val: 'ALL' },
            { label: 'Available', val: STATUS_KEYS.AVAILABLE },
            { label: 'In Lecture', val: STATUS_KEYS.IN_LECTURE },
            { label: 'Busy', val: STATUS_KEYS.BUSY },
            { label: 'Off Campus', val: STATUS_KEYS.OFF_CAMPUS },
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

      {/* Visual Analytics Chart */}
      <div style={{ marginBottom: '24px' }}>
        <DeskHourChart facultyList={facultyList} title={`${effectiveDept} Faculty Desk-Hour Analysis (Live)`} />
      </div>

      {/* Realtime Live Status Table */}
      <LiveStatusTable
        facultyList={filteredList}
        title={`${effectiveDept} Department Live Faculty Roster (${filteredList.length} of ${stats.total})`}
      />
    </div>
  );
}
