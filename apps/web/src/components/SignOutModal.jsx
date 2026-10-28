'use client';

import React, { useEffect, useState } from 'react';
import { LogOut, AlertTriangle, X } from 'lucide-react';

export default function SignOutModal({ isOpen, onClose, onConfirm, portalName = 'Portal' }) {
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !signingOut) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, signingOut]);

  if (!isOpen) return null;

  const handleConfirmClick = async () => {
    setSigningOut(true);
    try {
      await onConfirm();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(26, 25, 31, 0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !signingOut) {
          onClose();
        }
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div
        style={{
          maxWidth: '430px',
          width: '100%',
          backgroundColor: '#FFFFFF',
          border: '1px solid #C8C5D3',
          borderRadius: '18px',
          padding: '28px 24px',
          boxShadow: '0 24px 48px -12px rgba(25, 13, 74, 0.28), 0 4px 16px rgba(0, 0, 0, 0.06)',
          animation: 'slideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={signingOut}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'none',
            border: 'none',
            color: '#746F80',
            cursor: signingOut ? 'not-allowed' : 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#1A191F')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#746F80')}
        >
          <X size={18} />
        </button>

        {/* Warning Icon Badge */}
        <div
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#FFDAD6',
            color: '#BA1A1A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <LogOut size={22} color="#BA1A1A" />
        </div>

        {/* Header */}
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 800,
            color: '#1A191F',
            margin: '0 0 8px 0',
            letterSpacing: '-0.02em',
          }}
        >
          Sign Out of {portalName}?
        </h3>

        {/* Body Text */}
        <p
          style={{
            fontSize: '13.5px',
            color: '#4B4757',
            lineHeight: '1.5',
            margin: '0 0 24px 0',
          }}
        >
          Are you sure you want to end your current session? You will be signed out of the command portal and redirected to the login screen.
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={signingOut}
            style={{
              padding: '10px 18px',
              borderRadius: '9999px',
              border: '1px solid #C8C5D3',
              backgroundColor: '#F4F2FA',
              color: '#4B4757',
              fontSize: '13px',
              fontWeight: 700,
              cursor: signingOut ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E0D8FD';
              e.currentTarget.style.color = '#190D4A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#F4F2FA';
              e.currentTarget.style.color = '#4B4757';
            }}
          >
            Stay Signed In
          </button>

          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={signingOut}
            style={{
              padding: '10px 20px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: '#BA1A1A',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 700,
              cursor: signingOut ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(186, 26, 26, 0.28)',
              transition: 'all 0.15s ease',
              opacity: signingOut ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#93000A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#BA1A1A';
            }}
          >
            <LogOut size={14} />
            {signingOut ? 'Signing Out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    </div>
  );
}
