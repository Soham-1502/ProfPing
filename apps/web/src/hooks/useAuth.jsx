'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, db } from '../lib/firebase';
import { INSTITUTION, ROLES } from '@profping/shared';

// Standard mock demo profiles for instant UI & RBAC testing without external keys
const DEMO_ACCOUNTS = {
  'principal@sfit.ac.in': {
    uid: 'demo-principal-01',
    email: 'principal@sfit.ac.in',
    displayName: 'Dr. S. S. Rathod',
    role: ROLES.PRINCIPAL,
    department: null,
  },
  'hod.cmpn@sfit.ac.in': {
    uid: 'demo-hod-cmpn-01',
    email: 'hod.cmpn@sfit.ac.in',
    displayName: 'Dr. Kavita Sonawane',
    role: ROLES.HOD,
    department: 'CMPN',
  },
  'hod.inft@sfit.ac.in': {
    uid: 'demo-hod-inft-01',
    email: 'hod.inft@sfit.ac.in',
    displayName: 'Dr. Joanne Gomes',
    role: ROLES.HOD,
    department: 'INFT',
  },
  'faculty.snehal@sfit.ac.in': {
    uid: 'demo-faculty-cmpn-01',
    email: 'faculty.snehal@sfit.ac.in',
    displayName: 'Prof. Snehal Kulkarni',
    role: ROLES.FACULTY,
    department: 'CMPN',
  },
  'student@sfit.ac.in': {
    uid: 'demo-student-cmpn-01',
    email: 'student@sfit.ac.in',
    displayName: 'Soham Tamhankar',
    role: ROLES.STUDENT,
    department: 'CMPN',
  },
};

const AuthContext = createContext({
  user: null,
  role: null,
  department: null,
  claims: null,
  profile: null,
  loading: true,
  error: null,
  isMockMode: false,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [department, setDepartment] = useState(null);
  const [claims, setClaims] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMockMode, setIsMockMode] = useState(false);

  useEffect(() => {
    // 1. Check for stored dev mock session
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('profping_dev_session');
      if (stored) {
        try {
          const session = JSON.parse(stored);
          setUser({ uid: session.uid, email: session.email, displayName: session.displayName });
          setRole(session.role);
          setDepartment(session.department);
          setClaims({ role: session.role, department: session.department });
          setProfile(session);
          setIsMockMode(true);
          setLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem('profping_dev_session');
        }
      }
    }

    // 2. Firebase live auth listener
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const tokenResult = await currentUser.getIdTokenResult(true);
          const userClaims = tokenResult.claims || {};
          let userRole = userClaims.role || null;
          let userDept = userClaims.department || null;

          if (!userRole) {
            try {
              const snapshot = await get(ref(db, `users/${currentUser.uid}`));
              if (snapshot.exists()) {
                const data = snapshot.val();
                userRole = data.role || null;
                userDept = data.department || null;
                setProfile(data);
              }
            } catch (dbErr) {
              console.warn('Realtime DB read note:', dbErr.message);
            }
          }

          setUser(currentUser);
          setRole(userRole);
          setDepartment(userDept);
          setClaims(userClaims);
          setIsMockMode(false);
        } catch (err) {
          console.error('Error in auth token listener:', err);
          setUser(currentUser);
        }
      } else {
        // Clear only if not using mock session
        if (typeof window !== 'undefined' && !localStorage.getItem('profping_dev_session')) {
          setUser(null);
          setRole(null);
          setDepartment(null);
          setClaims(null);
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const validateEmail = (email) => {
    const trimmed = (email || '').trim().toLowerCase();
    if (!trimmed.endsWith(INSTITUTION.EMAIL_DOMAIN)) {
      throw new Error(`Only institutional email addresses (${INSTITUTION.EMAIL_DOMAIN}) are permitted.`);
    }
    return trimmed;
  };

  const login = async (email, password) => {
    setError(null);
    const validEmail = validateEmail(email);

    // Try live Firebase Auth first if real keys are configured
    const isPlaceholderKey = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'demo-api-key';

    if (!isPlaceholderKey) {
      try {
        const cred = await signInWithEmailAndPassword(auth, validEmail, password);
        const tokenResult = await cred.user.getIdTokenResult(true);
        const userRole = tokenResult.claims?.role || null;
        const userDept = tokenResult.claims?.department || null;
        setUser(cred.user);
        setRole(userRole);
        setDepartment(userDept);
        setClaims(tokenResult.claims);
        setIsMockMode(false);
        if (typeof window !== 'undefined') localStorage.removeItem('profping_dev_session');
        return { user: cred.user, role: userRole, department: userDept };
      } catch (fbErr) {
        // If not a credential error, fallback to demo mode
        if (fbErr.code !== 'auth/invalid-credential' && fbErr.code !== 'auth/wrong-password') {
          console.warn('Firebase error, falling back to Dev Mock Mode:', fbErr.message);
        } else {
          throw fbErr;
        }
      }
    }

    // Instant Dev Mock Authentication Fallback
    const mockProfile = DEMO_ACCOUNTS[validEmail] || {
      uid: `demo-user-${Date.now()}`,
      email: validEmail,
      displayName: validEmail.split('@')[0],
      role: validEmail.includes('principal')
        ? ROLES.PRINCIPAL
        : validEmail.includes('hod')
        ? ROLES.HOD
        : validEmail.includes('faculty')
        ? ROLES.FACULTY
        : ROLES.STUDENT,
      department: validEmail.includes('inft') ? 'INFT' : 'CMPN',
    };

    const mockUser = {
      uid: mockProfile.uid,
      email: mockProfile.email,
      displayName: mockProfile.displayName,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('profping_dev_session', JSON.stringify(mockProfile));
    }

    setUser(mockUser);
    setRole(mockProfile.role);
    setDepartment(mockProfile.department);
    setClaims({ role: mockProfile.role, department: mockProfile.department });
    setProfile(mockProfile);
    setIsMockMode(true);

    return { user: mockUser, role: mockProfile.role, department: mockProfile.department };
  };

  const signup = async (email, password, displayName) => {
    setError(null);
    const validEmail = validateEmail(email);
    const cred = await createUserWithEmailAndPassword(auth, validEmail, password);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    return cred.user;
  };

  const logout = async () => {
    setError(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('profping_dev_session');
    }
    setUser(null);
    setRole(null);
    setDepartment(null);
    setClaims(null);
    setProfile(null);
    setIsMockMode(false);
    try {
      await fbSignOut(auth);
    } catch (e) {
      // ignore in dev mock mode
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        department,
        claims,
        profile,
        loading,
        error,
        isMockMode,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
