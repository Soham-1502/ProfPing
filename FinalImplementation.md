# ProfPing: Final Implementation (Locked Scope)

This is the locked specification for the five surfaces: **Student App, Faculty App, HOD App, Principal Web, HOD Web**. Anything not listed here is out of scope. Items tagged **(change)** are functional changes to the current build and **(new)** means not built yet.

---

## Implementation Rule: UI and Theme Are Frozen

**Do not change the current UI or theme.** The layout, colors, fonts, spacing, icons, component styles, screen designs and tab names stay exactly as they are now. This document is a **functionality checklist**, not a redesign.

How to apply it:
1. Go through every item in sections 2 to 6 and check whether the **functionality** exists and works in the current build.
2. If it works, leave it alone.
3. If it is missing or broken, implement or fix it, **using the existing theme and components**. A new screen or section needed for missing functionality (for example the department chooser or Institution Settings) must look like the rest of the app.
4. If an item can only be done by changing existing UI, **do not change it**. List it instead and wait for approval.
5. Do not rename, restyle, move or remove existing elements, tabs or labels.
6. When finished, return a short table: **Item | Status (Already works / Fixed / Added / Could not do) | Note**.

Wording differences in the existing UI (for example label names, tab names, or profile fields) are **not** to be edited. They are listed in section 8 for a separate decision.

---

## 0. Locked Decisions

| Topic | Locked decision |
|---|---|
| Roles | Student, Faculty, HOD, Principal. No other roles. |
| Status names | Exactly **Available, Busy, In Lecture, Off Campus**, always shown with an icon and a text label. |
| Student access | A verified `@student.sfit.ac.in` Google account becomes a student automatically. Nobody adds students. |
| Staff access | `@sfit.ac.in` accounts must be pre-approved: faculty by their HOD, HODs by the Principal. An unapproved staff account sees "Access restricted" and never becomes a student **(change)**. |
| Student department | Chosen by the student at first sign-in (self-declared) **(new)**. |
| HOD mobile app | Same as the Faculty App, plus a **Department** tab (read-only) showing the HOD's faculty and their status. All management stays on the HOD web portal. |
| Notifications | **Notify When Free** is the only notification feature to build or fix. Ping Faculty is out of scope: do not build or extend it, and leave its existing UI untouched (see section 8). |
| Working hours, desk-hour target, evening reset | One institution-wide setting, controlled only by the Principal **(change)**. |
| Wording | Use "availability" in any new text. Existing labels are left as they are (see the rule above). |
| Privacy | The system stores only: status, note, timestamps; user name, email, department; faculty directory details set by the HOD; student session and access flag; Notify requests with a push token; favorites on the device. No images, GPS or RFID. |

---

## 1. Shared Foundations

### 1.1 Access matrix

| Data | Student | Faculty | HOD | Principal |
|---|---|---|---|---|
| Faculty directory (`faculty/*`) | Read | Read | Read; write own department | Read |
| Live status (`status/*`) | Read | Read; write own | Read; write own | Read |
| History logs (`logs/{uid}`) | None | Read and create own | Read own department; create own | Read all |
| Own account (`users/{uid}`) | Own | Own | Own, plus students of own department | All |
| Pre-approved staff | None | None | Add/remove faculty in own department | Add/remove HODs |
| Student access flag | Own record | None | Revoke/restore own department | Read |
| Institution settings | Read | Read | Read | Read and write |
| Notify requests | Create/delete own | None | None | None (server reads) |

### 1.2 Data model (use existing names where already built)

```
users/{uid}                        name, email, role, department, createdAt
preapproved_users/{emailKey}       name, email, role, department, status (pending/active)
faculty/{uid}                      name, email, department, designation, facultyId,
                                   cabin, floor, wing, intercom, officeHours   (HOD-set, locked)
status/{uid}                       state, message, updatedAt
logs/{uid}/{id}                    state, timestamp                             (append-only)
studentAccess/{uid}                name, email, department, lastSeen, revoked
settings/institution               workStart, workEnd, deskTargetHours, resetTime, resetEnabled
notifyRequests/{facultyUid}/{studentUid}   pushToken, createdAt
```

