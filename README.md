# ProfPing: Real-Time Faculty Availability & Desk-Hour Telemetry

ProfPing is an institutional availability and telemetry platform. Faculty broadcast their live availability in one tap from their mobile devices, students view a real-time color-coded directory over WebSockets, and institutional administrators (Principal & HODs) monitor live rosters and audit desk-hour compliance on interactive web dashboards.

---

## 1. System Architecture

```
         Mobile App (Expo)                      Web Admin Portal (Next.js)
    [Faculty & Student Clients]                   [HOD & Principal Views]
                 \                                     /
                  \---- Live WebSocket Connection ----/
                                    |
                                    v
                     +-----------------------------+
                     |        Firebase Auth        |
                     |  (RBAC via Custom Claims)   |
                     +-----------------------------+
                     |  Firebase Realtime Database |
                     |   - /users    (Profiles)    |
                     |   - /faculty  (Directory)   |
                     |   - /status   (Live State)  |
                     |   - /logs     (Append-Only) |
                     +-----------------------------+
```

### Key Architectural Tenets:
- **Zero-Poll Real-Time Sync:** Real-time state synchronization over WebSockets via Firebase Realtime Database.
- **Atomic Multi-Path Writes:** Status broadcast updates `/status/{uid}` and pushes an immutable `/logs/{uid}/{pushId}` record in a single atomic transaction.
- **Strict RBAC Security Rules:** All access controls (department scoping, self-only writes, append-only logs) are enforced directly in database security rules.
- **Privacy by Design:** No biometrics, camera feeds, or GPS location tracking. Only faculty-initiated state reports and server timestamps are stored.

---

## 2. Monorepo Structure

```
profping/
├── apps/
│   ├── mobile/                      # React Native + Expo app (Faculty & Student)
│   │   ├── app/
│   │   │   ├── (auth)/login.jsx     # Institutional login screen with domain check
│   │   │   ├── (faculty)/index.jsx  # 1-tap broadcast screen + smart notes
│   │   │   └── (student)/index.jsx  # Live search, department filters & cards
│   │   └── src/
│   │       ├── context/             # AuthContext.jsx
│   │       └── services/            # firebase.js, statusService.js, directoryService.js
│   └── web/                         # Next.js 16 Web Portal (HOD & Principal)
│       ├── app/
│       │   ├── login/page.jsx       # Admin portal login with domain validation
│       │   ├── hod/page.jsx         # Department-scoped dashboard & compliance
│       │   └── principal/page.jsx   # Campus-wide dashboard & analytics
│       └── src/
│           ├── components/          # RoleGuard, LiveStatusTable, DeskHourChart
│           └── lib/                 # firebase.js, dashboardService.js
├── packages/
│   └── shared/                      # Shared npm workspace module (@profping/shared)
│       ├── src/constants.js         # Roles, status keys, colors, departments
│       └── src/deskHours.js         # Section 9 Δt duration computation engine
├── firebase/
│   ├── database.rules.json          # RBAC security rules
│   ├── firebase.json                # Emulator configuration
│   ├── scripts/                     # setRole.js, seedData.js
│   └── tests/rules.test.js          # Security rules unit test suite
├── .env.example                     # Environment variables template
├── package.json                     # Root Turborepo workspaces
└── README.md
```

---

## 3. Demo Accounts & RBAC Matrix

All test accounts use the password: `Password@123`

| Role | Account Email | Scope & Permissions | Portal Route |
|:---|:---|:---|:---|
| **Principal** | `principal@sfit.ac.in` | Campus-wide read for all faculty, audit logs, and compliance analytics. | `/principal` (Web) |
| **HOD (CMPN)** | `hod.cmpn@sfit.ac.in` | Scoped strictly to Computer Engineering faculty and logs. | `/hod` (Web) |
| **HOD (INFT)** | `hod.inft@sfit.ac.in` | Scoped strictly to Information Technology faculty and logs. | `/hod` (Web) |
| **Faculty** | `faculty.snehal@sfit.ac.in` | 1-tap status broadcast (`Available`, `Busy`, `In Lecture`, `Off Campus`). | `/(faculty)` (Mobile) |
| **Faculty** | `faculty.rahul@sfit.ac.in` | 1-tap status broadcast (`Available`, `Busy`, `In Lecture`, `Off Campus`). | `/(faculty)` (Mobile) |
| **Student** | `student@sfit.ac.in` | Real-time directory, search by cabin/name, department filter chips. | `/(student)` (Mobile) |

---

## 4. Getting Started

### Prerequisites:
- **Node.js**: v20+ (Tested on LTS v24)
- **npm**: v10+

### Installation:
```bash
git clone https://github.com/Soham-1502/ProfPing.git
cd ProfPing
npm install
```

### Running the Web Admin Portal (Next.js):
```bash
npm run dev --workspace=web
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.
- Navigate to `/login` to use the 1-tap quick presets for Principal or HOD.

### Running the Mobile App (Expo):
```bash
npm run dev --workspace=@profping/mobile
# Or navigate to mobile directory:
cd apps/mobile && npx expo start
```
- **To view in web browser:** Press `w` in the terminal to launch at `http://localhost:8081`.
- **To view on physical phone:** Scan the terminal QR code using the **Expo Go** app (iOS / Android).

---

## 5. Automated Test Suites

ProfPing includes native unit and security rule verification test suites:

### Run All Tests (Root):
```bash
npm test
```
Runs both the telemetry math engine tests and database security rule tests with 100% pass rate.
Validates zero-log edge cases, working-hours clipping (8:30 AM – 5:30 PM), consecutive state deduplication, and out-of-order timestamp sorting.

### Run Security Rule Verification Tests:
```bash
cd firebase
npm test
```
Validates RBAC isolation: student read-only, faculty self-write only, append-only logs (`!data.exists()`), and HOD department-level scoping.

---

## 6. Production Deployment

### Web Portal (Vercel):
1. Connect your GitHub repository to Vercel.
2. Set Root Directory to `apps/web`.
3. Add environment variables from `.env.example` (`NEXT_PUBLIC_FIREBASE_*`).
4. Deploy!

### Mobile Distribution (Expo EAS):
```bash
cd apps/mobile
npx eas-cli build -p android --profile preview
```
Generates an installable APK or distributes instantly via Expo Go QR code.
