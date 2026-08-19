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

| Role | Email | Password |
| --- | --- | --- |
| Administrator | admin@demo.identity.local | DemoAdmin@2026 |
| Enrolment Officer | officer@demo.identity.local | DemoOfficer@2026 |
| Reviewer | reviewer@demo.identity.local | DemoReviewer@2026 |
| Supervisor | supervisor@demo.identity.local | DemoSupervisor@2026 |

The login screen also shows a "Demo accounts" panel (demo mode only) with a "Use this account" button per role that fills in the form — you still have to submit it.

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
