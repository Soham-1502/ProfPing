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
  ReferenceLine,
  Cell,
} from 'recharts';
import { DEPARTMENTS } from '@profping/shared';

const DEPT_COLORS = {
  CMPN: '#492FB1',
  INFT: '#2563EB',
  EXTC: '#0D9488',
  ECS: '#D97706',
};

export default function DepartmentComparisonChart({ facultyList = [] }) {
  // Aggregate department averages
  const departmentData = DEPARTMENTS.map((dept) => {
    const deptFaculty = facultyList.filter((f) => f.department === dept.id);
    const count = deptFaculty.length;
    const totalDeskHours = deptFaculty.reduce((sum, f) => sum + (f.deskHours || 0), 0);
    const avgDeskHours = count > 0 ? Math.round((totalDeskHours / count) * 10) / 10 : 0;

    let availableCount = 0;
    deptFaculty.forEach((f) => {
      if (f.status?.state === 'available') availableCount++;
    });

    const availabilityRate = count > 0 ? Math.round((availableCount / count) * 100) : 0;

    return {
      department: dept.id,
      name: dept.name,
      avgDeskHours,
      facultyCount: count,
      availabilityRate,
      color: DEPT_COLORS[dept.id] || '#492FB1',
    };
  });

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      border: '1px solid #C8C5D3',
      boxShadow: '0 4px 20px -2px rgba(25, 13, 74, 0.04)',
      padding: '24px',
      marginBottom: '24px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#1A191F', margin: 0, letterSpacing: '-0.2px' }}>
            Academic Department Comparison
          </h3>
          <p style={{ fontSize: '13px', color: '#4B4757', margin: '4px 0 0' }}>
            Average faculty desk availability hours across institutional departments
          </p>
        </div>

        <div style={{
          backgroundColor: '#E0D8FD',
          border: '1px solid #C8C5D3',
          padding: '6px 14px',
          borderRadius: '9999px',
          fontSize: '12px',
          color: '#190D4A',
          fontWeight: 700,
        }}>
          Benchmark: 3.0 hrs / day
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'center' }}>
        {/* Recharts Bar Chart */}
        <div style={{ height: 260, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={departmentData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E9E7F1" />
              <XAxis dataKey="department" stroke="#4B4757" fontSize={12} tickLine={false} />
              <YAxis stroke="#4B4757" fontSize={12} tickLine={false} unit="h" domain={[0, 5]} />
              <ReferenceLine y={3.0} stroke="#15803D" strokeDasharray="4 4" label={{ value: 'Target (3.0h)', fill: '#15803D', fontSize: 11, position: 'insideTopRight' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #C8C5D3',
                  borderRadius: '10px',
                  color: '#1A191F',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                }}
                formatter={(value) => [`${value} hrs`, 'Average Desk Hours']}
                labelFormatter={(deptCode) => {
                  const item = departmentData.find((d) => d.department === deptCode);
                  return item ? `${item.department} — ${item.name}` : deptCode;
                }}
              />
              <Bar dataKey="avgDeskHours" name="Avg Desk Hours" radius={[6, 6, 0, 0]}>
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {departmentData.map((dept) => (
            <div
              key={dept.department}
              style={{
                backgroundColor: '#FAF8FE',
                borderRadius: '12px',
                border: '1px solid #EFECF6',
                padding: '14px 16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: dept.color,
                  backgroundColor: '#FFFFFF',
                  border: `1px solid ${dept.color}30`,
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}>
                  {dept.department}
                </span>
                <span style={{ fontSize: '11.5px', color: '#777585' }}>
                  {dept.facultyCount} faculty
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '10px' }}>
                <span style={{ fontSize: '22px', fontWeight: 800, color: '#1A191F' }}>
                  {dept.avgDeskHours}
                </span>
                <span style={{ fontSize: '12px', color: '#4B4757', fontWeight: 600 }}>hrs avg / day</span>
              </div>
              <div style={{
                marginTop: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11.5px',
                color: dept.avgDeskHours >= 3.0 ? '#15803D' : '#B45309',
                fontWeight: 600,
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: dept.avgDeskHours >= 3.0 ? '#15803D' : '#B45309',
                }} />
                {dept.avgDeskHours >= 3.0 ? 'Met Campus Target' : 'Below Target'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
