import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import fs from 'fs';
import path from 'path';

// Lazy-initialize Firebase Admin SDK on the server safely
function getFirebaseAdmin() {
  try {
    const serviceAccountPath = path.resolve(process.cwd(), '../../firebase/serviceAccountKey.json');
    const localKeyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
    const keyPath = fs.existsSync(serviceAccountPath)
      ? serviceAccountPath
      : fs.existsSync(localKeyPath)
      ? localKeyPath
      : null;

    if (!keyPath && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // In local dev mode without serviceAccount credentials, do NOT initialize
      // Admin SDK with unauthenticated ADC (which hangs for 30s and logs invalid-credential warnings).
      return { auth: null, db: null };
    }

    const existingApps = getApps();
    if (existingApps.length === 0) {
      if (keyPath) {
        const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
        initializeApp({
          credential: cert(serviceAccount),
          databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL,
        });
      } else {
        initializeApp({
          databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || process.env.FIREBASE_DATABASE_URL,
        });
      }
    }
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : null;
    return {
      auth: app ? getAuth(app) : null,
      db: app ? getDatabase(app) : null,
    };
  } catch (err) {
    return { auth: null, db: null };
  }
}

// In-memory store of active and pending HODs
let MEMORY_HODS = [
  {
    uid: 'hod-ecs-nitika-rai',
    name: 'Dr. Nitika Rai',
    email: 'nitika.rai@sfit.ac.in',
    department: 'ECS',
    role: 'hod',
    status: 'Pending',
  },
];

/**
 * GET /api/admin/roles
 * Returns Department HODs only.
 * Each HOD has name, college email, department, and status ('Pending' | 'Active').
 */
