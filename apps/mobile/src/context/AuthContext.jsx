import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, db } from '../services/firebase';
import { INSTITUTION } from '@profping/shared';

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
          // Force refresh ID token for latest custom claims
          const tokenResult = await currentUser.getIdTokenResult(true);
          const userClaims = tokenResult.claims || {};
          let userRole = userClaims.role || null;
          let userDept = userClaims.department || null;

          // Fallback to /users/{uid} in Realtime Database
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
              console.warn('Realtime DB profile read fallback note:', dbErr.message);
            }
          }

          setUser(currentUser);
          setRole(userRole);
          setDepartment(userDept);
          setClaims(userClaims);
        } catch (err) {
          console.error('Error fetching mobile token result:', err);
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

  const login = async (email, password) => {
    const trimmed = (email || '').trim().toLowerCase();
    if (!trimmed.endsWith(INSTITUTION.EMAIL_DOMAIN)) {
      throw new Error(`Access is restricted to ${INSTITUTION.EMAIL_DOMAIN} accounts.`);
    }

    const cred = await signInWithEmailAndPassword(auth, trimmed, password);
    const tokenResult = await cred.user.getIdTokenResult(true);
    const userRole = tokenResult.claims?.role || null;
    const userDept = tokenResult.claims?.department || null;
    setUser(cred.user);
    setRole(userRole);
    setDepartment(userDept);
    setClaims(tokenResult.claims);
    return { user: cred.user, role: userRole, department: userDept };
  };

  const logout = async () => {
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
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