### 1.3 Institution settings (new, Principal only)
- `workStart` 08:30, `workEnd` 17:30, `deskTargetHours` 3.0, `resetTime` 17:01, `resetEnabled` true.
- Every screen and calculation reads these values. No hard-coded copies anywhere.

### 1.4 Desk-hour rules
1. Sort the day's logs by server timestamp and merge consecutive entries with the same state.
2. Each interval runs from its timestamp to the next entry's timestamp (`Δt = t_end − t_start`) and is credited to that entry's state.
3. Clip every interval to `[workStart, workEnd]`. Close the last interval at the earlier of "now" and `workEnd`.
4. **Desk hours = time credited to Available.** The same engine also reports In Lecture and Busy time.
5. A day with no logs counts as 0 for that day but is excluded from the 7-day average. Weekends show "no data".
6. A faculty member **meets the target** when desk hours ≥ `deskTargetHours`.

### 1.5 Notify When Free (the only notification feature)
- A **Notify me** button appears on a faculty card whenever the status is not Available. When already requested it reads **You'll be notified** and a tap cancels it.
- Tapping writes `notifyRequests/{facultyUid}/{studentUid}` with the student's push token.
- When `status/{facultyUid}.state` becomes `available`, a server job sends one push to every requester, then deletes those requests. It is one-shot.
- Unused requests are deleted at the evening reset.
- If push permission is denied or unavailable, show an in-app message and fall back to an in-app alert while the app is open.
- **Platform limit:** remote push notifications are unavailable in Expo Go on Android from SDK 53, and a development build is required. Plan for a development build (EAS) for the demo.
- **Server trigger (decide, see section 8):** a Firebase Cloud Function on the status path, or a Next.js route called after the faculty app sets Available.

### 1.6 Evening reset
- At `resetTime`, a server job sets every faculty status that is not Off Campus to **Off Campus**, writes a log entry for each, and clears pending Notify requests.
- Display fallback: any status last updated before today's `workStart` shows a muted **Stale** tag.
- The scheduling mechanism is an open item (section 8).

### 1.7 Rules that must live in the database rules (not only in the apps)
- Every protected path requires `email_verified` and a college-domain email.
- Role, department scope, the locked faculty fields, the student revoke flag and append-only logs are all enforced server-side.
- Only a verified Principal can change roles and institution settings, through the server route.
- Revoking an HOD, faculty member or student also revokes their sessions.

### 1.8 Design reference
Use the **existing theme in the current code** for everything, including new screens. `DESIGN.md` is a reference document only. Do not change colors, fonts or components to match it.

---

## 2. Student App (mobile)

**Users:** any verified `@student.sfit.ac.in` student. **Mode:** read-only, plus favorites and Notify.

### Screens and elements

**Sign-in** (Google, college accounts only)
- Non-college accounts are rejected with a clear message.
- Unapproved `@sfit.ac.in` accounts see **Access restricted: ask your HOD to add you**.

**Department chooser (new, first sign-in only)**
- One required choice: CMPN, INFT, EXTC, ECS. It can be changed later from Profile.

**Tab 1: Home**
- Header: logo and department chip.
- Search bar: name, cabin, department, or note keywords.
- Filter chips: All, Starred, CMPN, INFT, EXTC, ECS.
- Counter: "N Available".
- **Faculty card:**
  - initials avatar with a status dot
  - name, designation, department
  - status chip (icon, color and label)
  - note text
  - cabin, with intercom and office hours when the card is expanded
  - "Updated X min ago", and a **Stale** tag when not updated today
  - star toggle
  - **Notify me** button (not Available only)
- States: loading skeleton, "No Faculty Registered", no search results, offline banner.

**Tab 2: Cabins / Maps (keep the existing tab name and design)**
- Faculty grouped by floor and wing, then room number.
- Each room shows the faculty name and a presence dot from their self-reported status.
- Filter by department. It is a directory, not 3D wayfinding and not location tracking, and its data must come from the faculty directory and live status.

**Tab 3: Favorites**
- Starred faculty with the same card, a search box, and an empty state "No starred faculty".
- Stored on the device only.

**Tab 4: Profile (keep the existing design)**
- Functionality needed: name, college email and department come from the signed-in account, the department can be changed, and the starred count is live.
- A **Notify When Free alerts** on/off toggle must actually work.
- Log out works and clears the session.
- Any other element on this screen (see the list below) stays as it is unless approved.

