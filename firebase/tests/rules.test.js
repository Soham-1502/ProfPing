/**
 * @file rules.test.js
 * Rule verification suite for Firebase Realtime Database Security Rules
 * Validates Section 6 Role and Access Matrix from Implementation Plan.
 * Uses Node.js native test runner.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rulesPath = path.resolve(__dirname, '../database.rules.json');
const raw = fs.readFileSync(rulesPath, 'utf8');
const rulesJson = JSON.parse(raw);

test('Rules file exists and has valid JSON syntax', () => {
  assert.ok(rulesJson);
  assert.ok(rulesJson.rules);
});

test('Directory path /faculty is readable by any authenticated user, write locked', () => {
  const faculty = rulesJson.rules.faculty;
  assert.equal(faculty['.read'], 'auth != null');
  assert.equal(faculty['.write'], false);
});

test('Status path /status enforces faculty-only write on own record with valid state and now timestamp', () => {
  const status = rulesJson.rules.status;
  assert.equal(status['.read'], 'auth != null');
  const uidRule = status['$uid'];
  assert.ok(uidRule['.write'].includes('auth.uid === $uid'));
  assert.ok(uidRule['.write'].includes("auth.token.role === 'faculty'"));
  assert.ok(uidRule['.validate'].includes("newData.hasChildren(['state','updatedAt'])"));
  assert.ok(uidRule['.validate'].includes('^(available|busy|in_lecture|off_campus)$'));
  assert.ok(uidRule['.validate'].includes('=== now'));
});

test('Status message length is restricted to max 140 chars', () => {
  const messageRule = rulesJson.rules.status['$uid'].message;
  assert.ok(messageRule['.validate'].includes('newData.val().length <= 140'));
});

test('Logs path /logs/$uid is append-only (!data.exists()) by the faculty owner with server timestamp', () => {
  const logItemRule = rulesJson.rules.logs['$uid']['$logId'];
  assert.ok(logItemRule['.write'].includes('auth.uid === $uid'));
  assert.ok(logItemRule['.write'].includes("auth.token.role === 'faculty'"));
  assert.ok(logItemRule['.write'].includes('!data.exists()'));
  assert.ok(logItemRule['.validate'].includes('=== now'));
});

test('Logs path /logs/$uid enforces department scoping for HOD and full access for Principal', () => {
  const logReadRule = rulesJson.rules.logs['$uid']['.read'];
  assert.ok(logReadRule.includes("auth.token.role === 'principal'"));
  assert.ok(logReadRule.includes("auth.token.role === 'hod'"));
  assert.ok(logReadRule.includes("auth.token.department === root.child('users').child($uid).child('department').val()"));
});

test('User profiles /users/$uid are strictly private or Principal readable', () => {
  const userReadRule = rulesJson.rules.users['$uid']['.read'];
  assert.ok(userReadRule.includes('auth.uid === $uid'));
  assert.ok(userReadRule.includes("auth.token.role === 'principal'"));
  assert.equal(rulesJson.rules.users['$uid']['.write'], false);
});
