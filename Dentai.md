# DentAI — Build Summary

A record of everything built so far: what exists, how it's organized, and what's still open. Written to be handed to anyone picking up the project — a teammate, a future session, or your backend engineer.

---

## 1. What DentAI is

A Clinical Decision Support System (CDSS) frontend for dentists. No AI/ML logic lives in the frontend — it authenticates users, collects patient data and CBCT scans, and renders diagnosis/treatment results. Supabase (PostgREST + Storage + Auth) is the entire backend: the frontend talks to it directly via `supabase-js` and deploys to Vercel as static files only. Diagnosis inference is stubbed in the database (deterministic stage progression from `created_at`, then a persisted mock result) until a real inference service is plugged in.

**Stack:** React, Vite, Tailwind CSS v4, React Router, Framer Motion, React Hook Form + Zod, @supabase/supabase-js, Lucide React, Context API.

**Design:** dark clinical theme — background `#111827`, surface `#1F2937`, teal accent `#14B8A6`, Poppins for headings / Inter for body — matching the original brief exactly, wired as Tailwind v4 `@theme` tokens.

---

## 2. Build order (what happened, in sequence)

### Phase 0 — Architecture plan
Folder structure, data-flow rules (Component → hook → Service → api/ → apiClient → backend), auth flow, routing map, and a mock-data strategy (`VITE_USE_MOCKS` env flag) agreed before any code was written.

### Phase 1 — Foundation
Vite + Tailwind v4 scaffold, design tokens, the full folder structure, and every reusable UI primitive: `Button`, `Input`, `Textarea`, `Select`, `Card`, `Badge`, `ProgressBar`, `Modal`, `ConfirmationDialog`, `Toast`, `Avatar`, `Dropdown`, `SearchInput`, `Skeleton`, `LoadingOverlay`, `Pagination`, `Table`, and later `Switch`. Shared shell: `Sidebar` (collapsible + mobile drawer), `Breadcrumb`, `Navbar`. `AuthLayout` / `DashboardLayout`. `AuthContext`, `ThemeContext`, `NotificationContext` and their hooks. `apiClient` with JWT injection and 401 handling. Full route tree with `ProtectedRoute`, lazy-loaded pages. Login/Register/Forgot Password working end-to-end against mocks.

### Phase 2 — Core diagnosis loop
The app's central workflow, built vertically end-to-end:
- **New Diagnosis**: one `react-hook-form` instance across three sections (Patient Info / Clinical Notes / CBCT Upload), Zod-validated, drag-and-drop `FileUploader` restricted to `.dcm` / `.nii.gz`.
- **Processing**: a `usePolling` hook watches a mock session progress through five stages (Uploading → Preparing → Processing → Generating → Finalizing) with an animated `ProcessingStages` component, then auto-redirects.
- **Diagnosis Result**: patient summary, input summary, `CBCTPreviewPanel` (placeholder, shaped for a real viewer), a `ResultsTable` with `ConfidenceBadge`/`ConfidenceBar` (both driven by one threshold config), clinical notes summary.
- **Treatment Plan**: vertical `Timeline` of expandable `TreatmentPhaseCard`s (objectives, description, recommendations, expected outcomes), clinician notes, save/print/report actions.

### Phase 3 — Patients & Reports
- **Patients**: searchable/sortable/paginated table (mock dataset of 8), create/edit modal (`PatientForm`, Zod-validated), delete with `ConfirmationDialog`, click-through to profile.
- **Patient Profile**: info card, visit timeline (reusing the Phase 2 `Timeline`), placeholder sections for notes/reports.
- **Reports**: searchable/paginated table with status badges, `ReportPreviewModal`, download action.