**Access revoked screen:** shown when the HOD revokes access, with immediate sign-out.

### Items that conflict with the report (UI frozen: not changed by this implementation)
These exist in the current student UI but are not in the report or have no data behind them: RFID row, Response Rate, Pings Sent, roll number, mentor, division and batch, notification bell badge, Quiet During Lectures and other toggles, Ping Faculty and its visit-request sheet. Do not remove or restyle them. Report back which ones are working and which are placeholders, and the decision on each is made separately (section 8).

### Reads and writes
- Reads: `faculty`, `status`, `settings`, own `users`.
- Writes: own `studentAccess` record (including department and last seen), own `notifyRequests`.

---

## 3. Faculty App (mobile)

**Users:** pre-approved faculty (added by their HOD). They sign in with Google; the first sign-in claims their record.

**Tab 1: Status**
- Large banner showing the current status, the note and the last-updated time.
- Four status buttons: **Available, Busy, In Lecture, Off Campus**. One tap updates immediately, with a short confirmation.
- Note: preset chips (for example "Checking papers", "Running 10 mins late", "In a meeting") and a custom text box of up to 140 characters.
- **Locked rule:** changing the status clears the note, so old text never sits under a new status.
- If the update fails, show a retry message. The server timestamp is used, not the phone's clock.

**Tab 2: My Hours (keep the existing design)**
- Today's desk hours against the target from the institution settings, as a progress bar.
- A breakdown of Available, In Lecture and Busy time.
- A bar chart for the last 7 days.
- Only the faculty member's own data.

**Tab 3: Profile**
- Locked, read-only fields: name, faculty ID, department, cabin, intercom, office hours (set by the HOD).
- Email, a role badge, and sign-out.
- A note: "Details are set by your HOD".

**Not included:** editing locked fields, viewing others' data, notifications.

**Reads and writes:** reads own `faculty`, `settings`, own `logs`; writes own `status` and a `logs` entry (together, in one write).

---

## 4. HOD App (mobile)

**Users:** HODs appointed by the Principal. It is the Faculty App plus one tab.

**Includes everything in section 3:** Status, My Hours and Profile, with the Profile badge showing "HOD".

**Tab 4: Department (new, read-only)**
- Summary counts by status: Available, In Lecture, Busy, Off Campus.
- A list of the HOD's department faculty: name, designation, status chip, note, cabin, "Updated X min ago", Stale tag, and today's desk hours.
- A search box.
- A hint: "Manage faculty on the web portal".

**Not included:** adding, editing or removing faculty, student access control and settings. These stay on the HOD web portal.

**Reads and writes:** same as the Faculty App, plus a read of the department's `faculty`, `status` and `logs`.

---

## 5. Principal Web (`/principal`)

**Users:** the Principal only. Everyone else is redirected to an Access Restricted screen.

**Header:** name, email, role badge and sign-out.

**Overview**
- KPI cards: **Campus Faculty, Available at Desk, In Lecture, the desk-hour target card (N of M faculty meeting the target), Adoption Today (X of Y updated today).** Keep the existing card labels.

**Live Campus Status**
- Table: name, department, cabin, status chip, note, desk hours, last updated, Stale tag.
- Search by name, email, cabin, department or note, and department tabs.

**Desk-Hour Analytics**
- Stacked bar per faculty (Available, In Lecture, Busy) with the target line.
- Date range: Today and Last 7 Days.

**Department Summary (keep the existing design and labels)**
- Per department: average desk hours, faculty count, and how many meet the target.

**HOD Governance**
- Add HOD form: name, `@sfit.ac.in` email, department dropdown.
- List of HODs only, with status Pending/Active and a **Delete** button.
- One HOD per department: a second add is blocked with a message to delete the current HOD first.
- Delete asks for confirmation, removes the role and record, revokes sessions, and leaves faculty, logs and statuses untouched.
- The Principal cannot delete themselves or any non-HOD account. There is no "add faculty" action here.

**Institution Settings (new)**
- Fields: working hours start and end, desk-hour target, evening reset time and on/off.
- Validation: start before end, a target within the window, and a confirmation before saving.

**Not included:** changing anyone's status, editing faculty or students, role changes other than HODs.

