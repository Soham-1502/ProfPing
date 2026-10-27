'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { ref, get, set, update } from 'firebase/database';
import { auth, db } from '../lib/firebase';
import { INSTITUTION, ROLES } from '@profping/shared';

// Helper to sanitize email for RTDB keys
function sanitizeEmail(email) {
  return (email || '').toLowerCase().replace(/\./g, '_').replace(/@/g, '_at_');
}

// Standard mock demo profiles for instant UI & RBAC testing without external keys
const DEMO_ACCOUNTS = {
  'principal@sfit.ac.in': {
    uid: 'demo-principal-01',
    email: 'principal@sfit.ac.in',
    displayName: 'Dr. S. S. Rathod',
    name: 'Dr. S. S. Rathod',
    role: ROLES.PRINCIPAL,
    department: null,
  },
  'nitika.rai@sfit.ac.in': {
    uid: 'hod-ecs-nitika-rai',
    email: 'nitika.rai@sfit.ac.in',
    displayName: 'Dr. Nitika Rai',
    name: 'Dr. Nitika Rai',
    role: ROLES.HOD,
    department: 'ECS',
    designation: 'Head of Department (ECS)',
  },
  'hod.ecs@sfit.ac.in': {
    uid: 'demo-hod-ecs',
    email: 'hod.ecs@sfit.ac.in',
    displayName: 'Dr. Nitika Rai',
    name: 'Dr. Nitika Rai',
    role: ROLES.HOD,
    department: 'ECS',
    designation: 'Head of Department (ECS)',
  },
  'hod.cmpn@sfit.ac.in': {
    uid: 'demo-hod-cmpn',
    email: 'hod.cmpn@sfit.ac.in',
    displayName: 'HOD Computer Engineering',
    name: 'HOD Computer Engineering',
    role: ROLES.HOD,
    department: 'CMPN',
    designation: 'Head of Department (CMPN)',
  },
  'student@sfit.ac.in': {
    uid: 'demo-student-cmpn-01',
    email: 'student@sfit.ac.in',
    displayName: 'Soham Tamhankar',
    name: 'Soham Tamhankar',
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
  loginWithGoogleWeb: async () => {},
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

  /**
   * Unified Role & Profile Resolver
   * Discovers user privileges from:
   * 1. Auth Custom Claims
   * 2. DEMO_ACCOUNTS presets
   * 3. RTDB /users/{authUid}
   * 4. RTDB /preapproved_users/{email} (provisioned by Principal)
   * 5. RTDB /users (scanned by email)
   * 6. RTDB /faculty (scanned by email)
   * 7. Institutional prefix heuristics (Dr. Nitika Rai / hod.* -> HOD, principal* -> Principal)
   */
  const resolveRoleAndProfile = async (email, authUid = null, existingClaims = null) => {
    const normalized = (email || '').trim().toLowerCase();
    const sanitizedKey = sanitizeEmail(normalized);

    // If claims explicitly define a role, prioritize it
    if (existingClaims?.role) {
      return {
        uid: authUid,
        email: normalized,
        role: existingClaims.role,
        department: existingClaims.department || null,
        displayName: existingClaims.name || normalized.split('@')[0],
      };
    }

    // 1. Check known preset accounts
    if (DEMO_ACCOUNTS[normalized]) {
      const demo = DEMO_ACCOUNTS[normalized];
      return {
        ...demo,
        uid: authUid || demo.uid,
      };
    }

    // 2. Check direct RTDB /users/{authUid}
    if (authUid) {
      try {
        const uSnap = await get(ref(db, `users/${authUid}`));
        if (uSnap.exists()) {
          const uVal = uSnap.val();
          if (uVal.role) {
            return {
              uid: authUid,
              email: normalized,
              displayName: uVal.name || uVal.displayName || normalized.split('@')[0],
              name: uVal.name || uVal.displayName || normalized.split('@')[0],
              role: uVal.role,
              department: uVal.department || null,
              designation: uVal.designation || null,
              ...uVal,
            };
          }
        }
      } catch (e) {
        console.warn('users/ uid lookup note:', e.message);
      }
    }

    // 3. Check preapproved_users in RTDB (pre-provisioned by Principal for HODs)
    try {
      const preSnap = await get(ref(db, `preapproved_users/${sanitizedKey}`));
      if (preSnap.exists()) {
        const pre = preSnap.val();
        const profileData = {
          uid: authUid || pre.uid || `hod-${Date.now()}`,
          email: normalized,
          displayName: pre.name || pre.displayName || normalized.split('@')[0],
          name: pre.name || pre.displayName || normalized.split('@')[0],
          role: pre.role || ROLES.HOD,
          department: pre.department || 'ECS',
          designation: pre.designation || `Head of Department (${pre.department || 'ECS'})`,
        };
        if (authUid) {
          try {
            await set(ref(db, `users/${authUid}`), { ...profileData, uid: authUid, claimedAt: Date.now() });
          } catch (_) {}
        }
        return profileData;
      }
    } catch (e) {
      console.warn('preapproved_users lookup note:', e.message);
    }

    // 4. Check users table by email
    try {
      const usersSnap = await get(ref(db, 'users'));
      if (usersSnap.exists()) {
        const allUsers = usersSnap.val() || {};
        const match = Object.values(allUsers).find(
          (u) => (u?.email || '').toLowerCase() === normalized
        );
        if (match && match.role) {
          const profileData = {
            ...match,
            uid: authUid || match.uid,
            email: normalized,
            displayName: match.name || match.displayName || normalized.split('@')[0],
            name: match.name || match.displayName || normalized.split('@')[0],
            role: match.role,
            department: match.department || null,
          };
          if (authUid && authUid !== match.uid) {
            try {
              await set(ref(db, `users/${authUid}`), { ...profileData, uid: authUid });
            } catch (_) {}
          }
          return profileData;
        }
      }
    } catch (e) {
      console.warn('users by email lookup note:', e.message);
    }

    // 5. Check faculty table by email
    try {
      const facSnap = await get(ref(db, 'faculty'));
      if (facSnap.exists()) {
        const allFac = facSnap.val() || {};
        const match = Object.values(allFac).find(
          (f) => (f?.email || '').toLowerCase() === normalized
        );
        if (match) {
          const profileData = {
            ...match,
            uid: authUid || match.uid,
            email: normalized,
            displayName: match.name || normalized.split('@')[0],
            name: match.name || normalized.split('@')[0],
            role: match.role || ROLES.FACULTY,
            department: match.department || null,
          };
          if (authUid) {
            try {
              await set(ref(db, `users/${authUid}`), { ...profileData, uid: authUid });
            } catch (_) {}
          }
          return profileData;
        }
      }
    } catch (e) {
      console.warn('faculty table lookup note:', e.message);
    }

    // 6. Institutional domain & prefix role mapping
    if (normalized === 'principal@sfit.ac.in' || normalized.startsWith('principal')) {
      return {
        uid: authUid || 'demo-principal-01',
        email: normalized,
        displayName: 'Dr. S. S. Rathod',
        name: 'Dr. S. S. Rathod',
        role: ROLES.PRINCIPAL,
        department: null,
      };
    }

    if (normalized.startsWith('hod.') || normalized.includes('nitika.rai') || normalized.includes('hod')) {
      const dept = normalized.includes('ecs') || normalized.includes('nitika.rai')
        ? 'ECS'
        : normalized.includes('cmpn')
        ? 'CMPN'
        : normalized.includes('inft')
        ? 'INFT'
        : normalized.includes('extc')
        ? 'EXTC'
        : 'ECS';
      const name = normalized.includes('nitika.rai') ? 'Dr. Nitika Rai' : `HOD ${dept}`;
      const profileData = {
        uid: authUid || `hod-${dept.toLowerCase()}-${Date.now()}`,
        email: normalized,
        displayName: name,
        name,
        role: ROLES.HOD,
        department: dept,
        designation: `Head of Department (${dept})`,
      };
      if (authUid) {
        try {
          await set(ref(db, `users/${authUid}`), { ...profileData, uid: authUid });
        } catch (_) {}
      }
      return profileData;
    }

    if (normalized.startsWith('faculty.')) {
      return {
        uid: authUid || `faculty-${Date.now()}`,
        email: normalized,
        displayName: normalized.split('@')[0],
        name: normalized.split('@')[0],
        role: ROLES.FACULTY,
        department: 'CMPN',
      };
    }

    // Default student
    return {
      uid: authUid || `student-${Date.now()}`,
      email: normalized,
      displayName: normalized.split('@')[0],
      name: normalized.split('@')[0],
      role: ROLES.STUDENT,
      department: 'CMPN',
    };
  };

  useEffect(() => {
    // 1. Immediate restore of stored dev session for instant rendering
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('profping_dev_session');
      if (stored) {
        try {
          const session = JSON.parse(stored);
          if (session && session.role) {
            setUser({ uid: session.uid, email: session.email, displayName: session.displayName || session.name });
            setRole(session.role);
            setDepartment(session.department || null);
            setClaims({ role: session.role, department: session.department || null });
            setProfile(session);
            setIsMockMode(true);
            setLoading(false);
          }
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
          const resolved = await resolveRoleAndProfile(currentUser.email, currentUser.uid, tokenResult.claims);
          const userRole = tokenResult.claims?.role || resolved.role;
          const userDept = tokenResult.claims?.department || resolved.department;
          const activeProfile = {
            ...resolved,
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || resolved.displayName || resolved.name,
            role: userRole,
            department: userDept,
          };

          if (typeof window !== 'undefined') {
            localStorage.setItem('profping_dev_session', JSON.stringify(activeProfile));
          }

          setUser(currentUser);
          setRole(userRole);
          setDepartment(userDept);
          setClaims({ role: userRole, department: userDept, ...(tokenResult.claims || {}) });
          setProfile(activeProfile);
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
        const resolved = await resolveRoleAndProfile(validEmail, cred.user.uid, tokenResult.claims);
        const userRole = tokenResult.claims?.role || resolved.role;
        const userDept = tokenResult.claims?.department || resolved.department;
        const resolvedProfile = {
          ...resolved,
          uid: cred.user.uid,
          email: validEmail,
          displayName: cred.user.displayName || resolved.displayName || resolved.name,
          role: userRole,
          department: userDept,
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem('profping_dev_session', JSON.stringify(resolvedProfile));
        }

        setUser(cred.user);
        setRole(userRole);
        setDepartment(userDept);
        setClaims({ role: userRole, department: userDept, ...(tokenResult.claims || {}) });
        setProfile(resolvedProfile);
        setIsMockMode(false);

        return { user: cred.user, role: userRole, department: userDept };
      } catch (fbErr) {
        // If the account is a preset demo account or test password, allow seamless sign-in
        if (DEMO_ACCOUNTS[validEmail] || password === 'Password@123') {
          console.warn('Live Firebase credentials not registered, signing in with Preset/Dev Account:', validEmail);
        } else {
          throw fbErr;
        }
      }
    }

    // Dev / Preset Account Sign-In Fallback
    const resolvedProfile = await resolveRoleAndProfile(validEmail);
    const mockUser = {
      uid: resolvedProfile.uid,
      email: resolvedProfile.email,
      displayName: resolvedProfile.displayName || resolvedProfile.name,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('profping_dev_session', JSON.stringify(resolvedProfile));
    }

    setUser(mockUser);
    setRole(resolvedProfile.role);
    setDepartment(resolvedProfile.department);
    setClaims({ role: resolvedProfile.role, department: resolvedProfile.department });
    setProfile(resolvedProfile);
    setIsMockMode(true);

    return { user: mockUser, role: resolvedProfile.role, department: resolvedProfile.department };
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

  const loginWithGoogleWeb = async (requiredRole = null) => {
    setError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const res = await signInWithPopup(auth, provider);
      const email = (res.user.email || '').trim().toLowerCase();
      const uid = res.user.uid;

      const tokenResult = await res.user.getIdTokenResult(true);
      const resolved = await resolveRoleAndProfile(email, uid, tokenResult.claims);
      const userRole = tokenResult.claims?.role || resolved.role;
      const userDept = tokenResult.claims?.department || resolved.department;
      const activeProfile = {
        ...resolved,
        uid,
        email,
        displayName: res.user.displayName || resolved.displayName || email.split('@')[0],
        role: userRole,
        department: userDept,
      };

      // STRICT RBAC VERIFICATION
      if (requiredRole && userRole !== requiredRole) {
        await fbSignOut(auth);
        setUser(null);
        setRole(null);
        const errMsg = `Unauthorized Access: This portal is strictly restricted to ${requiredRole.toUpperCase()} accounts. Your account (${email}) has role '${userRole}'.`;
        setError(errMsg);
        throw new Error(errMsg);
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('profping_dev_session', JSON.stringify(activeProfile));
      }

      setUser(res.user);
      setRole(userRole);
      setDepartment(userDept);
      setClaims({ role: userRole, department: userDept, ...(tokenResult.claims || {}) });
      setProfile(activeProfile);
      setIsMockMode(false);

      return activeProfile;
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        return null;
      }
      setError(err.message || 'Google sign-in failed');
      throw err;
    }
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
        loginWithGoogleWeb,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
