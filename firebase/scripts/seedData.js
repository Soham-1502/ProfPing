/**
 * @file seedData.js
 * Seeds realistic institutional demo users and directory entries for testing.
 *
 * Usage:
 *   node scripts/seedData.js
 */

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://demo-profping-default-rtdb.firebaseio.com',
  });
} else {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'demo-profping';
  admin.initializeApp({
    projectId,
    databaseURL: process.env.FIREBASE_DATABASE_URL || `https://${projectId}-default-rtdb.firebaseio.com`,
  });
}

const auth = admin.auth();
const db = admin.database();

const DEFAULT_PASSWORD = 'Password@123';

const DEMO_USERS = [
  {
    email: 'principal@sfit.ac.in',
    name: 'Dr. S. S. Rathod',
    role: 'principal',
    department: null,
    designation: 'Principal',
  },
  {
    email: 'hod.cmpn@sfit.ac.in',
    name: 'Dr. Kavita Sonawane',
    role: 'hod',
    department: 'CMPN',
    designation: 'HOD Computer Engineering',
  },
  {
    email: 'hod.inft@sfit.ac.in',
    name: 'Dr. Joanne Gomes',
    role: 'hod',
    department: 'INFT',
    designation: 'HOD Information Technology',
  },
  {
    email: 'faculty.snehal@sfit.ac.in',
    name: 'Prof. Snehal Kulkarni',
    role: 'faculty',
    department: 'CMPN',
    designation: 'Assistant Professor',
    initialStatus: { state: 'available', message: 'Available in Lab 304' },
  },
  {
    email: 'faculty.rahul@sfit.ac.in',
    name: 'Dr. Rahul Joshi',
    role: 'faculty',
    department: 'CMPN',
    designation: 'Associate Professor',
    initialStatus: { state: 'in_lecture', message: 'Delivering Operating Systems (TE CMPN A)' },
  },
  {
    email: 'faculty.priya@sfit.ac.in',
    name: 'Prof. Priya Shah',
    role: 'faculty',
    department: 'INFT',
    designation: 'Assistant Professor',
    initialStatus: { state: 'busy', message: 'Project review in progress' },
  },
  {
    email: 'faculty.amit@sfit.ac.in',
    name: 'Dr. Amit Patel',
    role: 'faculty',
    department: 'EXTC',
    designation: 'Professor',
    initialStatus: { state: 'off_campus', message: 'Attending University Syndicate meeting' },
  },
  {
    email: 'student@sfit.ac.in',
    name: 'Soham Tamhankar',
    role: 'student',
    department: 'CMPN',
    designation: 'Student (TE CMPN)',
  },
];

async function seed() {
  console.log('\n🌱 Starting ProfPing database and user seeding...\n');

  for (const u of DEMO_USERS) {
    try {
      let userRecord;
      try {
        userRecord = await auth.getUserByEmail(u.email);
        console.log(`- Updating existing user ${u.email} (${userRecord.uid})`);
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          userRecord = await auth.createUser({
            email: u.email,
            password: DEFAULT_PASSWORD,
            displayName: u.name,
          });
          console.log(`- Created new user ${u.email} (${userRecord.uid})`);
        } else {
          throw err;
        }
      }

      // 1. Assign custom claims
      const claims = { role: u.role, department: u.department };
      await auth.setCustomUserClaims(userRecord.uid, claims);

      // 2. Set /users/{uid}
      await db.ref(`users/${userRecord.uid}`).set({
        uid: userRecord.uid,
        email: u.email,
        name: u.name,
        role: u.role,
        department: u.department,
        designation: u.designation,
        updatedAt: admin.database.ServerValue.TIMESTAMP,
      });

      // 3. Set /faculty/{uid} & /status/{uid} if faculty or hod
      if (u.role === 'faculty' || u.role === 'hod') {
        await db.ref(`faculty/${userRecord.uid}`).set({
          uid: userRecord.uid,
          name: u.name,
          department: u.department,
          designation: u.designation,
          email: u.email,
        });

        const initialStatus = u.initialStatus || { state: 'available', message: 'Available in cabin' };
        await db.ref(`status/${userRecord.uid}`).set({
          state: initialStatus.state,
          message: initialStatus.message,
          updatedAt: admin.database.ServerValue.TIMESTAMP,
        });

        // Seed initial log
        const logRef = db.ref(`logs/${userRecord.uid}`).push();
        await logRef.set({
          state: initialStatus.state,
          message: initialStatus.message,
          timestamp: admin.database.ServerValue.TIMESTAMP,
        });
      }

      console.log(`  ✓ ${u.email} configured as [${u.role.toUpperCase()}]`);
    } catch (err) {
      console.error(`  ✗ Error configuring ${u.email}:`, err.message);
    }
  }

  console.log('\n✅ Seeding complete! All accounts password: Password@123\n');
  process.exit(0);
}

seed();