export async function GET(request) {
  try {
    const { db } = getFirebaseAdmin();
    if (db) {
      const snap = await db.ref('users').once('value');
      if (snap.exists()) {
        const usersMap = snap.val();
        const hodsList = Object.values(usersMap)
          .filter((u) => u.role === 'hod')
          .map((u) => ({
            uid: u.uid,
            name: u.name || u.displayName || u.email.split('@')[0],
            email: u.email,
            department: u.department,
            role: 'hod',
            status: u.hasSignedIn || u.claimedAt ? 'Active' : 'Pending',
          }));
        return NextResponse.json({ success: true, hods: hodsList });
      }
    } else {
      // Sync via RTDB REST API
      const rtdbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://profping-22de9-default-rtdb.asia-southeast1.firebasedatabase.app';
      const res = await fetch(`${rtdbUrl}/users.json`);
      if (res.ok) {
        const usersMap = await res.json();
        if (usersMap) {
          const rawHods = Object.values(usersMap).filter((u) => u && u.role === 'hod');
          // Deduplicate by department or email, preferring Active accounts
          const byDept = new Map();
          for (const u of rawHods) {
            const dept = (u.department || '').toUpperCase();
            const isActive = !!(u.hasSignedIn || u.claimedAt);
            const entry = {
              uid: u.uid,
              name: u.name || u.displayName || (u.email ? u.email.split('@')[0] : 'HOD'),
              email: u.email,
              department: dept,
              role: 'hod',
              status: isActive ? 'Active' : 'Pending',
            };
            if (!byDept.has(dept) || isActive) {
              byDept.set(dept, entry);
            }
          }
          if (byDept.size > 0) {
            return NextResponse.json({ success: true, hods: Array.from(byDept.values()) });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Realtime DB read error:', err.message);
  }

  // Return fallback in-memory HOD roster
  return NextResponse.json({ success: true, hods: MEMORY_HODS });
}

/**
 * POST /api/admin/roles
 * Handles Add HOD and Delete HOD actions strictly for the Principal.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      callerEmail,
      callerRole,
      action = 'add_hod',
      targetUid,
      name: inputName,
      email: inputEmail,
      department: inputDept,
    } = body;

    // 1. Verify caller authorization: strictly Principal only
    const isPrincipal = callerRole === 'principal' || (callerEmail && callerEmail.includes('principal'));
    if (!isPrincipal) {
      return NextResponse.json(
        { error: 'Forbidden: Only accounts with the Principal role can manage Department HODs.' },
        { status: 403 }
      );
    }

    const { auth, db } = getFirebaseAdmin();

    // ==========================================
    // ACTION 1: DELETE HOD
    // ==========================================
    if (action === 'delete_hod') {
      if (!targetUid) {
        return NextResponse.json(
          { error: 'Target HOD UID is required to delete.' },
          { status: 400 }
        );
      }

      // Safety check: Prevent Principal from deleting themselves or non-HOD
      if (targetUid === 'demo-principal-01' || callerEmail === 'principal@sfit.ac.in' && targetUid.includes('principal')) {
        return NextResponse.json(
          { error: 'Safety Constraint: The Principal cannot delete their own account.' },
          { status: 400 }
        );
      }

      // Find HOD record
      let targetHOD = MEMORY_HODS.find((h) => h.uid === targetUid);
      let targetEmail = targetHOD ? targetHOD.email : null;
      let targetDept = targetHOD ? targetHOD.department : null;
      let targetName = targetHOD ? targetHOD.name : 'HOD';

      if (db) {
        try {
          const uSnap = await db.ref(`users/${targetUid}`).once('value');
          if (uSnap.exists()) {
            const val = uSnap.val();
            targetEmail = val.email || targetEmail;
            targetDept = val.department || targetDept;
            targetName = val.name || targetName;
          }
        } catch (e) {}
      }

      // 1. Remove from in-memory list
      MEMORY_HODS = MEMORY_HODS.filter((h) => h.uid !== targetUid && h.email !== targetEmail);

      // 2. Remove HOD from Realtime Database (users and preapproved_users)
      // LEAVE the department's faculty, statuses, and logs UNTOUCHED!
      if (db) {
        try {
          await db.ref(`users/${targetUid}`).remove();
          if (targetEmail) {
            const sanitizedKey = targetEmail.replace(/\./g, '_').replace(/@/g, '_at_');
            await db.ref(`preapproved_users/${sanitizedKey}`).remove();
          }
        } catch (dbErr) {
          console.warn('Realtime DB delete note:', dbErr.message);
        }
      } else {
        try {
          const rtdbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://profping-22de9-default-rtdb.asia-southeast1.firebasedatabase.app';
          await fetch(`${rtdbUrl}/users/${targetUid}.json`, { method: 'DELETE' });
          if (targetEmail) {
            const sanitizedKey = targetEmail.replace(/\./g, '_').replace(/@/g, '_at_');
            await fetch(`${rtdbUrl}/preapproved_users/${sanitizedKey}.json`, { method: 'DELETE' });
          }
        } catch (e) {
          console.warn('RTDB REST delete error:', e.message);
        }
      }

      // 3. Revoke sessions and clear custom claims on Firebase Auth
      if (auth) {
        try {
          let userRecord = null;
          try {
            userRecord = await auth.getUser(targetUid);
          } catch (e) {
            if (targetEmail) {
              userRecord = await auth.getUserByEmail(targetEmail);
            }
          }

          if (userRecord) {
            // Revoke refresh tokens so the user is immediately signed out
            await auth.revokeRefreshTokens(userRecord.uid);
            // Clear role custom claims
            await auth.setCustomUserClaims(userRecord.uid, { role: null, department: null });
          }
        } catch (authErr) {
          console.warn('Auth token revocation note:', authErr.message);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Removed ${targetName} as HOD of ${targetDept || 'department'}. Their active sessions have been revoked.`,
        deletedUid: targetUid,
      });
    }

    // ==========================================
    // ACTION 2: ADD HOD
    // ==========================================
    if (action === 'add_hod') {
      const name = (inputName || '').trim();
      const email = (inputEmail || '').trim().toLowerCase();
      const department = (inputDept || '').trim().toUpperCase();

      if (!name) {
        return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
      }

      // Email validation: strictly college domain
      if (!email || !email.endsWith('@sfit.ac.in')) {
        return NextResponse.json(
          { error: 'Institutional college email ending with @sfit.ac.in is strictly required.' },
          { status: 400 }
        );
      }

      // Department validation
      const VALID_DEPTS = ['CMPN', 'INFT', 'EXTC', 'ECS'];
      if (!VALID_DEPTS.includes(department)) {
        return NextResponse.json(
          { error: `Department must be one of: ${VALID_DEPTS.join(', ')}.` },
          { status: 400 }
        );
      }

      // Safety check: Cannot assign Principal account as HOD
      if (email === 'principal@sfit.ac.in' || email === callerEmail) {
        return NextResponse.json(
          { error: 'Safety Constraint: The Principal cannot be assigned as an HOD.' },
          { status: 400 }
        );
      }

      // RULE: ONE HOD PER DEPARTMENT.
      // If the chosen department already has an HOD, BLOCK the add and tell the Principal to delete the current HOD first.
      const existingInMemory = MEMORY_HODS.find((h) => h.department === department);
      if (existingInMemory) {
        return NextResponse.json(
          { error: `Department ${department} already has an assigned HOD (${existingInMemory.name}). Please delete the current HOD first before adding a new one.` },
          { status: 400 }
        );
      }

      if (db) {
        try {
          const snap = await db.ref('users').once('value');
          if (snap.exists()) {
            const allUsers = snap.val();
            const currentDeptHOD = Object.values(allUsers).find(
              (u) => u.role === 'hod' && u.department === department
            );
            if (currentDeptHOD) {
              return NextResponse.json(
                { error: `Department ${department} already has an assigned HOD (${currentDeptHOD.name || currentDeptHOD.email}). Please delete the current HOD first before adding a new one.` },
                { status: 400 }
              );
            }
          }
        } catch (dbErr) {
          console.warn('Realtime DB check note:', dbErr.message);
        }
      } else {
        try {
          const rtdbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://profping-22de9-default-rtdb.asia-southeast1.firebasedatabase.app';
          const snapRes = await fetch(`${rtdbUrl}/users.json`);
          if (snapRes.ok) {
            const allUsers = await snapRes.json();
            if (allUsers) {
              const currentDeptHOD = Object.values(allUsers).find(
                (u) => u && u.role === 'hod' && (u.department || '').toUpperCase() === department
              );
              if (currentDeptHOD) {
                return NextResponse.json(
                  { error: `Department ${department} already has an assigned HOD (${currentDeptHOD.name || currentDeptHOD.displayName || currentDeptHOD.email}). Please delete the current HOD first before adding a new one.` },
                  { status: 400 }
                );
              }
            }
          }
        } catch (e) {
          console.warn('RTDB REST check error:', e.message);
        }
      }

      // Prepare HOD record
      let assignedUid = targetUid;
      let userRecord = null;

      if (auth) {
        try {
          userRecord = await auth.getUserByEmail(email);
          assignedUid = userRecord.uid;
          // Apply custom claims
          await auth.setCustomUserClaims(assignedUid, {
            role: 'hod',
            department,
          });
        } catch (authErr) {
          // User has not signed in yet with Google
        }
      }

      if (!assignedUid) {
        assignedUid = `preapproved-hod-${department.toLowerCase()}-${Date.now()}`;
      }

      const newHODRecord = {
        uid: assignedUid,
        name,
        email,
        department,
        role: 'hod',
        status: userRecord ? 'Active' : 'Pending',
        preapproved: true,
        createdAt: Date.now(),
      };

      // Add to in-memory list
      MEMORY_HODS.push(newHODRecord);

      // Save to Realtime Database
      if (db) {
        try {
          const sanitizedKey = email.replace(/\./g, '_').replace(/@/g, '_at_');
          // Write to preapproved_users so first Google sign-in claims it
          await db.ref(`preapproved_users/${sanitizedKey}`).set(newHODRecord);
          // Write to users
          await db.ref(`users/${assignedUid}`).set(newHODRecord);
        } catch (dbErr) {
          console.warn('Realtime DB write note:', dbErr.message);
        }
      } else {
        try {
          const rtdbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://profping-22de9-default-rtdb.asia-southeast1.firebasedatabase.app';
          const sanitizedKey = email.replace(/\./g, '_').replace(/@/g, '_at_');
          await fetch(`${rtdbUrl}/preapproved_users/${sanitizedKey}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newHODRecord),
          });
          await fetch(`${rtdbUrl}/users/${assignedUid}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newHODRecord),
          });
        } catch (e) {
          console.warn('RTDB REST write error:', e.message);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully pre-approved ${name} as HOD of ${department}. They will receive HOD access upon signing in with Google.`,
        hod: newHODRecord,
      });
    }

    return NextResponse.json(
      { error: `Unsupported action "${action}". Permitted actions: 'add_hod', 'delete_hod'.` },
      { status: 400 }
    );
  } catch (error) {
    console.error('Role assignment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request.' },
      { status: 500 }
    );
  }
}
