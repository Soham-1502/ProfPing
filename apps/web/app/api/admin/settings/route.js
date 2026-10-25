import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import fs from 'fs';
import path from 'path';
import { DEFAULT_INSTITUTION_SETTINGS } from '@profping/shared';

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
      return { db: null };
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
      db: app ? getDatabase(app) : null,
    };
  } catch (err) {
    return { db: null };
  }
}

let MEMORY_SETTINGS = { ...DEFAULT_INSTITUTION_SETTINGS };

/**
 * GET /api/admin/settings
 * Reads settings/institution
 */
export async function GET() {
  try {
    const { db } = getFirebaseAdmin();
    if (db) {
      const snap = await db.ref('settings/institution').once('value');
      if (snap.exists()) {
        return NextResponse.json({ success: true, settings: snap.val() });
      }
    } else {
      const rtdbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://profping-22de9-default-rtdb.asia-southeast1.firebasedatabase.app';
      const res = await fetch(`${rtdbUrl}/settings/institution.json`);
      if (res.ok) {
        const data = await res.json();
        if (data) {
          return NextResponse.json({ success: true, settings: data });
        }
      }
    }
  } catch (err) {
    console.warn('Error reading institution settings:', err.message);
  }

  return NextResponse.json({ success: true, settings: MEMORY_SETTINGS });
}

/**
 * POST /api/admin/settings
 * Updates settings/institution (Principal Only)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { workStart, workEnd, deskTargetHours, resetTime, resetEnabled, callerRole } = body;

    // Role check
    if (callerRole && callerRole !== 'principal') {
      return NextResponse.json({ success: false, error: 'Access restricted: Only the Principal can update Institution Settings.' }, { status: 403 });
    }

    // Validation: start before end
    const [startH, startM] = (workStart || '08:30').split(':').map(Number);
    const [endH, endM] = (workEnd || '17:30').split(':').map(Number);
    const startMins = startH * 60 + startM;
    const endMins = endH * 60 + endM;

    if (startMins >= endMins) {
      return NextResponse.json({ success: false, error: 'Working hours start must be strictly before working hours end.' }, { status: 400 });
    }

    const windowHours = (endMins - startMins) / 60;
    const target = parseFloat(deskTargetHours);
    if (isNaN(target) || target <= 0 || target > windowHours) {
      return NextResponse.json({
        success: false,
        error: `Desk-hour target must be greater than 0 and within the working window (${windowHours.toFixed(1)} hrs).`
      }, { status: 400 });
    }

    const updated = {
      workStart: workStart || '08:30',
      workEnd: workEnd || '17:30',
      deskTargetHours: target,
      resetTime: resetTime || '17:01',
      resetEnabled: resetEnabled !== false,
      updatedAt: Date.now(),
    };

    MEMORY_SETTINGS = { ...updated };

    const { db } = getFirebaseAdmin();
    if (db) {
      await db.ref('settings/institution').set(updated);
    } else {
      const rtdbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://profping-22de9-default-rtdb.asia-southeast1.firebasedatabase.app';
      await fetch(`${rtdbUrl}/settings/institution.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    }

    return NextResponse.json({ success: true, settings: updated, message: 'Institution settings updated successfully.' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
