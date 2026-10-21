# ProfPing: Implementation Plan

ProfPing is a real-time faculty availability system. Faculty set a status with one tap, students see it live on their phones, and the Principal and HODs get web dashboards with desk-hour analytics. Access is controlled by role (RBAC).

---

## 1. Scope and Objectives Covered

| # | Objective | Delivered by |
|---|---|---|
| 1 | One-tap faculty status broadcast (React Native + Expo) | Phase 3 |
| 2 | Real-time student directory (mobile and web) | Phase 4 |
| 3 | Administrative web portal for Principal and HODs (Next.js) | Phase 6 |
| 4 | Role-Based Access Control with Firebase Authentication and security rules | Phase 2 |
| 5 | Telemetry pipeline: timestamps and duration metrics | Phases 5 and 7 |

---

## 2. System Architecture

```
 Mobile app (Expo)                 Web app (Next.js on Vercel)
 Faculty | Student                 HOD | Principal
        \                              /
         \      Firebase SDK          /
          v                          v
   +-----------------------------------------+
   | Firebase Authentication (roles via      |
   | custom claims)                          |
   +-----------------------------------------+
   | Firebase Realtime Database              |
   |   users / faculty / status / logs       |
   |   protected by Security Rules (RBAC)    |
   +-----------------------------------------+
```

- **Real-time sync:** clients subscribe to database paths over WebSockets. A write by a faculty member is pushed to every subscribed student and dashboard.
- **Single source of truth:** all authorisation is enforced in Firebase Security Rules. Screen-level role guards in the apps only control navigation.
- **Privacy by design:** only status, message and timestamp data are stored. No images, location or biometric data are collected, and status is self-reported by faculty.

---

## 3. Tools and Technologies

| Area | Tool | Purpose |
|---|---|---|
| Runtime | Node.js (LTS), npm workspaces | Both apps and shared code |
| Language | JavaScript (ES6+) with JSX | One language for mobile, web, shared code and admin scripts |
| Mobile | React Native with Expo, Expo Router, Expo Go | Faculty and student apps, QR-code testing |
| Web | Next.js, Tailwind CSS, Recharts | HOD and Principal dashboards, charts |
| Backend | Firebase Authentication, Realtime Database, Security Rules | Login, roles, live data |
| Admin tooling | Firebase Admin SDK | Assigning roles (custom claims), seeding data |
| Testing | Firebase Emulator Suite, Jest | Rule tests and logic tests |
| Hosting | Vercel (web), Expo Go / EAS (mobile) | Deployment |
| Collaboration | Git and GitHub, Figma, draw.io | Version control, UI design, diagrams |

**Language note:** the whole project uses plain JavaScript with JSX. When creating the projects, choose the JavaScript option (for Next.js answer "No" to TypeScript; for Expo use a JavaScript template). Where a shape needs documenting, such as a status log, describe it with a short JSDoc comment instead of a type.

---

## 4. Repository Structure

```
profping/
├── apps/
│   ├── mobile/                      # Expo app: faculty + student
│   │   ├── app/
│   │   │   ├── _layout.jsx          # root layout, auth and role redirect
│   │   │   ├── (auth)/login.jsx
│   │   │   ├── (faculty)/index.jsx  # status buttons + custom message
│   │   │   └── (student)/
│   │   │       ├── index.jsx        # directory, search, filter by dept
│   │   │       └── faculty/[id].jsx
│   │   └── src/
│   │       ├── components/          # StatusButton, FacultyCard, SearchBar
│   │       ├── hooks/               # useAuth, useFacultyList, useMyStatus
│   │       ├── services/            # firebase.js, statusService.js
│   │       └── context/             # AuthContext.jsx
│   └── web/                         # Next.js dashboards
│       └── src/
│           ├── app/
│           │   ├── login/page.jsx
│           │   ├── hod/page.jsx
│           │   └── principal/page.jsx
│           ├── components/          # RoleGuard, LiveStatusTable, charts/
│           ├── hooks/               # useAuth, useLiveStatus, useLogs
│           └── lib/                 # firebase.js, analytics.js
├── packages/
│   └── shared/
│       └── src/
│           ├── constants.js         # roles, status values/colours, departments
│           └── deskHours.js         # duration computation
├── firebase/
│   ├── database.rules.json          # RBAC security rules
│   ├── firebase.json
│   ├── scripts/                     # setRole.js, seedData.js
│   ├── tests/rules.test.js          # security-rule tests
│   └── functions/                   # optional server-side computation
├── docs/                            # report, diagrams, screenshots
├── .env.example                     # Firebase keys template (never commit .env)
├── package.json                     # workspaces: apps/*, packages/*
└── README.md
```

