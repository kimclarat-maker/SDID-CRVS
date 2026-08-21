## Run Locally

Clone the project

```bash
  git clone NAME OF REPO
```

Go to the project directory

```bash
  cd frontend
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run dev
```

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`VITE_NODE_ENV=development #staging #production`

`VITE_APP_NAME=SDID-ENROLLMENT`

`VITE_CLIENT=NIDA`

`VITE_API_URL=tdb`

## Tech Stack

**Client:** React, Redux, rsuite, bootstrap

## Staff workspaces (SDID & CRVS)

All staff sign in at one place: `/staff/sign-in`. After authenticating, a staff
member is routed based on their **workspace assignments**:

- Assigned to SDID only → the existing SDID enrolment dashboard (`/dashboard/sdid`,
  which forwards into the existing `/dashboard/admin/*` screens — unchanged).
- Assigned to CRVS only → the CRVS dashboard (`/dashboard/crvs`).
- Assigned to both → a workspace-selection screen (`/dashboard/workspaces`), also
  reachable any time afterwards from the header's account menu ("Switch workspace").
- No valid assignment → `/dashboard/access-denied`.

Accounts without an `assignments` array (every existing/real backend account today)
are treated as legacy SDID staff by a compatibility adapter
(`src/utils/workspace/index.ts`) built from their existing `accessRole`/`permissions` —
no backend change is required for this milestone. `/dashboard/admin/*` keeps working
for bookmarks/links, gated by SDID workspace membership rather than being open to any
signed-in user. Route guards (`RequireWorkspace`, `RequirePermission` in
`src/navigation/guards/`) protect both workspaces at the route level, not just their
sidebar menus — a legacy `SUPERADMIN` account does **not** gain CRVS approval
authority, since it only ever has an SDID assignment.

CRVS roles (Birth Notification Officer, CRVS Registration Officer, Civil Registrar,
CRVS Supervisor) and their dashboards are foundational in this milestone —
notification/registration/correction queues are read-only demo fixtures
(`src/demo/seed/crvs.ts`); the birth-registration creation and review workflow itself
ships in a later milestone (see the "Coming in the next milestone" pages under
`/dashboard/crvs`).

## Demo Mode

Demo mode lets you explore the application with realistic fictional data and no live backend. It is off by default and must never be enabled in production.

### Running in demo mode

```env
VITE_DEMO_MODE=true
```

```bash
npm run dev
```

A "Demo environment" badge appears on the login screen, the dashboard header, and the public tracking/verification result pages whenever demo mode is active.

### Demo accounts

Documented in `src/demo/credentials.ts`. All `@demo.identity.local` — fictional, not real people or organizations.

| Workspace | Role | Email | Password |
| --- | --- | --- | --- |
| SDID | Administrator | admin@demo.identity.local | DemoAdmin@2026 |
| SDID | Enrolment Officer | officer@demo.identity.local | DemoOfficer@2026 |
| SDID | Reviewer | reviewer@demo.identity.local | DemoReviewer@2026 |
| SDID | Supervisor | supervisor@demo.identity.local | DemoSupervisor@2026 |
| CRVS | Birth Notification Officer | notifier@demo.identity.local | DemoNotifier@2026 |
| CRVS | CRVS Registration Officer | crvs.officer@demo.identity.local | DemoCrvsOfficer@2026 |
| CRVS | Civil Registrar | registrar@demo.identity.local | DemoRegistrar@2026 |
| CRVS | CRVS Supervisor | crvs.supervisor@demo.identity.local | DemoCrvsSupervisor@2026 |
| SDID + CRVS | SDID Supervisor + CRVS Registration Officer (dual) | dual.staff@demo.identity.local | DemoDualStaff@2026 |

The dual-workspace account opens the workspace-selection screen on sign-in — pick
either card to continue into that workspace. It is deliberately paired with CRVS
Registration Officer rather than Civil Registrar, so holding both workspaces never
implies registration-approval authority on its own.

The login screen also shows a "Demo accounts" panel (demo mode only), grouped into
SDID staff / CRVS staff / Multi-workspace staff collapsible sections, with a "Use
this account" button per role that fills in the form — you still have to submit it.

### What's simulated

- **Authentication & permissions** — role-aware demo session (`src/demo/session.ts`), written through the app's real session storage so every existing route guard and permission check works unmodified. Demo tokens are unsigned, JWT-shaped, and never accepted by a real backend.
- **Dashboard analytics, citizen search, application lists** (pending/approved/rejected/drafts), **accounts, centres, devices, notifications, audit logs, appointment scheduling** — all read from a typed seed dataset (`src/demo/seed/`) persisted in `localStorage` under `sdid-demo-*` keys.
- **Approve / reject** on the Pending requests list (demo mode only) — a real mutating action: it updates the application's status, status history, review comments and audit log, and is reflected immediately in the Approved/Rejected lists and dashboard counts.
- **Public application tracking** — reference `APP-DEMO-2026-0001`, code `246810`.
- **Public document verification** — document number `CERT-DEMO-2026-0001`, code `135790`.
- **Biometric capture** — `src/components/demoBiometricSimulator` provides a simulate-success/poor-quality/device-error UI with no hardware or real capture involved. It is not yet wired into the production selfie/fingerprint/iris/signature capture screens (those remain hardware-only).

### What still requires a real backend

The full multi-step pre-enrolment wizard (address/family/document upload/biometric capture/submit), appointment transfer, offline synchronization, and admin account/device management mutations are not yet wired to the demo data layer. In demo mode, any screen that isn't listed above will show an error rather than silently calling a real endpoint — see the safety net in `src/api/index.ts`.

### Resetting demo data

Settings → **Demo data** tab (demo mode only) → **Reset demo data**, with a confirmation step. This restores every seeded account, application, appointment and log to its original state. Demo data also auto-reseeds if the seed shape changes (`src/demo/config.ts`, `DEMO_DATA_VERSION`).

### Security

`VITE_DEMO_MODE` is a frontend convenience flag, not a security boundary — production authorization is enforced by the real backend regardless of this setting. Demo credentials are only accepted when the flag is `true` and are never valid against a real backend token check.

## Support

For support, email info@huzalabs.com or didierkibugenza@huzalabs.com.
