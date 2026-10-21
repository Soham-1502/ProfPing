'use client';

import React, { useState, useMemo } from 'react';
import { STATUS_CONFIG, STATUS_KEYS } from '@profping/shared';

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
        f.name.toLowerCase().includes(q) ||
        f.department.toLowerCase().includes(q) ||
        f.designation.toLowerCase().includes(q) ||
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
      backgroundColor: '#0f172a',
      borderRadius: '14px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      overflow: 'hidden',
    }}>
      {/* Table Header Controls */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            {title} ({filtered.length})
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
            Real-time status broadcast synchronized with institutional audit logs
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
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '8px 14px',
              color: '#ffffff',
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
              backgroundColor: '#1e293b',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '8px 12px',
              color: '#ffffff',
              fontSize: '13px',
              outline: 'none',
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
            <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <th style={{ padding: '14px 24px', color: '#94a3b8', fontWeight: 600 }}>FACULTY MEMBER</th>
              <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 600 }}>DEPARTMENT</th>
              <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 600 }}>LIVE AVAILABILITY</th>
              <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 600 }}>CURRENT NOTE</th>
              <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 600 }}>DESK HOURS (Δt)</th>
              <th style={{ padding: '14px 24px', color: '#94a3b8', fontWeight: 600 }}>LAST UPDATE</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                  No faculty found matching the search criteria.
                </td>
              </tr>
            ) : (
              filtered.map((faculty) => {
                const cfg = STATUS_CONFIG[faculty.status?.state] || STATUS_CONFIG[STATUS_KEYS.AVAILABLE];
                return (
                  <tr
                    key={faculty.uid}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background-color 0.15s',
                    }}
                  >
                    {/* Faculty Profile */}
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          backgroundColor: '#1e293b',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: '#38bdf8',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '13px',
                        }}>
                          {faculty.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#f8fafc' }}>{faculty.name}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{faculty.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td style={{ padding: '16px 16px' }}>
                      <span style={{
                        backgroundColor: 'rgba(56, 189, 248, 0.1)',
                        color: '#38bdf8',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                      }}>
                        {faculty.department}
                      </span>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                        {faculty.designation}
                      </div>
                    </td>

                    {/* Live Status */}
                    <td style={{ padding: '16px 16px' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: `${cfg.color}15`,
                        border: `1px solid ${cfg.borderColor}40`,
                        padding: '4px 10px',
                        borderRadius: '6px',
                      }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cfg.color }} />
                        <span style={{ color: cfg.color, fontWeight: 700, fontSize: '12px' }}>{cfg.label}</span>
                      </div>
                    </td>

                    {/* Current Note */}
                    <td style={{ padding: '16px 16px', maxWidth: '240px' }}>
                      <span style={{ color: '#cbd5e1', fontStyle: 'italic' }}>
                        "{faculty.status?.message || cfg.defaultMessage}"
                      </span>
                    </td>

                    {/* Desk Hours Today */}
                    <td style={{ padding: '16px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, color: '#10b981', fontSize: '14px' }}>
                          {faculty.deskHours !== undefined ? `${faculty.deskHours} hrs` : '—'}
                        </span>
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: faculty.compliance === 'COMPLIANT' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: faculty.compliance === 'COMPLIANT' ? '#10b981' : '#f59e0b',
                        }}>
                          {faculty.compliance || 'TRACKED'}
                        </span>
                      </div>
                    </td>

                    {/* Last Update */}
                    <td style={{ padding: '16px 24px', color: '#94a3b8', fontSize: '12px' }}>
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