### Phase 4 — Dashboard
Real content wired from the services built in Phases 2–3: four stat cards (Total Patients, Diagnoses Completed, Reports Generated, System Status), a paginated recent-diagnoses table (View jumps straight to that patient's profile), `QuickActions` shortcuts, a live `RecentReports` list pulled from `ReportService`, and a `SystemStatus` indicator.

### Phase 5 — Settings
Every section from the brief: Profile (name/email/clinic, Zod-validated), Password (current/new/confirm with match validation), Notifications (three toggle switches via the new `Switch` primitive), Theme (status display — dark-only for v1, wired through `ThemeContext` so a real switcher slots in later), System Information (read-only version/environment/last-updated).

### Phase 6 — Accessibility & responsive polish
Keyboard support for clickable table rows (Tab + Enter/Space with visible focus), `Dropdown` closes on Escape, `Modal` traps Tab and restores focus to its trigger on close, a "Skip to main content" link, `aria-label`s on icon-only controls, and the Navbar's global **Search** field (from the original spec) added — it deep-links into Patients via `?q=`, and `PatientsList` reads that query on load.

### Phase 7 — Error handling
Reusable `ErrorState` (title, message, retry button) and a top-level `ErrorBoundary` catching render crashes app-wide. Wired into `DiagnosisResult`, `TreatmentPlan`, and `PatientProfile`. Extended to the list-style pages — `PatientsList`, `Reports`, `Dashboard` — which previously swallowed fetch failures into a misleading "no results" empty state; they now show a real error message with retry.

---

## 3. Current file tree

```
src/
├── api/                     supabaseClient, authApi, patientApi, diagnosisApi,
│                             treatmentApi, reportApi, dashboardApi, settingsApi
├── services/                 AuthService, PatientService, DiagnosisService, TreatmentService,
│                             ReportService, DashboardService, SettingsService
├── contexts/                  AuthContext, ThemeContext, NotificationContext
├── hooks/                      useAuth, useTheme, useToast, useSidebar, useDebounce, useApi, usePolling
├── components/
│   ├── ui/                      Button, Input, Textarea, Select, Card, Badge, ProgressBar, Modal,
│   │                             ConfirmationDialog, Toast, Avatar, Dropdown, SearchInput, Skeleton,
│   │                             LoadingOverlay, Pagination, Table, Switch
│   ├── common/                   Sidebar, Navbar, Breadcrumb, PageHeader, FileUploader, Timeline,
│   │                             ErrorState, ErrorBoundary
│   ├── dashboard/                  StatCard, RecentDiagnosesTable, QuickActions, RecentReports, SystemStatus
│   ├── diagnosis/                   PatientInfoForm, ClinicalNotesForm, CBCTUploader, ProcessingStages,
│   │                             ConfidenceBadge, ConfidenceBar, ResultsTable, CBCTPreviewPanel,
│   │                             PatientSummaryCard, InputSummary, ClinicalNotesSummary
│   ├── patients/                    PatientTable, PatientForm, PatientTimeline
│   ├── reports/                      ReportTable, ReportPreviewModal
│   ├── treatment/                     TreatmentPhaseCard, TreatmentTimeline
│   └── settings/                       ProfileSection, PasswordSection, NotificationsSection,
│                                       ThemeSection, SystemInfoSection
├── layouts/                  AuthLayout, DashboardLayout
├── pages/
│   ├── Auth/                    Login, Register, ForgotPassword
│   ├── Dashboard/                 Dashboard
│   ├── Patients/                   PatientsList, PatientProfile
│   ├── Diagnosis/                   NewDiagnosis, Processing, DiagnosisResult
│   ├── Treatment/                    TreatmentPlan
│   ├── Reports/                       Reports
│   ├── Settings/                       Settings
│   ├── NotFound.jsx, Unauthorized.jsx
├── routes/                   AppRoutes, ProtectedRoute
├── constants/                 routes, status (confidence thresholds, diagnosis stages), upload
├── utils/                      storage, dateFormatter, fileHelpers, validators, permissions
├── App.jsx, main.jsx, index.css
```

Every file above exists and the project builds clean (`npm run build`) as of this summary.

---

## 4. How data flows now

Every `api/*.js` file calls Supabase directly with `supabase-js` (PostgREST + Storage + Auth). `services/` and everything above them (hooks, components, pages) are unchanged — they call the same service contracts as before. The FastAPI backend, `apiClient` (axios), and the entire mock layer (`mockHelpers`, `VITE_USE_MOCKS` / `VITE_API_BASE_URL`) have been removed.

- **Auth** — Supabase Auth; `authApi` maps the auth user (+ optional `profiles` row) to `{ id, name, email, role, clinicName }`.
- **Patients / Reports / Dashboard / Settings** — direct table queries with RLS scoping rows to `user_id`.
- **Diagnosis** — `diagnosisApi.submit` inserts a `diagnosis_sessions` row (snapshotting patient name/age/sex/weight), uploads the CBCT to the private `cbct-scans` bucket under `{user_id}/{session_id}/{filename}`, then `getStatus` derives the stage/progress deterministically from `created_at` elapsed time. On the first poll that reaches complete it lazily persists `stage='complete'` + mock `diseases`. A real inference service can later write `stage`/`diseases` directly and the UI will read them as-is.
- **Treatment** — `treatmentApi.generate` persists a stub plan once per session (idempotent).

Schema lives in `dentai-supabase-setup.sql` (helpers) and `dentai-supabase-data-migration.sql` (tables, RLS, storage bucket, triggers).

---

## 5. Known gaps / deliberately deferred

- **Real inference backend** — diagnosis results are stubbed (deterministic stage progression + persisted mock `diseases`). The seam is ready: a Supabase Edge Function or external service writes `stage`/`diseases` on the `diagnosis_sessions` row and the UI reads it as-is.
- **Run the data migration** — `dentai-supabase-data-migration.sql` must be applied to the project via the SQL Editor before any table is usable.
- **CBCT viewer** — `CBCTPreviewPanel` is a placeholder shaped for a real DICOM/NIfTI viewer library; not integrated yet, since that's a meaningful dependency choice best made once real scan data is available.
- **`src/types/`** — the architecture plan called for JSDoc typedefs documenting each API contract (patient, diagnosis, treatment, report, user); not yet created.
- **Automated tests** — no test suite yet (Vitest would be the natural fit given the Vite setup).
- **README / deployment docs** — not yet written.
- **Patient visit history, clinical notes, and reports-per-patient** on the Patient Profile page are still placeholder sections — they'll come alive once linked to real diagnosis/report data per patient.

---

## 6. Running it

```
cd dentai
npm install
npm run dev
```

Log in with a real Supabase account created in the project's Auth dashboard. `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```