'use client';

import React, { useState, useMemo } from 'react';
import { STATUS_CONFIG, STATUS_KEYS } from '@profping/shared';

const STATUS_THEME = {
  [STATUS_KEYS.AVAILABLE]: {
    bg: '#DCFCE7',
    text: '#14532D',
    border: 'rgba(21, 128, 61, 0.3)',
    dot: '#15803D',
  },
  [STATUS_KEYS.BUSY]: {
    bg: '#FEF3C7',
    text: '#78350F',
    border: 'rgba(180, 83, 9, 0.3)',
    dot: '#B45309',
  },
  [STATUS_KEYS.IN_LECTURE]: {
    bg: '#DBEAFE',
    text: '#1E3A8A',
    border: 'rgba(37, 99, 235, 0.3)',
    dot: '#2563EB',
  },
  [STATUS_KEYS.OFF_CAMPUS]: {
    bg: '#FEE2E2',
    text: '#7F1D1D',
    border: 'rgba(220, 38, 38, 0.3)',
    dot: '#DC2626',
  },
};

export default function LiveStatusTable({ facultyList = [], title = 'Faculty Availability' }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = useMemo(() => {
    return facultyList.filter((f) => {
      if (statusFilter !== 'ALL' && f.status?.state !== statusFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (f.name || '').toLowerCase().includes(q) ||
        (f.email || '').toLowerCase().includes(q) ||
        (f.cabin || '').toLowerCase().includes(q) ||
        (f.department || '').toLowerCase().includes(q) ||
        (f.designation || '').toLowerCase().includes(q) ||
        (f.status?.message || '').toLowerCase().includes(q)
      );
    });
  }, [facultyList, searchQuery, statusFilter]);

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const diff = Math.floor((Date.now() - timestamp) / 60000);
    if (diff <= 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ago`;
  };

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      border: '1px solid #C8C5D3',
      boxShadow: '0 4px 20px -2px rgba(25, 13, 74, 0.04)',
      overflow: 'hidden',
    }}>
      {/* Table Header Controls */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid #E9E7F1',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1A191F', margin: 0, letterSpacing: '-0.2px' }}>
            {title} ({filtered.length})
          </h3>
          <p style={{ fontSize: '13px', color: '#4B4757', margin: '4px 0 0' }}>
            Real-time self-reported faculty availability across academic departments
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search faculty, cabin, or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              backgroundColor: '#F4F2FA',
              border: '1px solid #C8C5D3',
              borderRadius: '9999px',
              padding: '8px 16px',
              color: '#1A191F',
              fontSize: '13px',
              outline: 'none',
              minWidth: '240px',
            }}
          />

          {/* Status Filter Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              backgroundColor: '#F4F2FA',
              border: '1px solid #C8C5D3',
              borderRadius: '9999px',
              padding: '8px 14px',
              color: '#1A191F',
              fontSize: '13px',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Statuses</option>
            {Object.values(STATUS_CONFIG).map((cfg) => (
              <option key={cfg.key} value={cfg.key}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Element */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ backgroundColor: '#EFECF6', borderBottom: '1px solid #C8C5D3' }}>
              <th style={{ padding: '14px 20px', color: '#4B4757', fontWeight: 700, letterSpacing: '0.4px', fontSize: '11.5px' }}>FACULTY MEMBER</th>
              <th style={{ padding: '14px 14px', color: '#4B4757', fontWeight: 700, letterSpacing: '0.4px', fontSize: '11.5px' }}>DEPARTMENT</th>
              <th style={{ padding: '14px 14px', color: '#4B4757', fontWeight: 700, letterSpacing: '0.4px', fontSize: '11.5px' }}>CABIN</th>
              <th style={{ padding: '14px 14px', color: '#4B4757', fontWeight: 700, letterSpacing: '0.4px', fontSize: '11.5px' }}>LIVE AVAILABILITY</th>
              <th style={{ padding: '14px 16px', color: '#4B4757', fontWeight: 700, letterSpacing: '0.4px', fontSize: '11.5px' }}>CURRENT NOTE</th>
              <th style={{ padding: '14px 14px', color: '#4B4757', fontWeight: 700, letterSpacing: '0.4px', fontSize: '11.5px' }}>DESK HOURS (Δt)</th>
              <th style={{ padding: '14px 20px', color: '#4B4757', fontWeight: 700, letterSpacing: '0.4px', fontSize: '11.5px' }}>LAST UPDATE</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#777585' }}>
                  {facultyList.length === 0
                    ? 'No faculty registered yet. Department HODs can add faculty members via the Faculty Directory Manager.'
                    : 'No faculty found matching the search criteria.'}
                </td>
              </tr>
            ) : (
              filtered.map((faculty) => {
                const stateKey = faculty.status?.state || STATUS_KEYS.AVAILABLE;
                const cfg = STATUS_CONFIG[stateKey] || STATUS_CONFIG[STATUS_KEYS.AVAILABLE];
                const theme = STATUS_THEME[stateKey] || STATUS_THEME[STATUS_KEYS.AVAILABLE];

                const updatedAt = faculty.status?.updatedAt;
                const isUpdatedToday = updatedAt ? new Date(updatedAt).toDateString() === new Date().toDateString() : false;

                return (
                  <tr
                    key={faculty.uid}
                    style={{
                      borderBottom: '1px solid #E9E7F1',
                      transition: 'background-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(73, 47, 177, 0.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Faculty Profile */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          backgroundColor: '#E0D8FD',
                          border: '1px solid rgba(73, 47, 177, 0.25)',
                          color: '#190D4A',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '13px',
                          flexShrink: 0,
                        }}>
                          {faculty.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1A191F' }}>{faculty.name}</div>
                          <div style={{ fontSize: '11.5px', color: '#777585' }}>{faculty.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td style={{ padding: '16px 14px' }}>
                      <span style={{
                        backgroundColor: '#E0D8FD',
                        color: '#190D4A',
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}>
                        {faculty.department}
                      </span>
                      <div style={{ fontSize: '11.5px', color: '#4B4757', marginTop: '4px' }}>
                        {faculty.designation}
                      </div>
                    </td>

                    {/* Cabin Location */}
                    <td style={{ padding: '16px 14px' }}>
                      <div style={{ fontWeight: 600, color: '#1A191F', fontSize: '12.5px' }}>
                        {faculty.cabin || 'Room 304, 3rd Flr'}
                      </div>
                      {faculty.intercom && (
                        <div style={{ fontSize: '11px', color: '#777585' }}>{faculty.intercom}</div>
                      )}
                    </td>

                    {/* Live Status & Stale Tag */}
                    <td style={{ padding: '16px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: theme.bg,
                          border: `1px solid ${theme.border}`,
                          padding: '4px 12px',
                          borderRadius: '9999px',
                        }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: theme.dot }} />
                          <span style={{ color: theme.text, fontWeight: 700, fontSize: '12px' }}>{cfg.label}</span>
                        </div>
                        {!isUpdatedToday && (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            color: '#777585',
                            backgroundColor: '#F4F2FA',
                            border: '1px solid #C8C5D3',
                            padding: '2px 6px',
                            borderRadius: '4px',
                          }}>
                            Stale
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Current Note */}
                    <td style={{ padding: '16px 16px', maxWidth: '240px' }}>
                      <span style={{ color: '#4B4757', fontStyle: 'italic', fontSize: '12.5px' }}>
                        "{faculty.status?.message || cfg.defaultMessage}"
                      </span>
                    </td>

                    {/* Desk Hours Today */}
                    <td style={{ padding: '16px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, color: '#15803D', fontSize: '14px' }}>
                          {faculty.deskHours !== undefined ? `${faculty.deskHours} hrs` : '—'}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          backgroundColor: faculty.compliance === 'COMPLIANT' ? '#DCFCE7' : '#FEF3C7',
                          color: faculty.compliance === 'COMPLIANT' ? '#14532D' : '#78350F',
                          border: faculty.compliance === 'COMPLIANT' ? '1px solid rgba(21, 128, 61, 0.25)' : '1px solid rgba(180, 83, 9, 0.25)',
                        }}>
                          {faculty.compliance === 'COMPLIANT' ? 'TARGET MET' : 'IN PROGRESS'}
                        </span>
                      </div>
                    </td>

                    {/* Last Update */}
                    <td style={{ padding: '16px 20px', color: '#777585', fontSize: '12px' }}>
                      {formatRelativeTime(faculty.status?.updatedAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
