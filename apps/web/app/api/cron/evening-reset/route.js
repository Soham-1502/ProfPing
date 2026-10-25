import { NextResponse } from 'next/server';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import fs from 'fs';
import path from 'path';
import { STATUS_KEYS, DEFAULT_INSTITUTION_SETTINGS } from '@profping/shared';

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

/**
 * GET/POST /api/cron/evening-reset
 * Performs the evening reset job (Section 1.6).
 * Sets every non-Off Campus faculty status to Off Campus, writes append-only log,
 * and clears notifyRequests.
 */
export async function GET() {
  return handleReset();
}

export async function POST() {
  return handleReset();
}

async function handleReset() {
  try {
    const { db } = getFirebaseAdmin();
    const now = Date.now();
    let resetCount = 0;

    if (db) {
      // 1. Check settings/institution
      const settingsSnap = await db.ref('settings/institution').once('value');
      const settings = settingsSnap.exists() ? settingsSnap.val() : DEFAULT_INSTITUTION_SETTINGS;

      if (settings?.resetEnabled === false) {
        return NextResponse.json({ success: true, message: 'Automated reset is disabled in institution settings.', resetCount: 0 });
      }

      // 2. Fetch all faculty statuses
      const statusSnap = await db.ref('status').once('value');
      if (statusSnap.exists()) {
        const statuses = statusSnap.val();
        const updates = {};
        const logWrites = [];

        for (const [uid, current] of Object.entries(statuses)) {
          if (current && current.state !== STATUS_KEYS.OFF_CAMPUS) {
            updates[`status/${uid}`] = {
              state: STATUS_KEYS.OFF_CAMPUS,
              message: 'Evening Automated Reset',
              updatedAt: now,
            };

            logWrites.push(
              db.ref(`logs/${uid}`).push({
                state: STATUS_KEYS.OFF_CAMPUS,
                message: 'Evening Automated Reset',
                timestamp: now,
              })
            );

            resetCount++;
          }
        }

        if (Object.keys(updates).length > 0) {
          await db.ref().update(updates);
          await Promise.all(logWrites);
        }
      }

      // 3. Clear pending Notify requests
      await db.ref('notifyRequests').remove();

      return NextResponse.json({
        success: true,
        message: `Evening reset completed. ${resetCount} faculty statuses reset to Off Campus. Notify requests cleared.`,
        resetCount,
        timestamp: now,
      });
    } else {
      // Fallback via RTDB REST API
      const rtdbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://profping-22de9-default-rtdb.asia-southeast1.firebasedatabase.app';
      const statusRes = await fetch(`${rtdbUrl}/status.json`);
      if (statusRes.ok) {
        const statuses = await statusRes.json();
        if (statuses) {
          for (const [uid, current] of Object.entries(statuses)) {
            if (current && current.state !== STATUS_KEYS.OFF_CAMPUS) {
              const resetPayload = {
                state: STATUS_KEYS.OFF_CAMPUS,
                message: 'Evening Automated Reset',
                updatedAt: now,
              };

              await fetch(`${rtdbUrl}/status/${uid}.json`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(resetPayload),
              });

              await fetch(`${rtdbUrl}/logs/${uid}.json`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  state: STATUS_KEYS.OFF_CAMPUS,
                  message: 'Evening Automated Reset',
                  timestamp: now,
                }),
              });

              resetCount++;
            }
          }
        }
      }

      // Clear notifyRequests
      await fetch(`${rtdbUrl}/notifyRequests.json`, { method: 'DELETE' });

      return NextResponse.json({
        success: true,
        message: `Evening reset executed via REST. ${resetCount} faculty statuses reset to Off Campus.`,
        resetCount,
        timestamp: now,
      });
    }
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