---

## 5. Data Model

```
users/{uid}                  name, email, role, department      (private profile)
faculty/{uid}                name, department, designation      (readable directory)
status/{facultyUid}          state, message, updatedAt          (live status)
logs/{facultyUid}/{pushId}   state, message, timestamp          (append-only history)
```

**Status values:** `available`, `busy`, `in_lecture`, `off_campus`

**Roles:** `student`, `faculty`, `hod`, `principal`. Each user's role (and, for HODs, department) is stored as a **custom claim** on their Firebase account, assigned only through an admin script.

---

## 6. Role and Access Matrix

| Data | Student | Faculty | HOD | Principal |
|---|---|---|---|---|
| `faculty/*` (directory) | Read | Read | Read | Read |
| `status/*` (live status) | Read | Read all; write own only | Read | Read |
| `logs/{uid}` | None | Create own entries only | Read own department | Read all |
| `users/{uid}` | None | Read own | Read own | Read all |
| Edit or delete any log | None | None | None | None |

---

## 7. Implementation Phases

Each phase lists what to build and the condition that marks it complete. Do not start a phase until the exit criteria of the previous one are met.

### Phase 1: Project Foundation
**Tasks**
- Create the Firebase project (separate projects for development and demo), enable Authentication and Realtime Database.
- Set up the monorepo with npm workspaces and the `packages/shared` module.
- Initialise the Expo app and the Next.js app, each reading Firebase config from environment variables.
- Agree the database schema (Section 5) and design the main screens in Figma.
- Set the Git workflow: a `dev` branch, one branch per feature, pull-request review before merge.

**Exit criteria:** both apps run and connect to the development Firebase project; shared constants import correctly in both apps.

### Phase 2: Authentication and RBAC
**Tasks**
- Build the login screens (mobile and web) using Firebase Authentication.
- Restrict sign-up to the institutional email domain (`@sfit.ac.in`).
- Write `setRole.js` (Admin SDK) to assign `role` and `department` custom claims.
- Add role-based routing: the app reads the user's role after login and sends them to the matching screen group.
- Write the Security Rules (Section 8) and test them in the Emulator Suite.

**Exit criteria:** every role reaches only its own screens; all rule tests pass, including tests that confirm each role is denied what it should not access.

### Phase 3: Faculty Status Broadcast
**Tasks**
- Build the faculty screen: four colour-coded status buttons and an optional custom message field with smart defaults.
- Write the status service: on tap, update `status/{uid}` and create a log entry in a single atomic multi-path write.
- Use the server timestamp for `updatedAt`, not the device clock.
- Show immediate on-screen confirmation, and handle failure with a retry message.

**Exit criteria:** a status change is saved and confirmed on screen quickly; the status and log entry always appear together.

### Phase 4: Student Directory
**Tasks**
- Build the directory screen listing faculty from `faculty/*` joined with live `status/*`.
- Add search by name and filter by department.
- Subscribe to live updates so cards change colour and message without refreshing.
- Add a faculty detail screen and a clear empty state when nothing matches.

**Exit criteria:** a status change on a faculty phone appears on a student phone without any refresh.

### Phase 5: Logging Pipeline
**Tasks**
- Finalise the log structure and validate payloads in the security rules (allowed states, required timestamp, message length limit).
- Make logs create-only: no updates or deletes by any role.
- Skip creating a log when a faculty member taps the status they are already in.

**Exit criteria:** every real status change produces exactly one log entry, and attempts to edit or delete a log are rejected.

### Phase 6: Administrative Web Dashboards
**Tasks**
- Build the Next.js dashboard shell with login, `RoleGuard`, and navigation.
- **HOD view:** live status table limited to the HOD's own department, with search.
- **Principal view:** campus-wide live status with department filter.
- Deploy to Vercel from GitHub.

**Exit criteria:** an HOD sees only their department's faculty; the Principal sees everyone; both update live.

### Phase 7: Analytics and Desk-Hour Computation
**Tasks**
- Implement `deskHours.js` in the shared package (algorithm in Section 9).
- Add charts: daily and weekly desk hours per faculty, department summaries for HODs, campus summaries for the Principal.
- Add date-range selection.

**Exit criteria:** chart values match totals calculated by hand from a prepared test log set, including the edge cases in Section 9.

### Phase 8: Testing and Validation
**Tasks**
- Run the full security-rule test suite.
- Measure update latency: record the time from a faculty tap to the student screen update across at least 50 updates, and report average and worst case.
- Run a usability trial with sample faculty and students and record task completion and a short satisfaction survey.
- Fix defects found and retest.

