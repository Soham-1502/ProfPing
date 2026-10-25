'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useAuth } from '../src/hooks/useAuth';
import { STATUS_KEYS, STATUS_CONFIG } from '@profping/shared';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  MapPin,
  Clock,
  Bell,
  Users,
  Compass,
  Building2,
  ChevronRight,
  CheckCircle2,
  Radio,
  ExternalLink,
  Laptop,
  Check,
  AlertCircle,
  GraduationCap,
  DoorOpen,
  Award,
  Layers,
  Activity,
  LogOut,
  ChevronLeft
} from 'lucide-react';

// ── 4 Mobile Onboarding Slides Direct Reference ──────────────────────────────
const MOBILE_SLIDES = [
  {
    id: 'slide-1',
    badge: 'STUDENT SEARCH & RADAR',
    headline: 'Find Your Professor Instantly',
    body: 'Know their real-time availability and exact campus location before you walk all the way across campus to their cabin.',
    image: '/onboarding-slide1.jpg',
    tag: 'Zero Wasted Walks',
    accentColor: '#492FB1',
    accentBg: '#EDE9FE',
    keyFeatures: ['Live Availability Badges', 'Desk & Intercom Directory', 'Floor-by-Floor Mapping'],
  },
  {
    id: 'slide-2',
    badge: '1-TAP FACULTY BROADCASTER',
    headline: 'Set Status in One Click',
    body: 'Faculty members can instantly broadcast their availability, current laboratory room, or custom notes to students in under 2 seconds.',
    image: '/onboarding-slide2.jpg',
    tag: '1-Tap Broadcast',
    accentColor: '#15803D',
    accentBg: '#DCFCE7',
    keyFeatures: ['Auto-Reset Timetable Timers', 'Custom Classroom Notes', 'Syncs Across Mobile & Web'],
  },
  {
    id: 'slide-3',
    badge: 'CAMPUS DIGITAL TWIN',
    headline: 'Interactive Campus Maps',
    body: 'A live spatial twin of your department. See exactly which table, seminar hall, or computer lab your professor is currently occupying.',
    image: '/onboarding-slide3.jpg',
    tag: 'Precision Spatial Mapping',
    accentColor: '#2563EB',
    accentBg: '#DBEAFE',
    keyFeatures: ['Interactive Lab Layouts', 'Cabin Seat Numbers', 'Live Presence Indicator'],
  },
  {
    id: 'slide-4',
    badge: 'PROACTIVE PING NOTIFICATIONS',
    headline: 'Never Wait Outside Again',
    body: 'Skip the endless waiting game outside closed faculty cabins. Star your professors and receive instant push notifications the second they switch to "Available".',
    image: '/onboarding-slide4.jpg',
    tag: 'Automated Availability Pings',
    accentColor: '#D97706',
    accentBg: '#FEF3C7',
    keyFeatures: ['Instant Push Alerts', 'Priority Faculty Watchlist', 'Zero Disruption for Professors'],
  },
];

// ── Live Status Simulator Config ─────────────────────────────────────────────
const SIMULATOR_STATES = [
  {
    key: STATUS_KEYS.AVAILABLE,
    label: 'Available',
    subtitle: 'In Office / Walk-ins Welcome',
    room: 'Cabin 304 • Ext. 421',
    note: 'Office hours open for student doubts & queries',
    color: '#15803D',
    bgColor: '#DCFCE7',
    borderColor: '#86EFAC',
    textColor: '#14532D',
    icon: CheckCircle2,
    studentNotification: 'Dr. Anjali Mehta is now AVAILABLE in Cabin 304. Walk-ins welcome!',
    badgeText: 'WALK-INS OK',
  },
  {
    key: STATUS_KEYS.BUSY,
    label: 'Busy',
    subtitle: 'Grading / In Meeting',
    room: 'Seminar Hall 2 • 3rd Floor',
    note: 'Evaluating Final Year Project Interim Submissions',
    color: '#D97706',
    bgColor: '#FEF3C7',
    borderColor: '#FDE68A',
    textColor: '#78350F',
    icon: Clock,
    studentNotification: 'Dr. Anjali Mehta is BUSY in FYP Project Reviews. Auto-revert at 3:30 PM.',
    badgeText: 'DO NOT DISTURB',
  },
  {
    key: STATUS_KEYS.IN_LECTURE,
    label: 'In Lecture',
    subtitle: 'Lecture / Practical Lab',
    room: 'Room 528 (TE CMPN Div A)',
    note: 'Conducting Advanced Database Systems Lab',
    color: '#2563EB',
    bgColor: '#DBEAFE',
    borderColor: '#BFDBFE',
    textColor: '#1E40AF',
    icon: GraduationCap,
    studentNotification: 'Dr. Anjali Mehta is IN LECTURE in Room 528 until 1:15 PM.',
    badgeText: 'IN SESSION',
  },
  {
    key: STATUS_KEYS.OFF_CAMPUS,
    label: 'Off Campus',
    subtitle: 'Not On Campus Today',
    room: 'Off Campus',
    note: 'Attending IEEE Mumbai Chapter Faculty Colloquium',
    color: '#DC2626',
    bgColor: '#FEE2E2',
    borderColor: '#FECACA',
    textColor: '#991B1B',
    icon: DoorOpen,
    studentNotification: 'Dr. Anjali Mehta is OFF CAMPUS today. Reopening tomorrow 9:00 AM.',
    badgeText: 'UNAVAILABLE',
  },
];

