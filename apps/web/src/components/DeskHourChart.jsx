'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export default function DeskHourChart({ facultyList = [], title = 'Desk-Hour Telemetry Analysis' }) {
  // Map faculty array into chart data
  const chartData = facultyList.map((f) => {
    const durations = f.stateDurations || {};
    return {
      name: f.name.replace('Prof. ', '').replace('Dr. ', '').split(' ')[0],
      fullName: f.name,
      available: durations.available || f.deskHours || 0,
      in_lecture: durations.in_lecture || 0,
      busy: durations.busy || 0,
    };
  });

  return (
    <div style={{
      backgroundColor: '#0f172a',
      borderRadius: '14px',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      padding: '24px',
      marginBottom: '24px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
            {title}
          </h3>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
            Daily duration breakdown clipped to institutional working hours (8:30 AM – 5:30 PM)
          </p>
        </div>
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#10b981',
          fontWeight: 700,
        }}>
          Target: ≥ 3.0 hrs Desk Consultation
        </div>
      </div>

      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} unit="h" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '12px',
              }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
              formatter={(value) => {
                if (value === 'available') return 'Available (Desk Hours)';
                if (value === 'in_lecture') return 'In Lecture / Lab';
                if (value === 'busy') return 'Engaged / Busy';
                return value;
              }}
            />
            <Bar dataKey="available" name="available" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="in_lecture" name="in_lecture" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="busy" name="busy" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
