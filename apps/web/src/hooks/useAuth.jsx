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

const AuthContext = createContext({
  user: null,
  role: null,
  department: null,
  claims: null,
  profile: null,
  loading: true,
  error: null,
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Force refresh ID token to retrieve newly assigned custom claims
          const tokenResult = await currentUser.getIdTokenResult(true);
          const userClaims = tokenResult.claims || {};
          
          let userRole = userClaims.role || null;
          let userDept = userClaims.department || null;

          // Fallback: Check /users/{uid} in Realtime Database if custom claims not yet propagated
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
              console.warn('Could not read user profile fallback:', dbErr.message);
            }
          }

          setUser(currentUser);
          setRole(userRole);
          setDepartment(userDept);
          setClaims(userClaims);
        } catch (err) {
          console.error('Error fetching auth token result:', err);
          setUser(currentUser);
        }
      } else {
        setUser(null);
        setRole(null);
        setDepartment(null);
        setClaims(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Validate email belongs to institution domain
   */
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
    const cred = await signInWithEmailAndPassword(auth, validEmail, password);
    const tokenResult = await cred.user.getIdTokenResult(true);
    const userRole = tokenResult.claims?.role || null;
    const userDept = tokenResult.claims?.department || null;
    setUser(cred.user);
    setRole(userRole);
    setDepartment(userDept);
    setClaims(tokenResult.claims);
    return { user: cred.user, role: userRole, department: userDept };
  };

  const signup = async (email, password, displayName, dept = null) => {
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
    await fbSignOut(auth);
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