export default function LandingPage() {
  const { user, role, department, logout } = useAuth();
  const router = useRouter();

  // Mobile Showcase Carousel State
  const [activeSlide, setActiveSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Status Simulator State
  const [simStateKey, setSimStateKey] = useState(STATUS_KEYS.AVAILABLE);

  // Portal tabs
  const [portalTab, setPortalTab] = useState('hod');

  // Auto-cycle carousel every 5.5s unless hovered
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % MOBILE_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const currentSimState = SIMULATOR_STATES.find((s) => s.key === simStateKey) || SIMULATOR_STATES[0];
  const activeSlideData = MOBILE_SLIDES[activeSlide];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAF8FE',
      color: '#1A191F',
      position: 'relative',
      overflowX: 'hidden',
    }}>
      {/* ── Ethereal Ambient Background Orbs ─────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: '-120px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '1000px',
        height: '600px',
        background: 'radial-gradient(ellipse at top, rgba(224, 216, 253, 0.6) 0%, rgba(206, 237, 243, 0.3) 40%, rgba(250, 248, 254, 0) 70%)',
        filter: 'blur(45px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{
        position: 'absolute',
        top: '1100px',
        right: '-150px',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(235, 212, 242, 0.45) 0%, rgba(250, 248, 254, 0) 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── TOP INSTITUTIONAL NAVIGATION BAR ───────────────────────────── */}
        <header
          id="main-nav"
          style={{
            position: 'sticky',
            top: 0,
            backdropFilter: 'blur(16px)',
            backgroundColor: 'rgba(250, 248, 254, 0.88)',
            borderBottom: '1px solid rgba(200, 197, 211, 0.5)',
            zIndex: 100,
          }}
        >
          <div style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}>
            {/* Left: Brand Identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img
                src="/profping-logo.png"
                alt="ProfPing Logo"
                style={{ height: '32px', width: 'auto', objectFit: 'contain' }}
              />
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#EDE9FE',
                color: '#492FB1',
                padding: '4px 10px',
                borderRadius: '9999px',
                fontSize: '11.5px',
                fontWeight: 700,
                letterSpacing: '0.4px',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#15803D' }} />
                CAMPUS CLARITY SYSTEM
              </span>
            </div>

            {/* Center: Navigation Links */}
            <nav style={{
              display: 'flex',
              alignItems: 'center',
              gap: '28px',
              fontSize: '14px',
              fontWeight: 600,
              color: '#4B4757',
            }}>
              <a href="#mobile-showcase" style={{ transition: 'color 0.2s', textDecoration: 'none' }} className="hover:text-violet-900">
                Mobile App
              </a>
              <a href="#live-simulator" style={{ transition: 'color 0.2s', textDecoration: 'none' }} className="hover:text-violet-900">
                Live Simulator
              </a>
              <a href="#portals" style={{ transition: 'color 0.2s', textDecoration: 'none' }} className="hover:text-violet-900">
                Portals & Access
              </a>
              <a href="#architecture" style={{ transition: 'color 0.2s', textDecoration: 'none' }} className="hover:text-violet-900">
                Security & Sync
              </a>
            </nav>

            {/* Right: Auth Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={() => {
                      if (role === 'principal') router.push('/principal');
                      else if (role === 'hod') router.push('/hod');
                      else router.push('/hod');
                    }}
                    style={{
                      backgroundColor: '#492FB1',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 18px',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(73, 47, 177, 0.25)',
                    }}
                  >
                    Open {role === 'principal' ? 'Principal' : 'HOD'} Portal
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={logout}
                    title="Sign Out"
                    style={{
                      background: 'none',
                      border: '1px solid #C8C5D3',
                      borderRadius: '10px',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      color: '#4B4757',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    id="nav-signin"
                    onClick={() => router.push('/login')}
                    style={{
                      backgroundColor: '#FFFFFF',
                      color: '#190D4A',
                      border: '1px solid #C8C5D3',
                      borderRadius: '10px',
                      padding: '8px 18px',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    Portal Login
                  </button>
                  <button
                    id="nav-get-app"
                    onClick={() => {
                      const el = document.getElementById('mobile-showcase');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{
                      backgroundColor: '#492FB1',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 18px',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(73, 47, 177, 0.28)',
                    }}
                  >
                    Explore App
                    <Smartphone size={15} />
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Hidden image preloader for instant slide switching */}
        <div style={{ display: 'none' }} aria-hidden="true">
          {MOBILE_SLIDES.map((s) => (
            <img key={s.id} src={s.image} alt="Preload" />
          ))}
        </div>

        {/* ── HERO SECTION: CAMPUS CLARITY IN ACTION ────────────────────── */}
        <section
          className="landing-hero-grid"
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '60px 24px 70px',
          }}
        >
          {/* Hero Left Content */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#EDE9FE',
              border: '1px solid rgba(73, 47, 177, 0.2)',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#492FB1',
              marginBottom: '20px',
            }}>
              <Sparkles size={14} color="#492FB1" />
              <span>ST. FRANCIS INSTITUTE OF TECHNOLOGY • REAL-TIME RADAR</span>
            </div>

            <h1 style={{
              fontSize: '48px',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-1.5px',
              color: '#190D4A',
              marginBottom: '20px',
            }}>
              Know Your Professor’s Availability{' '}
              <span style={{
                background: 'linear-gradient(135deg, #492FB1 0%, #7A4D89 60%, #0A687B 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Before You Walk Across Campus.
              </span>
            </h1>

            <p style={{
              fontSize: '17.5px',
              lineHeight: 1.6,
              color: '#4B4757',
              marginBottom: '32px',
              maxWidth: '560px',
            }}>
              ProfPing bridges college students, department faculty, and institutional administrators with
              instant 1-tap broadcasts, interactive digital twin maps, and automated desk-hour governance.
            </p>

            {/* Quick Action CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '36px' }}>
              <button
                id="hero-cta-portal"
                onClick={() => router.push(user ? (role === 'principal' ? '/principal' : '/hod') : '/login')}
                style={{
                  backgroundColor: '#492FB1',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px 26px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 8px 24px -4px rgba(73, 47, 177, 0.4)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
              >
                Access Command Portal
                <ArrowRight size={18} />
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('live-simulator');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#190D4A',
                  border: '1px solid #C8C5D3',
                  borderRadius: '12px',
                  padding: '14px 22px',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 2px 8px rgba(26, 25, 31, 0.04)',
                }}
              >
                <Radio size={16} color="#492FB1" />
                Try Live Simulator
              </button>
            </div>

            {/* Live Trust Metrics */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              paddingTop: '24px',
              borderTop: '1px solid #E5E2EB',
            }}>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#190D4A' }}>&lt; 200ms</div>
                <div style={{ fontSize: '12.5px', color: '#746F80', fontWeight: 600 }}>Sync Broadcast Latency</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#15803D' }}>4 Depts</div>
                <div style={{ fontSize: '12.5px', color: '#746F80', fontWeight: 600 }}>CMPN • ECS • EXTC • ELEC</div>
              </div>
              <div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#492FB1' }}>100% Verified</div>
                <div style={{ fontSize: '12.5px', color: '#746F80', fontWeight: 600 }}>@sfit.ac.in Domain Locked</div>
              </div>
            </div>
          </div>

          {/* Hero Right: Live Interactive Card Showcase */}
          <div style={{ position: 'relative' }}>
            {/* Background Soft Shadow Container */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              border: '1px solid #C8C5D3',
              boxShadow: '0 20px 40px -10px rgba(25, 13, 74, 0.12)',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Header inside Card */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '1px solid #F4F2FA',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src="/favicon.png" alt="Icon" style={{ width: '28px', height: '28px', borderRadius: '8px' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#190D4A' }}>Faculty Live Feed</div>
                    <div style={{ fontSize: '11.5px', color: '#746F80' }}>Realtime WebSocket Feed</div>
                  </div>
                </div>
                <span style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#15803D',
                  backgroundColor: '#DCFCE7',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#15803D' }} />
                  LIVE NOW
                </span>
              </div>

              {/* Sample Faculty 1 (Available) */}
              <div style={{
                backgroundColor: '#FAF8FE',
                borderRadius: '16px',
                border: '1px solid #E0D8FD',
                padding: '16px',
                marginBottom: '12px',
                transition: 'transform 0.2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: '#E0D8FD',
                      color: '#492FB1',
                      fontWeight: 800,
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      AM
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#190D4A' }}>Dr. Anjali Mehta</div>
                      <div style={{ fontSize: '12px', color: '#746F80' }}>CMPN • Assistant Professor</div>
                    </div>
                  </div>
                  <span style={{
                    backgroundColor: '#DCFCE7',
                    color: '#14532D',
                    border: '1px solid #86EFAC',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <CheckCircle2 size={12} color="#15803D" />
                    Available
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#4B4757', fontStyle: 'italic', marginBottom: '8px' }}>
                  "In Lab 304 conducting OS practical consultations. Walk-ins open."
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11.5px', color: '#746F80' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> Cabin 304 • Ext. 421
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> Updated 4m ago
                  </span>
                </div>
              </div>

              {/* Sample Faculty 2 (In Lecture) */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E5E2EB',
                padding: '16px',
                marginBottom: '12px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: '#DBEAFE',
                      color: '#1E40AF',
                      fontWeight: 800,
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      RK
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#190D4A' }}>Prof. Rajesh Kadam</div>
                      <div style={{ fontSize: '12px', color: '#746F80' }}>ELEC • Associate Professor</div>
                    </div>
                  </div>
                  <span style={{
                    backgroundColor: '#DBEAFE',
                    color: '#1E40AF',
                    border: '1px solid #BFDBFE',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <GraduationCap size={12} color="#2563EB" />
                    In Lecture
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#4B4757', fontStyle: 'italic', marginBottom: '8px' }}>
                  "Conducting Electrical Machines Lab with TE Batch B"
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11.5px', color: '#746F80' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> Lab 102 • Ground Floor
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> Reverts in 35m
                  </span>
                </div>
              </div>

              {/* Sample Faculty 3 (Busy) */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1px solid #E5E2EB',
                padding: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      backgroundColor: '#FEF3C7',
                      color: '#92400E',
                      fontWeight: 800,
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      KS
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#190D4A' }}>Dr. Kavita Sonawane</div>
                      <div style={{ fontSize: '12px', color: '#746F80' }}>CMPN • Department HOD</div>
                    </div>
                  </div>
                  <span style={{
                    backgroundColor: '#FEF3C7',
                    color: '#78350F',
                    border: '1px solid #FDE68A',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <Clock size={12} color="#D97706" />
                    Busy
                  </span>
                </div>
                <div style={{ fontSize: '12.5px', color: '#4B4757', fontStyle: 'italic', marginBottom: '8px' }}>
                  "NBA Accreditation & Academic Council Committee Meeting"
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11.5px', color: '#746F80' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={12} /> HOD Cabin 301
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> Updated 18m ago
                  </span>
                </div>
              </div>
            </div>

            {/* Floating Student Ping Badge */}
            <div style={{
              position: 'absolute',
              bottom: '-20px',
              left: '-20px',
              backgroundColor: '#190D4A',
              color: '#FFFFFF',
              borderRadius: '16px',
              padding: '12px 18px',
              boxShadow: '0 12px 28px -4px rgba(25, 13, 74, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              border: '1px solid rgba(224, 216, 253, 0.25)',
            }}>
              <div style={{
                backgroundColor: '#10B981',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Bell size={16} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 800 }}>Student Alert Dispatched</div>
                <div style={{ fontSize: '11px', color: '#C8C5D3' }}>"Prof. Anjali is now Available!"</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 2: MOBILE APP INTRO EXPERIENCE (EXACT 4 SLIDES REFERENCE) ── */}
        <section
          id="mobile-showcase"
          style={{
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #E5E2EB',
            borderBottom: '1px solid #E5E2EB',
            padding: '80px 24px',
          }}
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
            {/* Section Header */}
            <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 50px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#EDE9FE',
                color: '#492FB1',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '12.5px',
                fontWeight: 700,
                marginBottom: '14px',
              }}>
                <Smartphone size={14} color="#492FB1" />
                MOBILE COMPANION SUITE
              </div>
              <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#190D4A', letterSpacing: '-0.8px', marginBottom: '12px' }}>
                Engineered for Swift Pocket Intelligence
              </h2>
              <p style={{ fontSize: '16px', color: '#4B4757', lineHeight: 1.5 }}>
                Directly mirroring the native mobile experience with responsive 1-tap broadcasts,
                floor-by-floor cabin navigation, and zero-wasted-walk notifications.
              </p>
            </div>

            {/* Slide Navigation Tabs */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '36px',
              flexWrap: 'wrap',
            }}>
              {MOBILE_SLIDES.map((slide, idx) => {
                const isSelected = idx === activeSlide;
                return (
                  <button
                    key={slide.id}
                    onClick={() => setActiveSlide(idx)}
                    style={{
                      backgroundColor: isSelected ? '#190D4A' : '#FAF8FE',
                      color: isSelected ? '#FFFFFF' : '#4B4757',
                      border: isSelected ? '1px solid #190D4A' : '1px solid #C8C5D3',
                      borderRadius: '12px',
                      padding: '10px 18px',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <span style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: isSelected ? '#492FB1' : '#E5E2EB',
                      color: isSelected ? '#FFFFFF' : '#1A191F',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                    }}>
                      {idx + 1}
                    </span>
                    {slide.headline}
                  </button>
                );
              })}
            </div>

            {/* Interactive Slide Viewer Showcase */}
            <div
              className="landing-showcase-grid"
              style={{
                backgroundColor: '#FAF8FE',
                borderRadius: '24px',
                border: '1px solid #C8C5D3',
                boxShadow: '0 16px 36px -8px rgba(25, 13, 74, 0.08)',
                padding: '40px',
              }}
            >
              {/* Left Column: Visual Mockup from Assets */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
              }}>
                <div style={{
                  position: 'relative',
                  width: '320px',
                  height: '420px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '28px',
                  border: '8px solid #190D4A',
                  boxShadow: '0 24px 48px -12px rgba(25, 13, 74, 0.25)',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {/* Dynamic Slide Image */}
                  <img
                    src={activeSlideData.image}
                    alt={activeSlideData.headline}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'opacity 0.3s ease-in-out',
                    }}
                  />

                  {/* Corner Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    backgroundColor: 'rgba(25, 13, 74, 0.85)',
                    backdropFilter: 'blur(8px)',
                    color: '#FFFFFF',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    letterSpacing: '0.4px',
                  }}>
                    {activeSlideData.tag}
                  </div>
                </div>
              </div>

              {/* Right Column: Slide Text & Features */}
              <div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: activeSlideData.accentBg,
                  color: activeSlideData.accentColor,
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  letterSpacing: '0.5px',
                  marginBottom: '14px',
                }}>
                  {activeSlideData.badge}
                </div>

                <h3 style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  color: '#190D4A',
                  letterSpacing: '-0.5px',
                  marginBottom: '16px',
                }}>
                  {activeSlideData.headline}
                </h3>

                <p style={{
                  fontSize: '17px',
                  lineHeight: 1.6,
                  color: '#4B4757',
                  marginBottom: '28px',
                }}>
                  {activeSlideData.body}
                </p>

                {/* Key feature pills */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                  {activeSlideData.keyFeatures.map((feat, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '14.5px',
                        color: '#1A191F',
                        fontWeight: 600,
                      }}
                    >
                      <span style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#DCFCE7',
                        color: '#15803D',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Check size={12} strokeWidth={3} />
                      </span>
                      {feat}
                    </div>
                  ))}
                </div>

                {/* Progress Indicators & Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {MOBILE_SLIDES.map((_, i) => (
                      <span
                        key={i}
                        onClick={() => setActiveSlide(i)}
                        style={{
                          width: i === activeSlide ? '28px' : '8px',
                          height: '8px',
                          borderRadius: '9999px',
                          backgroundColor: i === activeSlide ? '#492FB1' : '#C8C5D3',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          display: 'inline-block',
                        }}
                      />
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setActiveSlide((prev) => (prev - 1 + MOBILE_SLIDES.length) % MOBILE_SLIDES.length)}
                      style={{
                        border: '1px solid #C8C5D3',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        color: '#190D4A',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={() => setActiveSlide((prev) => (prev + 1) % MOBILE_SLIDES.length)}
                      style={{
                        border: '1px solid #C8C5D3',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        color: '#190D4A',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: LIVE CAMPUS CLARITY SIMULATOR ────────────────────── */}
        <section
          id="live-simulator"
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '80px 24px',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '740px', margin: '0 auto 40px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#CEEDF3',
              color: '#0A687B',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: 700,
              marginBottom: '14px',
            }}>
              <Activity size={14} color="#0A687B" />
              INTERACTIVE STATUS TELEMETRY
            </div>
            <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#190D4A', letterSpacing: '-0.8px', marginBottom: '12px' }}>
              The 4 Campus Clarity Signal States
            </h2>
            <p style={{ fontSize: '16px', color: '#4B4757', lineHeight: 1.5 }}>
              Click on any status pill below to simulate how faculty broadcasts instantly transform
              the student directory card and dispatch real-time campus notifications.
            </p>
          </div>

          {/* 4 State Clickable Selector */}
          <div
            className="landing-state-selector-grid"
            style={{
              marginBottom: '36px',
            }}
          >
            {SIMULATOR_STATES.map((st) => {
              const isSelected = st.key === simStateKey;
              const IconComp = st.icon;
              return (
                <div
                  key={st.key}
                  onClick={() => setSimStateKey(st.key)}
                  style={{
                    backgroundColor: isSelected ? st.bgColor : '#FFFFFF',
                    border: isSelected ? `2px solid ${st.color}` : '1px solid #C8C5D3',
                    borderRadius: '16px',
                    padding: '18px 20px',
                    cursor: 'pointer',
                    boxShadow: isSelected ? `0 8px 20px -4px ${st.color}33` : '0 2px 6px rgba(26, 25, 31, 0.04)',
                    transition: 'all 0.2s',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? st.color : st.bgColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <IconComp size={16} color={isSelected ? '#FFFFFF' : st.color} />
                    </div>
                    {isSelected && (
                      <span style={{
                        backgroundColor: st.color,
                        color: '#FFFFFF',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                      }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: isSelected ? st.textColor : '#190D4A' }}>
                    {st.label}
                  </div>
                  <div style={{ fontSize: '12px', color: '#746F80' }}>
                    {st.subtitle}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Simulator Visualizer Grid */}
          <div
            className="landing-simulator-grid"
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              border: '1px solid #C8C5D3',
              boxShadow: '0 16px 32px -8px rgba(25, 13, 74, 0.08)',
              padding: '36px',
            }}
          >
            {/* Live Card Render */}
            <div style={{
              backgroundColor: '#FAF8FE',
              borderRadius: '20px',
              border: `2px solid ${currentSimState.borderColor}`,
              padding: '28px',
              boxShadow: '0 8px 24px -4px rgba(26, 25, 31, 0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img
                    src="/faculty-anjali.jpg"
                    alt="Dr. Anjali Mehta"
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: `2px solid ${currentSimState.color}`,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#190D4A' }}>Dr. Anjali Mehta</div>
                    <div style={{ fontSize: '13px', color: '#746F80' }}>Department of Computer Engineering • Cabin 304</div>
                  </div>
                </div>

                <div style={{
                  backgroundColor: currentSimState.bgColor,
                  color: currentSimState.textColor,
                  border: `1px solid ${currentSimState.borderColor}`,
                  fontSize: '13px',
                  fontWeight: 700,
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: currentSimState.color }} />
                  {currentSimState.label}
                </div>
              </div>

              {/* Dynamic Note */}
              <div style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E5E2EB',
                padding: '14px 18px',
                fontSize: '14px',
                color: '#1A191F',
                fontStyle: 'italic',
                marginBottom: '16px',
              }}>
                "{currentSimState.note}"
              </div>

              {/* Meta details */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12.5px', color: '#746F80' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="#492FB1" /> {currentSimState.room}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} color="#746F80" /> Broadcasted Just Now via Mobile
                </span>
              </div>
            </div>

            {/* Instant Push Notification Simulation */}
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#492FB1', letterSpacing: '0.5px', marginBottom: '8px' }}>
                STUDENT WATCHLIST PUSH NOTIFICATION
              </div>
              <div style={{
                backgroundColor: '#190D4A',
                color: '#FFFFFF',
                borderRadius: '18px',
                padding: '20px',
                boxShadow: '0 12px 28px -6px rgba(25, 13, 74, 0.4)',
                border: '1px solid rgba(224, 216, 253, 0.2)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    backgroundColor: currentSimState.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Bell size={14} color="#FFFFFF" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 800 }}>ProfPing Campus Alert</div>
                    <div style={{ fontSize: '11px', color: '#C8C5D3' }}>Now • High Priority Push</div>
                  </div>
                </div>

                <div style={{ fontSize: '13.5px', lineHeight: 1.5, color: '#E0D8FD', marginBottom: '14px' }}>
                  {currentSimState.studentNotification}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(200, 197, 211, 0.2)',
                  fontSize: '11.5px',
                  color: '#C8C5D3',
                }}>
                  <span>Policy: Student Access Scoped</span>
                  <span style={{ color: '#86EFAC', fontWeight: 700 }}>Delivered in 180ms</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: INSTITUTIONAL PORTALS & ROLE ECOSYSTEM ───────────── */}
        <section
          id="portals"
          style={{
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #E5E2EB',
            borderBottom: '1px solid #E5E2EB',
            padding: '80px 24px',
          }}
        >
          <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto 50px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#EDE9FE',
                color: '#492FB1',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '12.5px',
                fontWeight: 700,
                marginBottom: '14px',
              }}>
                <Building2 size={14} color="#492FB1" />
                FOUR INTERCONNECTED ROLES
              </div>
              <h2 style={{ fontSize: '36px', fontWeight: 800, color: '#190D4A', letterSpacing: '-0.8px', marginBottom: '12px' }}>
                Unified Governance Across Campus
              </h2>
              <p style={{ fontSize: '16px', color: '#4B4757', lineHeight: 1.5 }}>
                Every campus stakeholder is equipped with a specialized viewport designed
                strictly for their academic responsibilities.
              </p>
            </div>

            {/* 4 Cards Grid */}
            <div className="landing-roles-grid">
              {/* Card 1: Students */}
              <div style={{
                backgroundColor: '#FAF8FE',
                borderRadius: '20px',
                border: '1px solid #C8C5D3',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#E0D8FD',
                    color: '#492FB1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}>
                    <Smartphone size={22} />
                  </div>
                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#492FB1', letterSpacing: '0.4px', marginBottom: '4px' }}>
                    MOBILE APP
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#190D4A', marginBottom: '10px' }}>
                    For Students
                  </h3>
                  <p style={{ fontSize: '13.5px', color: '#4B4757', lineHeight: 1.5, marginBottom: '20px' }}>
                    Search professors, view cabin room numbers, track live desk states, and get auto-notified the instant faculty become free.
                  </p>
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#492FB1' }}>
                  Included in Expo iOS & Android App
                </div>
              </div>

              {/* Card 2: Faculty */}
              <div style={{
                backgroundColor: '#FAF8FE',
                borderRadius: '20px',
                border: '1px solid #C8C5D3',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#DCFCE7',
                    color: '#15803D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}>
                    <Radio size={22} />
                  </div>
                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#15803D', letterSpacing: '0.4px', marginBottom: '4px' }}>
                    1-TAP BROADCASTER
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#190D4A', marginBottom: '10px' }}>
                    For Faculty
                  </h3>
                  <p style={{ fontSize: '13.5px', color: '#4B4757', lineHeight: 1.5, marginBottom: '20px' }}>
                    Broadcast availability with 1 tap, attach lecture lab notes, and configure timetable auto-reverts so student queries never interrupt classes.
                  </p>
                </div>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#15803D' }}>
                  Protected by SFIT Faculty Claims
                </div>
              </div>

              {/* Card 3: Department HODs */}
              <div style={{
                backgroundColor: '#FAF8FE',
                borderRadius: '20px',
                border: '1.5px solid #492FB1',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 8px 20px -4px rgba(73, 47, 177, 0.15)',
              }}>
                <div>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#190D4A',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}>
                    <Laptop size={22} />
                  </div>
                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#492FB1', letterSpacing: '0.4px', marginBottom: '4px' }}>
                    WEB COMMAND CENTER
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#190D4A', marginBottom: '10px' }}>
                    For Department HODs
                  </h3>
                  <p style={{ fontSize: '13.5px', color: '#4B4757', lineHeight: 1.5, marginBottom: '20px' }}>
                    Provision faculty roster, manage cabin and intercom allocations, oversee department desk-hours, and control student access switches.
                  </p>
                </div>
                <button
                  onClick={() => router.push(user && role === 'hod' ? '/hod' : '/login')}
                  style={{
                    backgroundColor: '#492FB1',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '8px 14px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  Enter HOD Portal
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Card 4: Principal & Deans */}
              <div style={{
                backgroundColor: '#FAF8FE',
                borderRadius: '20px',
                border: '1px solid #C8C5D3',
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#CEEDF3',
                    color: '#0A687B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '16px',
                  }}>
                    <Award size={22} />
                  </div>
                  <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#0A687B', letterSpacing: '0.4px', marginBottom: '4px' }}>
                    EXECUTIVE ANALYTICS
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#190D4A', marginBottom: '10px' }}>
                    For Principal
                  </h3>
                  <p style={{ fontSize: '13.5px', color: '#4B4757', lineHeight: 1.5, marginBottom: '20px' }}>
                    Institutional overview of campus faculty telemetry, cross-department desk hour compliance, and system-wide security policies.
                  </p>
                </div>
                <button
                  onClick={() => router.push(user && role === 'principal' ? '/principal' : '/login')}
                  style={{
                    backgroundColor: '#FFFFFF',
                    color: '#190D4A',
                    border: '1px solid #C8C5D3',
                    borderRadius: '10px',
                    padding: '8px 14px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  Principal Suite
                  <ExternalLink size={13} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 5: SECURITY & ARCHITECTURE GUARANTEES ───────────────── */}
        <section
          id="architecture"
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '80px 24px',
          }}
        >
          <div
            className="landing-security-grid"
            style={{
              backgroundColor: '#190D4A',
              color: '#FFFFFF',
              borderRadius: '28px',
              padding: '50px 40px',
              boxShadow: '0 24px 48px -12px rgba(25, 13, 74, 0.45)',
            }}
          >
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'rgba(224, 216, 253, 0.15)',
                color: '#E0D8FD',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 700,
                marginBottom: '16px',
              }}>
                <ShieldCheck size={14} color="#86EFAC" />
                INSTITUTIONAL GRADE SECURITY ARCHITECTURE
              </div>
              <h2 style={{ fontSize: '34px', fontWeight: 800, lineHeight: 1.2, marginBottom: '16px' }}>
                Engineered Specifically for SFIT Campus Governance
              </h2>
              <p style={{ fontSize: '15.5px', color: '#C8C5D3', lineHeight: 1.6, marginBottom: '28px' }}>
                ProfPing enforces strict institutional boundaries. Access is cryptographically
                validated through Firebase Authentication with custom token claims, scoped database rules,
                and immutable audit logs.
              </p>

              <div className="landing-security-features-grid">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckCircle2 size={18} color="#86EFAC" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>Domain Whitelisting</div>
                    <div style={{ fontSize: '12px', color: '#C8C5D3' }}>Restricted to @sfit.ac.in emails</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckCircle2 size={18} color="#86EFAC" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>Department Scoping</div>
                    <div style={{ fontSize: '12px', color: '#C8C5D3' }}>HOD controls only their department</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckCircle2 size={18} color="#86EFAC" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>Zero Data Wipes</div>
                    <div style={{ fontSize: '12px', color: '#C8C5D3' }}>Historical audit logs preserved forever</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckCircle2 size={18} color="#86EFAC" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700 }}>Kill Switch Ready</div>
                    <div style={{ fontSize: '12px', color: '#C8C5D3' }}>Instant revocation of student app access</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Login Shortcut Card */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '20px',
              border: '1px solid rgba(224, 216, 253, 0.2)',
              padding: '30px',
              textAlign: 'center',
            }}>
              <img
                src="/profping-icon.jpg"
                alt="ProfPing Logo"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 18px rgba(0, 0, 0, 0.3)',
                }}
              />
              <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '6px' }}>
                Launch ProfPing Portal
              </h3>
              <p style={{ fontSize: '13px', color: '#C8C5D3', marginBottom: '20px' }}>
                Department HODs, Faculty Members, and Academic Leadership can sign in directly with their verified SFIT Google Workspace credentials.
              </p>
              <button
                onClick={() => router.push('/login')}
                style={{
                  backgroundColor: '#FFFFFF',
                  color: '#190D4A',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '14.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
                }}
              >
                Sign In to Portal
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <footer style={{
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E5E2EB',
          padding: '40px 24px',
          color: '#4B4757',
        }}>
          <div style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img src="/profping-logo.png" alt="ProfPing" style={{ height: '26px' }} />
              <span style={{ fontSize: '13px', color: '#746F80' }}>
                © {new Date().getFullYear()} St. Francis Institute of Technology (SFIT). All rights reserved.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '13px', fontWeight: 600 }}>
              <button onClick={() => router.push('/login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#492FB1', fontWeight: 700 }}>
                HOD Portal
              </button>
              <button onClick={() => router.push('/login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#492FB1', fontWeight: 700 }}>
                Principal Portal
              </button>
              <span style={{ color: '#15803D', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#15803D' }} />
                Operational v2.4
              </span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
