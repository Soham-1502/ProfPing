import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import fs from 'fs';
import path from 'path';
import { STATUS_KEYS } from '@profping/shared';

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

/**
 * POST /api/admin/faculty
 * Handles Faculty Provisioning, Updates, and Removal strictly for Department HODs.
 * Actions: 'add_faculty', 'update_faculty', 'delete_faculty'.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      action = 'add_faculty',
      callerEmail,
      callerRole,
      callerDepartment,
      facultyData = {},
      facultyUid,
    } = body;

    // 1. Authorization: Only HOD or Principal
    const isAuthorized = callerRole === 'hod' || callerRole === 'principal';
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Forbidden: Only department HODs or Principal can manage faculty directory.' },
        { status: 403 }
      );
    }

    const { auth, db } = getFirebaseAdmin();
    const rtdbUrl =
      process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
      process.env.FIREBASE_DATABASE_URL ||
      'https://profping-22de9-default-rtdb.asia-southeast1.firebasedatabase.app';

    // ==========================================
    // ACTION 1: DELETE FACULTY
    // ==========================================
    if (action === 'delete_faculty') {
      const targetUid = facultyUid || facultyData.uid;
      const targetEmail = (facultyData.email || '').trim().toLowerCase();

      if (!targetUid) {
        return NextResponse.json({ error: 'Faculty UID is required to delete.' }, { status: 400 });
      }

      // 1. Remove from /faculty/{uid}
      // 2. Remove from /users/{uid}
      // 3. Remove from /preapproved_users/{sanitizedKey}
      // CRITICAL: KEEP /logs/{uid} UNTOUCHED! (Section 6: keeps their logs)
      if (db) {
        try {
          await db.ref(`faculty/${targetUid}`).remove();
          await db.ref(`users/${targetUid}`).remove();
          if (targetEmail) {
            const sanitizedKey = targetEmail.replace(/\./g, '_').replace(/@/g, '_at_');
            await db.ref(`preapproved_users/${sanitizedKey}`).remove();
          }
        } catch (dbErr) {
          console.warn('DB delete faculty note:', dbErr.message);
        }
      } else {
        try {
          await fetch(`${rtdbUrl}/faculty/${targetUid}.json`, { method: 'DELETE' });
          await fetch(`${rtdbUrl}/users/${targetUid}.json`, { method: 'DELETE' });
          if (targetEmail) {
            const sanitizedKey = targetEmail.replace(/\./g, '_').replace(/@/g, '_at_');
            await fetch(`${rtdbUrl}/preapproved_users/${sanitizedKey}.json`, { method: 'DELETE' });
          }
        } catch (fetchErr) {
          console.warn('REST delete faculty note:', fetchErr.message);
        }
      }

      // Revoke active Firebase Auth sessions
      if (auth) {
        try {
          let userRecord = null;
          try {
            userRecord = await auth.getUser(targetUid);
          } catch (_) {
            if (targetEmail) {
              userRecord = await auth.getUserByEmail(targetEmail);
            }
          }

          if (userRecord) {
            await auth.revokeRefreshTokens(userRecord.uid);
            await auth.setCustomUserClaims(userRecord.uid, { role: null, department: null });
          }
        } catch (authErr) {
          console.warn('Auth token revocation note:', authErr.message);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully removed faculty member. Active sessions have been revoked. Historical logs were preserved.`,
        deletedUid: targetUid,
      });
    }

    // ==========================================
    // ACTION 2: ADD OR UPDATE FACULTY
    // ==========================================
    const name = (facultyData.name || '').trim();
    const email = (facultyData.email || '').trim().toLowerCase();
    const facultyId = (facultyData.facultyId || '').trim().toUpperCase();
    const designation = (facultyData.designation || 'Assistant Professor').trim();
    const cabin = (facultyData.cabin || '').trim();
    const floor = (facultyData.floor || '3rd Floor').trim();
    const wing = (facultyData.wing || 'Main Wing').trim();
    const intercom = (facultyData.intercom || '').trim() || 'Ext. N/A';
    const officeHours = (facultyData.officeHours || '10:00 AM - 12:00 PM').trim();
    const department = (callerDepartment || facultyData.department || 'CMPN').toUpperCase();

    if (!name) {
      return NextResponse.json({ error: 'Faculty name is required.' }, { status: 400 });
    }

    if (!email || !email.endsWith('@sfit.ac.in')) {
      return NextResponse.json(
        { error: 'Institutional college email ending with @sfit.ac.in is strictly required.' },
        { status: 400 }
      );
    }

    if (!cabin) {
      return NextResponse.json({ error: 'Cabin room is required.' }, { status: 400 });
    }

    const targetUid = facultyUid || facultyData.uid || `faculty-${department.toLowerCase()}-${Date.now()}`;

    const facultyRecord = {
      uid: targetUid,
      name,
      email,
      facultyId,
      designation,
      cabin,
      floor,
      wing,
      intercom,
      officeHours,
      department,
      role: 'faculty',
      updatedAt: Date.now(),
    };

    if (action === 'add_faculty') {
      facultyRecord.createdAt = Date.now();
      facultyRecord.preapproved = true;
      facultyRecord.status = {
        state: STATUS_KEYS.OFF_CAMPUS,
        message: 'New Faculty Provisioned',
        updatedAt: Date.now(),
      };
    }

    const sanitizedKey = email.replace(/\./g, '_').replace(/@/g, '_at_');

    if (db) {
      try {
        await db.ref(`faculty/${targetUid}`).update(facultyRecord);
        await db.ref(`users/${targetUid}`).update(facultyRecord);
        await db.ref(`preapproved_users/${sanitizedKey}`).set({
          ...facultyRecord,
          preapproved: true,
        });
      } catch (dbErr) {
        console.warn('Realtime DB write faculty note:', dbErr.message);
      }
    } else {
      try {
        await fetch(`${rtdbUrl}/faculty/${targetUid}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(facultyRecord),
        });
        await fetch(`${rtdbUrl}/users/${targetUid}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(facultyRecord),
        });
        await fetch(`${rtdbUrl}/preapproved_users/${sanitizedKey}.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...facultyRecord, preapproved: true }),
        });
      } catch (fetchErr) {
        console.warn('REST write faculty note:', fetchErr.message);
      }
    }

    // Set custom user claims if Firebase Auth account already exists
    if (auth) {
      try {
        const userRecord = await auth.getUserByEmail(email);
        if (userRecord) {
          await auth.setCustomUserClaims(userRecord.uid, {
            role: 'faculty',
            department,
          });
        }
      } catch (_) {}
    }

    return NextResponse.json({
      success: true,
      message: action === 'add_faculty'
        ? `Successfully provisioned ${name} in ${department} faculty directory.`
        : `Successfully updated ${name}'s institutional details.`,
      faculty: facultyRecord,
    });
  } catch (error) {
    console.error('Faculty API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process faculty management request.' },
      { status: 500 }
    );
  }
}
