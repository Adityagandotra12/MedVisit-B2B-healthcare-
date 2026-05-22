# MedVisit (React + TypeScript)

Smart patient flow from check-in to follow-up.

## Project Overview

MedVisit is a B2B healthcare SaaS frontend with role-aware workflows:

- **Admin users** can add, edit, delete, and import patient visit data.
- **Doctor users** can view only their own assigned patient records and update visit progress/status.
- Includes dashboards, analytics, patient management, notifications, and route protection.

## Tech Stack

- React + Vite + TypeScript
- React Router (protected routes + lazy loading)
- Context API + `useReducer` for global state
- Firebase Authentication (email/password)
- Recharts for analytics charts
- Service Worker + Browser Notifications API

## Core Functionality

### 1) Authentication & Authorization

- Login with Firebase email/password.
- Form validation, loading state, and error handling.
- Session persistence via Firebase `onAuthStateChanged`.
- Private route guard for authenticated areas.
- Role model:
  - `admin@healthops.com` => admin
  - other users => doctor
- Doctor identity mapping (for data scoping) from email keywords:
  - `aditya` => `Dr. Aditya`
  - `harini` => `Dr. Harini`
  - `kapoor` => `Dr. Kapoor`
  - `shah` => `Dr. Shah`

### 2) Dashboard

- KPI cards:
  - Total Patients
  - Today's Appointments
  - Waiting Queue
  - Follow-up Pending
- Recent patient visits table.
- Notification trigger and alert panel.
- Shows logged-in user details.

### 3) Patient Management

- Add/Edit/Delete patient records (admin).
- Import patient records via Excel/CSV (admin).
- Grid and list/table views.
- Search + filter + sort + pagination.
- Doctor can update status and mark done only for their own patients.
- Patient detail page.

Patient fields supported:

- Patient ID
- Patient Name
- Contact Number
- Gender
- Age
- Reason For Visit
- Consulting Doctor
- Specialization
- Appointment Date
- Appointment Time
- Queue No
- Status
- Priority
- Follow-up Appointment
- Visit Notes

### 4) Analytics

- Live analytics based on current patient state.
- Filters:
  - All time / Today / This week / This month
  - Doctor filter (restricted for doctor users)
- Visuals:
  - Appointments vs Completed
  - Patient Status Distribution
  - Summary cards (visits, consultations, follow-up, queue)
- Export report to CSV.

### 5) Notifications

- Service worker registration.
- Browser notification permission flow.
- In-app toast notifications.
- Notification events (patient added/imported/status updates).

## Context API Documentation

Global state is organized into 3 contexts, each built using `useReducer`:

### `AuthContext` (`src/context/AuthContext.tsx`)

Purpose: authentication and identity state.

State:

- `user`
- `loading`
- `authReady`
- `error`

Actions/Methods:

- `login(email, password)`
- `logout()`

Derived values:

- `role`, `isAdmin`, `isDoctor`
- `doctorName` (used for doctor-specific data visibility)
- `isFirebaseConfigured`

### `PatientContext` (`src/context/PatientContext.tsx`)

Purpose: patient data management.

State:

- `patients: Patient[]`

Actions/Methods:

- `addPatient(patient)`
- `updatePatient(patient)`
- `removePatient(patientId)`

### `UIContext` (`src/context/UIContext.tsx`)

Purpose: cross-page UI state.

State:

- `viewMode` (`grid` / `list`)
- `notifications`

Actions/Methods:

- `toggleViewMode()`
- `pushNotification(message)`
- `clearNotifications()`

### Provider Composition

`AppProviders` wraps the app in this order:

1. `AuthProvider`
2. `PatientProvider`
3. `UIProvider`

This prevents prop drilling and keeps domain concerns separated.

## Lazy Loading Documentation

Lazy loading is implemented at route level in `src/routes/AppRouter.tsx`:

- Uses `React.lazy(() => import(...))` for all pages:
  - `LoginPage`
  - `DashboardPage`
  - `AnalyticsPage`
  - `PatientsPage`
  - `PatientDetailsPage`
  - `NotFoundPage`
- Wrapped with `Suspense` and a loader fallback.
- Benefit: smaller initial bundle and faster first load.

## Folder Structure

```text
src/
  features/
    auth/
    patients/
    analytics/
  components/
    common/
    layout/
  pages/
  context/
  services/
  hooks/
  utils/
  routes/
  styles/
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create env file:
   ```bash
   cp .env.example .env.local
   ```
3. Fill Firebase values in `.env.local`.
4. Enable Firebase Authentication -> Email/Password.
5. Verify env file (on every new machine):
   ```bash
   npm run verify-env
   ```
6. Run app:
   ```bash
   npm run dev
   ```

### Firebase still not configured?

Run these in the **project root** (where `package.json` lives):

```bash
npm run verify-env
npm run dev
```

If `verify-env` fails:

| Problem | Fix |
|--------|-----|
| `.env.local` missing | `cp .env.example .env.local` and paste Firebase values |
| Wrong folder | `cd` into the cloned repo root, not a parent folder |
| Windows saved as `.env.local.txt` | Enable "File name extensions", rename to `.env.local` |
| Dev server already running | Stop it (Ctrl+C), then `npm run dev` again |
| Vercel / production URL | Add the same `VITE_FIREBASE_*` vars in Vercel -> Settings -> Environment Variables, then redeploy |

`.env.local` is **not** in Git (ignored by `*.local`). You must create it on every laptop.

## Scripts

- `npm run dev` - run development server
- `npm run build` - type-check + production build
- `npm run preview` - preview built app
- `npm run lint` - run lint checks
- `npm run verify-env` - check `.env.local` exists and has all Firebase keys

## Demo Credentials

Create users in Firebase Authentication -> Users:

- Admin: `admin@healthops.com`
- Doctor examples:
  - email containing `aditya`
  - email containing `harini`
  - email containing `kapoor`
  - email containing `shah`

## Future Enhancements

- Firestore real-time multi-user syncing.
- PDF report export.
- Role claims via Firebase custom claims.
- Deployment docs with screenshots.
