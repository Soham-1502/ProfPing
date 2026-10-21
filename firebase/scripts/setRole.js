/**
 * @file setRole.js
 * Admin script to assign RBAC custom claims (role, department) and sync user record to Realtime DB.
 *
 * Usage:
 *   node scripts/setRole.js <email> <role> [department] [name] [designation]
 *
 * Examples:
 *   node scripts/setRole.js principal@sfit.ac.in principal
 *   node scripts/setRole.js hod.cmpn@sfit.ac.in hod CMPN "Dr. Kavita Sonawane"
 *   node scripts/setRole.js faculty.cmpn@sfit.ac.in faculty CMPN "Prof. Snehal Kulkarni" "Assistant Professor"
 *   node scripts/setRole.js student1@sfit.ac.in student CMPN "John Doe"
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Admin SDK (uses serviceAccountKey.json if present, or emulator/application default credentials)
const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://demo-profping-default-rtdb.firebaseio.com',
  });
} else {
  // Use project ID from env or fallback to emulator demo project
  const projectId = process.env.FIREBASE_PROJECT_ID || 'demo-profping';
  admin.initializeApp({
    projectId,
    databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${projectId}-default-rtdb.firebaseio.com`,
  });
}

const auth = admin.auth();
const db = admin.database();

const VALID_ROLES = ['student', 'faculty', 'hod', 'principal'];

async function assignRole() {
  const [email, role, department, name, designation] = process.argv.slice(2);

  if (!email || !role) {
    console.error('\n❌ Usage: node setRole.js <email> <role> [department] [name] [designation]');
    console.error(`Valid roles: ${VALID_ROLES.join(', ')}\n`);
    process.exit(1);
  }

  const normalizedRole = role.toLowerCase();
  if (!VALID_ROLES.includes(normalizedRole)) {
    console.error(`\n❌ Invalid role "${role}". Must be one of: ${VALID_ROLES.join(', ')}\n`);
    process.exit(1);
  }

  if (normalizedRole === 'hod' && !department) {
    console.error('\n❌ HOD role requires a department (e.g. CMPN, INFT, EXTC)\n');
    process.exit(1);
  }

  try {
    let user;
    try {
      user = await auth.getUserByEmail(email);
      console.log(`\nFound existing user: ${user.uid} (${email})`);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        const defaultPassword = 'Password@123';
        console.log(`\nUser not found. Creating new user: ${email} with default password: ${defaultPassword}`);
        user = await auth.createUser({
          email,
          password: defaultPassword,
          displayName: name || email.split('@')[0],
        });
      } else {
        throw err;
      }
    }

    const claims = {
      role: normalizedRole,
      department: department ? department.toUpperCase() : null,
    };

    // 1. Set Custom User Claims on Firebase Auth
    await auth.setCustomUserClaims(user.uid, claims);
    console.log(`✅ Set custom claims on ${email}:`, claims);

    // 2. Sync to Realtime Database /users/{uid}
    const userProfile = {
      uid: user.uid,
      email,
      name: name || user.displayName || email.split('@')[0],
      role: normalizedRole,
      department: claims.department,
      updatedAt: admin.database.ServerValue.TIMESTAMP,
    };
    await db.ref(`users/${user.uid}`).set(userProfile);
    console.log(`✅ Synced private profile to /users/${user.uid}`);

    // 3. If faculty or HOD, sync to public directory /faculty/{uid}
    if (normalizedRole === 'faculty' || normalizedRole === 'hod') {
      const facultyEntry = {
        uid: user.uid,
        name: name || user.displayName || email.split('@')[0],
        department: claims.department,
        designation: designation || (normalizedRole === 'hod' ? `Head of Department (${claims.department})` : 'Faculty'),
      };
      await db.ref(`faculty/${user.uid}`).set(facultyEntry);
      console.log(`✅ Synced public directory record to /faculty/${user.uid}`);

      // Ensure initial status exists in /status/{uid}
      const statusRef = db.ref(`status/${user.uid}`);
      const existingStatus = await statusRef.once('value');
      if (!existingStatus.exists()) {
        await statusRef.set({
          state: 'available',
          message: 'Available in cabin',
          updatedAt: admin.database.ServerValue.TIMESTAMP,
        });
        console.log(`✅ Initialized default status for /status/${user.uid}`);
      }
    }

    console.log(`\n🎉 Successfully configured ${email} as [${normalizedRole.toUpperCase()}]!\n`);
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Failed to assign role:', err.message);
    process.exit(1);
  }
}

assignRole();