**Exit criteria:** acceptance criteria in Section 10 are met.

### Phase 9: Deployment and Documentation
**Tasks**
- Switch to the demo Firebase project and seed realistic faculty and department data.
- Publish the web dashboard on Vercel and distribute the mobile app through Expo Go (QR code).
- Complete the README, and write the Implementation, Results and Conclusion sections of the report using measured data.

**Exit criteria:** the full flow works end to end on the deployed system.

---

## 8. Security Rules (Starting Sketch)

Validate and adjust these in the Emulator Suite before relying on them.

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || auth.token.role === 'principal')",
        ".write": false
      }
    },
    "faculty": {
      ".read": "auth != null",
      ".write": false
    },
    "status": {
      ".read": "auth != null",
      "$uid": {
        ".write": "auth != null && auth.uid === $uid && auth.token.role === 'faculty'",
        ".validate": "newData.hasChildren(['state','updatedAt']) && newData.child('state').val().matches(/^(available|busy|in_lecture|off_campus)$/) && newData.child('updatedAt').val() === now",
        "message": { ".validate": "newData.isString() && newData.val().length <= 140" }
      }
    },
    "logs": {
      "$uid": {
        ".read": "auth != null && (auth.token.role === 'principal' || (auth.token.role === 'hod' && auth.token.department === root.child('users').child($uid).child('department').val()))",
        "$logId": {
          ".write": "auth != null && auth.uid === $uid && auth.token.role === 'faculty' && !data.exists()",
          ".validate": "newData.hasChildren(['state','timestamp']) && newData.child('timestamp').val() === now"
        }
      }
    }
  }
}
```

- **Role enforcement:** reads and writes depend on `auth.token.role` and `auth.token.department`, which only the admin script can set.
- **Append-only logs:** `!data.exists()` allows creating a log entry but blocks overwriting an existing one. No delete rule is granted.
- **Server time:** `=== now` forces the timestamp to come from the server.

---

## 9. Desk-Hour Computation (Δt)

For one faculty member and one day:

1. Fetch the day's log entries and sort by `timestamp`.
2. Merge consecutive entries with the same state.
3. For each entry, the interval runs from its timestamp to the next entry's timestamp: `Δt = t_end − t_start`. Credit `Δt` to that entry's state.
4. Desk hours = the total `Δt` credited to the `available` state.

**Edge cases to handle**
- **Last entry of the day:** no following entry exists. Close the interval at a defined end-of-working-day time, or at the current time if viewing today.
- **Intervals crossing midnight:** split at midnight and credit each part to its own day.
- **Working-hours window:** clip intervals to the institution's working hours so overnight statuses do not inflate totals.
- **No entries for a day:** report zero desk hours, not an error.
- **Duplicates and out-of-order entries:** ignore repeated states and rely on server timestamps for ordering.

---

## 10. Acceptance Criteria

| Area | Criterion |
|---|---|
| Update latency | Faculty tap to student screen under 1 second (average over at least 50 updates) |
| Role isolation | 100% of security-rule tests pass; no role can read or write outside its permissions |
| Log integrity | Exactly one log per real status change; logs cannot be edited or deleted |
| Analytics accuracy | Dashboard totals match hand-calculated values on test data |
| Department scoping | An HOD can never view another department's data |
| Usability | Faculty can set a status in one tap; trial participants complete core tasks without help |
| Privacy | Only status, message and timestamp data are stored; no images or location data |

---

## 11. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Security rules block valid actions or allow too much | Write rules early; test every role in the Emulator Suite before building features on top |
| Faculty forget to update their status | Make the interface one tap; keep status messages optional; consider an optional reminder |
| Expo configuration issues inside a monorepo | Fall back to two repositories with a copied `shared` package |
| Live occupancy map (Objective 3) is a large drawing task | Build a status table first; treat the map as an optional extension, and adjust Objective 3 wording if dropped |
| Analytics edge cases give wrong totals | Test `deskHours.js` against prepared logs covering every case in Section 9 |
| Self-reported analytics seen as monitoring | Keep status self-reported and show only aggregated desk hours to administrators |
| Firebase free-tier limits | Keep payloads small; avoid unnecessary listeners; test with realistic data volumes |

---

## 12. Definition of Done

The project is complete when:
- All five objectives are demonstrated end to end on the deployed system.
- Every acceptance criterion in Section 10 is met and the results are recorded.
- The repository has a README with setup and run instructions, and no secrets are committed.
- The report's Implementation and Results sections reflect what was actually built and measured.
