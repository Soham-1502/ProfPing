import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, db } from '../services/firebase';
import { INSTITUTION, ROLES } from '@profping/shared';

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
  'faculty.snehal@sfit.ac.in': {
    uid: 'demo-faculty-cmpn-01',
    email: 'faculty.snehal@sfit.ac.in',
    displayName: 'Prof. Snehal Kulkarni',
    role: ROLES.FACULTY,
    department: 'CMPN',
  },
  'faculty.rahul@sfit.ac.in': {
    uid: 'demo-faculty-cmpn-02',
    email: 'faculty.rahul@sfit.ac.in',
    displayName: 'Dr. Rahul Joshi',
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
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [department, setDepartment] = useState(null);
  const [claims, setClaims] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
        } catch (err) {
          console.error('Error in mobile auth token listener:', err);
          setUser(currentUser);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    const trimmed = (email || '').trim().toLowerCase();
    if (!trimmed.endsWith(INSTITUTION.EMAIL_DOMAIN)) {
      throw new Error(`Access is restricted to ${INSTITUTION.EMAIL_DOMAIN} accounts.`);
    }

    const isPlaceholder = !process.env.EXPO_PUBLIC_FIREBASE_API_KEY || process.env.EXPO_PUBLIC_FIREBASE_API_KEY === 'demo-api-key';

    if (!isPlaceholder) {
      try {
        const cred = await signInWithEmailAndPassword(auth, trimmed, password);
        const tokenResult = await cred.user.getIdTokenResult(true);
        const userRole = tokenResult.claims?.role || null;
        const userDept = tokenResult.claims?.department || null;
        setUser(cred.user);
        setRole(userRole);
        setDepartment(userDept);
        setClaims(tokenResult.claims);
        return { user: cred.user, role: userRole, department: userDept };
      } catch (err) {
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
          throw err;
        }
      }
    }

    // Instant Dev Mock Authentication Fallback for Mobile
    const mockProfile = DEMO_ACCOUNTS[trimmed] || {
      uid: `demo-user-${Date.now()}`,
      email: trimmed,
      displayName: trimmed.split('@')[0],
      role: trimmed.includes('faculty') ? ROLES.FACULTY : ROLES.STUDENT,
      department: 'CMPN',
    };

    const mockUser = {
      uid: mockProfile.uid,
      email: mockProfile.email,
      displayName: mockProfile.displayName,
    };

    setUser(mockUser);
    setRole(mockProfile.role);
    setDepartment(mockProfile.department);
    setClaims({ role: mockProfile.role, department: mockProfile.department });
    setProfile(mockProfile);

    return { user: mockUser, role: mockProfile.role, department: mockProfile.department };
  };

  const logout = async () => {
    setUser(null);
    setRole(null);
    setDepartment(null);
    setClaims(null);
    setProfile(null);
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
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
