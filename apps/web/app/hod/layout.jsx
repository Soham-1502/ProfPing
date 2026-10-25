'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import RoleGuard from '../../src/components/RoleGuard';
import { useAuth } from '../../src/hooks/useAuth';
import { Activity, Users, ShieldCheck, Settings, LogOut } from 'lucide-react';

export default function HodLayout({ children }) {
  const { user, department, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const effectiveDept = department || 'CMPN';

  const navItems = [
    {
      label: 'Live Command Center',
      href: '/hod',
      icon: Activity,
      exact: true,
    },
    {
      label: 'Faculty Directory',
      href: '/hod/faculty',
      icon: Users,
    },
    {
      label: 'Student Access Control',
      href: '/hod/students',
      icon: ShieldCheck,
    },
    {
      label: 'Department Settings',
      href: '/hod/settings',
      icon: Settings,
    },
  ];

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <RoleGuard allowedRoles={['hod']}>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#FAF8FE',
        color: '#1A191F',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}>
        {/* Top Header */}
        <header style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #EFECF6',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 2px 8px rgba(73, 47, 177, 0.04)',
        }}>
          {/* Brand & User Profile Row */}
          <div style={{
            maxWidth: '1360px',
            margin: '0 auto',
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
                    HOD Portal — Dept. of {effectiveDept}
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
                    ADMIN GATE
                  </span>
                </div>
                <span style={{ fontSize: '12.5px', color: '#4B4757' }}>
                  Real-time faculty telemetry, directory management, and student access governance
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="hod-user-meta">
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1A191F' }}>
                  {user?.displayName || 'Head of Department'}
                </div>
                <div style={{ fontSize: '11.5px', color: '#4B4757' }}>
                  {user?.email}
                </div>
              </div>

              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #BA1A1A',
                  color: '#BA1A1A',
                  padding: '7px 14px',
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
                <LogOut size={13} />
                Sign Out
              </button>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div style={{
            maxWidth: '1360px',
            margin: '0 auto',
            padding: '0 28px',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
          }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: isActive ? '#492FB1' : '#4B4757',
                    textDecoration: 'none',
                    borderBottom: isActive ? '3px solid #492FB1' : '3px solid transparent',
                    backgroundColor: isActive ? '#E0D8FD' : 'transparent',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Icon size={16} color={isActive ? '#492FB1' : '#746F80'} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </header>

        {/* Content Container */}
        <main style={{ maxWidth: '1360px', margin: '28px auto', padding: '0 28px' }}>
          {children}
        </main>
      </div>
    </RoleGuard>
  );
}
