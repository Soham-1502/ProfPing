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
    role: ROLES.PRINCIPAL,
    department: null,
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
    // 1. Check for stored dev session (validate against DB to prevent restoring deleted accounts)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('profping_dev_session');
      if (stored) {
        try {
          const session = JSON.parse(stored);
          const email = (session.email || '').toLowerCase();
          if (email === 'principal@sfit.ac.in' || email === 'student@sfit.ac.in') {
            setUser({ uid: session.uid, email: session.email, displayName: session.displayName });
            setRole(session.role);
            setDepartment(session.department);
            setClaims({ role: session.role, department: session.department });
            setProfile(session);
            setIsMockMode(true);
            setLoading(false);
            return;
          } else {
            // For HOD or faculty, only restore if actively in preapproved_users or users table
            const sanitizedKey = sanitizeEmail(email);
            get(ref(db, `preapproved_users/${sanitizedKey}`)).then((snap) => {
              if (snap.exists()) {
                const pre = snap.val();
                setUser({ uid: session.uid, email: session.email, displayName: pre.name || session.displayName });
                setRole(pre.role);
                setDepartment(pre.department);
                setClaims({ role: pre.role, department: pre.department });
                setProfile(pre);
                setIsMockMode(true);
                setLoading(false);
              } else {
                localStorage.removeItem('profping_dev_session');
                setUser(null);
                setRole(null);
                setLoading(false);
              }
            }).catch(() => {
              localStorage.removeItem('profping_dev_session');
              setLoading(false);
            });
            return;
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

            // Check preapproved_users (pre-provisioned by Principal)
            if (!userRole && currentUser.email) {
              try {
                const sanitizedKey = sanitizeEmail(currentUser.email);
                const preSnap = await get(ref(db, `preapproved_users/${sanitizedKey}`));
                if (preSnap.exists()) {
                  const pre = preSnap.val();
                  userRole = pre.role;
                  userDept = pre.department;
                  setProfile(pre);
                  await set(ref(db, `users/${currentUser.uid}`), { ...pre, uid: currentUser.uid });
                }
              } catch (e) {}
            }

            // Check faculty directory by email (provisioned by HOD with locked fields)
            if (!userRole && currentUser.email) {
              try {
                const facSnap = await get(ref(db, 'faculty'));
                if (facSnap.exists()) {
                  const match = Object.values(facSnap.val() || {}).find(
                    (f) => (f.email || '').toLowerCase() === currentUser.email.toLowerCase()
                  );
                  if (match) {
                    userRole = match.role || 'faculty';
                    userDept = match.department;
                    setProfile(match);
                    await set(ref(db, `users/${currentUser.uid}`), { ...match, uid: currentUser.uid });
                  }
                }
              } catch (e) {}
            }

            // Check DEMO_ACCOUNTS
            if (!userRole && currentUser.email && DEMO_ACCOUNTS[currentUser.email]) {
              userRole = DEMO_ACCOUNTS[currentUser.email].role;
              userDept = DEMO_ACCOUNTS[currentUser.email].department;
            }

            // Default to student if not pre-approved or in faculty roster
            if (!userRole) {
              userRole = 'student';
              userDept = 'CMPN';
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
        // If the account is a preset demo account, allow seamless sign-in
        if (DEMO_ACCOUNTS[validEmail]) {
          console.warn('Live Firebase credentials not registered, signing in with Preset Account:', validEmail);
        } else {
          throw fbErr;
        }
      }
    }

    // Check known preset accounts
    if (DEMO_ACCOUNTS[validEmail]) {
      const mockProfile = DEMO_ACCOUNTS[validEmail];
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
    }

    // Check preapproved_users in Realtime Database (where Principal registers HODs)
    let preapprovedHOD = null;
    try {
      const sanitizedKey = sanitizeEmail(validEmail);
      const preSnap = await get(ref(db, `preapproved_users/${sanitizedKey}`));
      if (preSnap.exists()) {
        preapprovedHOD = preSnap.val();
      }
    } catch (_) {}

    // Check users table in Realtime Database
    let dbUser = null;
    try {
      const usersSnap = await get(ref(db, 'users'));
      if (usersSnap.exists()) {
        const allUsers = usersSnap.val() || {};
        const match = Object.values(allUsers).find((u) => (u.email || '').toLowerCase() === validEmail);
        if (match) dbUser = match;
      }
    } catch (_) {}

    // Check faculty directory in Realtime Database (where HOD registers Faculty)
    let dbFaculty = null;
    try {
      const facSnap = await get(ref(db, 'faculty'));
      if (facSnap.exists()) {
        const allFac = facSnap.val() || {};
        const match = Object.values(allFac).find((f) => (f.email || '').toLowerCase() === validEmail);
        if (match) dbFaculty = match;
      }
    } catch (_) {}

    // Resolved Role & Profile
    let resolvedRole = null;
    let resolvedDept = null;
    let resolvedName = validEmail.split('@')[0];

    if (preapprovedHOD) {
      resolvedRole = preapprovedHOD.role;
      resolvedDept = preapprovedHOD.department;
      resolvedName = preapprovedHOD.name || resolvedName;
    } else if (dbUser) {
      resolvedRole = dbUser.role;
      resolvedDept = dbUser.department;
      resolvedName = dbUser.name || resolvedName;
    } else if (dbFaculty) {
      resolvedRole = dbFaculty.role || ROLES.FACULTY;
      resolvedDept = dbFaculty.department;
      resolvedName = dbFaculty.name || resolvedName;
    } else if (validEmail === 'principal@sfit.ac.in') {
      resolvedRole = ROLES.PRINCIPAL;
      resolvedDept = null;
      resolvedName = 'Dr. S. S. Rathod';
    } else if (validEmail.endsWith('@student.sfit.ac.in') || validEmail === 'student@sfit.ac.in') {
      resolvedRole = ROLES.STUDENT;
      resolvedDept = 'CMPN';
    } else {
      // If someone attempts to log in as an HOD or Faculty who has NOT been pre-approved by the Principal or added by an HOD:
      if (validEmail.startsWith('hod.') || validEmail.includes('hod')) {
        throw new Error(
          `Access Denied: "${validEmail}" is not authorized in the Principal's HOD management table. Please add this HOD through the Principal portal first.`
        );
      }
      if (validEmail.startsWith('faculty.') || validEmail.includes('faculty')) {
        throw new Error(
          `Access Denied: "${validEmail}" has not been added to the department faculty directory by the HOD.`
        );
      }
      resolvedRole = ROLES.STUDENT;
      resolvedDept = 'CMPN';
    }

    const mockProfile = {
      uid: (preapprovedHOD && preapprovedHOD.uid) || (dbUser && dbUser.uid) || (dbFaculty && dbFaculty.uid) || `user-${Date.now()}`,
      email: validEmail,
      displayName: resolvedName,
      name: resolvedName,
      role: resolvedRole,
      department: resolvedDept,
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

  const loginWithGoogleWeb = async (requiredRole = null) => {
    setError(null);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const res = await signInWithPopup(auth, provider);
      const email = (res.user.email || '').trim().toLowerCase();
      const uid = res.user.uid;

      // 1. Check Custom Claims from Token
      const tokenResult = await res.user.getIdTokenResult(true);
      let userRole = tokenResult.claims?.role || null;
      let userDept = tokenResult.claims?.department || null;
      let userProfileData = null;

      // 2. Check direct user record in RTDB /users/{uid}
      if (!userRole) {
        try {
          const userSnap = await get(ref(db, `users/${uid}`));
          if (userSnap.exists()) {
            const val = userSnap.val();
            userRole = val.role;
            userDept = val.department;
            userProfileData = val;
          }
        } catch (dbErr) {
          console.warn('DB lookup note:', dbErr.message);
        }
      }

      // 3. Check preapproved_users (pre-provisioned HODs assigned by Principal)
      if (!userRole) {
        try {
          const sanitizedKey = sanitizeEmail(email);
          const preSnap = await get(ref(db, `preapproved_users/${sanitizedKey}`));
          if (preSnap.exists()) {
            const preVal = preSnap.val();
            userRole = preVal.role;
            userDept = preVal.department;
            userProfileData = {
              ...preVal,
              uid,
              claimedAt: Date.now(),
            };
            await set(ref(db, `users/${uid}`), userProfileData);
            if (userRole === 'hod' || userRole === 'faculty') {
              await update(ref(db, `faculty/${uid}`), {
                uid,
                name: preVal.name || res.user.displayName || email.split('@')[0],
                email,
                department: userDept,
                role: userRole,
                designation: preVal.designation || (userRole === 'hod' ? `Head of Department (${userDept})` : 'Faculty'),
              });
            }
          }
        } catch (e) {}
      }

      // 4. Check faculty directory by email (added by HOD with locked fields: name, cabin, facultyId, department)
      if (!userRole) {
        try {
          const facultySnap = await get(ref(db, 'faculty'));
          if (facultySnap.exists()) {
            const allFaculty = facultySnap.val() || {};
            const match = Object.values(allFaculty).find((f) => (f.email || '').toLowerCase() === email);
            if (match) {
              userRole = match.role || 'faculty';
              userDept = match.department;
              userProfileData = {
                ...match,
                uid,
                role: userRole,
                department: userDept,
                claimedAt: Date.now(),
              };
              await set(ref(db, `users/${uid}`), userProfileData);
              await update(ref(db, `faculty/${uid}`), {
                ...match,
                uid,
              });
            }
          }
        } catch (e) {}
      }

      // 5. Check users table by email
      if (!userRole) {
        try {
          const usersSnap = await get(ref(db, 'users'));
          if (usersSnap.exists()) {
            const allUsers = usersSnap.val() || {};
            const match = Object.values(allUsers).find((u) => (u.email || '').toLowerCase() === email);
            if (match) {
              userRole = match.role;
              userDept = match.department;
              userProfileData = { ...match, uid };
              await update(ref(db, `users/${uid}`), userProfileData);
            }
          }
        } catch (e) {}
      }

      // 6. Check DEMO_ACCOUNTS
      if (!userRole && DEMO_ACCOUNTS[email]) {
        userRole = DEMO_ACCOUNTS[email].role;
        userDept = DEMO_ACCOUNTS[email].department;
        userProfileData = DEMO_ACCOUNTS[email];
      }

      // 7. Check Principal email nomenclature
      if (!userRole && (email.startsWith('principal') || email.includes('principal'))) {
        userRole = 'principal';
        userDept = 'ADMIN';
      }

      // 8. DEFAULT TO STUDENT: Any non-preapproved college account gets student role by default!
      if (!userRole) {
        userRole = 'student';
        userDept = 'CMPN';
        userProfileData = {
          uid,
          email,
          name: res.user.displayName || email.split('@')[0],
          role: 'student',
          department: 'CMPN',
          createdAt: Date.now(),
        };
        try {
          await set(ref(db, `users/${uid}`), userProfileData);
        } catch (e) {}
      }

      // STRICT RBAC VERIFICATION
      if (requiredRole && userRole !== requiredRole) {
        await fbSignOut(auth);
        setUser(null);
        setRole(null);
        const errMsg = `Unauthorized Access: This portal is strictly restricted to ${requiredRole.toUpperCase()} accounts. Your account (${email}) has role '${userRole}'.`;
        setError(errMsg);
        throw new Error(errMsg);
      }

      const activeProfile = userProfileData || {
        uid,
        email,
        displayName: res.user.displayName || email.split('@')[0],
        role: userRole,
        department: userDept || 'CMPN',
      };

      setUser(res.user);
      setRole(userRole);
      setDepartment(userDept || 'CMPN');
      setClaims({ role: userRole, department: userDept });
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