---

## 6. HOD Web

**Users:** HODs only, scoped strictly to their own department.

**`/hod` Dashboard**
- KPI cards: Department Faculty, Available, In Lecture, Meeting Target.
- Live table: name, designation, status chip, note, cabin, intercom, desk hours, last updated.
- Desk-hour chart with the Today and Last 7 Days range.

**`/hod/faculty` Faculty Directory Manager**
- Add form: name, `@sfit.ac.in` email, faculty ID, designation, cabin, floor, wing, intercom, office hours. The department is fixed to the HOD's own.
- List with Pending/Active status, **Edit** and **Remove**.
- These fields appear read-only in the faculty and HOD apps (the integrity lock).
- Remove deletes the faculty role and record, revokes sessions, and keeps their logs.

**`/hod/students` Student Access Control**
- Students whose self-declared department matches, with name, email, last seen, and status.
- Search, and a **Revoke / Restore** toggle per student, with confirmation.
- No add-student action. A note says the department is self-declared.

**`/hod/settings` (functional change only)**
- Because the Principal now controls these values, the page keeps its layout but its fields become read-only, with a short "Set by the Principal" note, showing working hours, the target and the reset time from the institution settings.

**Not included:** other departments, role assignment, editing statuses.

---

## 7. Out of Scope (Future Scope)

- Ping Faculty and visit-request messaging.
- Interactive 3D wayfinding or any location tracking.
- Timetable or calendar integration that sets In Lecture automatically.
- Alternate-faculty suggestions.
- A student web directory.
- Multilingual interface and a dark theme.
- Adoption trends, long-range analytics and exports.
- College ERP and single sign-on.
- Student roster import, and large-scale load testing.
- A formal privacy and consent policy.

---

## 8. Open Items to Confirm

| # | Item | Recommended default |
|---|---|---|
| 1 | **HOD's own record** (cabin, intercom, faculty ID): the Principal's Add HOD form does not collect it. | Add an optional cabin field to the Add HOD form, or let the HOD complete their own record once on the web portal. |
| 2 | **Notify trigger:** Cloud Function (needs Firebase's paid plan) or a Next.js route called by the faculty app. | Cloud Function if billing is acceptable; otherwise the Next.js route. |
| 3 | **Evening reset scheduling:** Vercel cron or Cloud Scheduler. Vercel cron times are in UTC, and on the free plan may not run at the exact minute. | Accept a small delay and rely on the Stale and display rules. |
| 4 | **Push on Android:** needs a development build, not Expo Go. | Build one development APK for the demo. |
| 5 | **Per-faculty vs aggregate desk hours** shown to the Principal. | Keep per-faculty, and confirm with your mentor. |
| 6 | **Student domain:** confirm all students use `@student.sfit.ac.in`. | If not, treat any non-staff college account as a student. |
| 7 | **UI items that conflict with the report** (RFID row, Response Rate, Pings Sent, student profile academic fields, notification bell and extra toggles, Ping Faculty, "Maps" naming, "Performance" and "Availability Rate" wording). The UI is frozen, so none are changed here. | Decide separately: keep them as they are, make them work with real data, or remove them. Keep the report consistent with the choice. |
| 8 | **Report:** Objectives, flow-diagram text and Future Scope still describe the older scope. | Update them to match this document. |

---

## 9. Acceptance Checklist

**All surfaces**
- A status change appears on every screen in under 1 second (measured over at least 50 updates).
- Every role is denied what it should not read or write, tested directly against the database rules in the Emulator Suite.

**Student App**
- Unapproved staff accounts and non-college accounts are rejected. Revoked students are signed out promptly.
- Notify me sends exactly one push when the faculty member becomes Available, then clears.

**Faculty and HOD Apps**
- Locked fields cannot be edited. Changing a status clears the note.
- The HOD Department tab shows only their own department.

**Principal Web**
- Adding a second HOD to a department is blocked. A deleted HOD is signed out and cannot return.
- Changing institution settings updates every screen's calculations.

**HOD Web**
- An HOD cannot see or edit another department, including by direct database calls.
- A newly added faculty member signs in and sees their locked profile.

**Analytics**
- Desk-hour totals match a hand-calculated set, including clipping at the window edges and days with no logs.
