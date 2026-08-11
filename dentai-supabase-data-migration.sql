-- DentAI: data tables + RLS for patients, diagnosis_sessions, treatment_plans, reports, notification_prefs
-- Run this AFTER dentai-supabase-setup.sql in the Supabase Dashboard: SQL Editor > New query > paste > Run
-- Depends on public.set_updated_at() defined in dentai-supabase-setup.sql

-- 1. patients ------------------------------------------------------------
-- Source shape: { id, name, age, sex, phone, lastVisit, diagnosesCount }
-- diagnosesCount is derived (count of diagnosis_sessions.patient_id), not stored.
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  age integer not null check (age between 0 and 130),
  sex text not null check (sex in ('male', 'female', 'other')),
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.patients enable row level security;

drop policy if exists "Users can view own patients" on public.patients;
create policy "Users can view own patients"
  on public.patients for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own patients" on public.patients;
create policy "Users can insert own patients"
  on public.patients for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own patients" on public.patients;
create policy "Users can update own patients"
  on public.patients for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own patients" on public.patients;
create policy "Users can delete own patients"
  on public.patients for delete
  using (auth.uid() = user_id);

-- 2. diagnosis_sessions ---------------------------------------------------
-- One row per submitted diagnosis. Stage/progress drive the Processing
-- page poll; diseases is the final result (diagnosisApi.getResult).
-- patient_* columns are a snapshot so a session survives patient edits.
create table if not exists public.diagnosis_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  patient_id uuid references public.patients (id) on delete set null,
  patient_name text not null,
  patient_age integer not null,
  patient_sex text not null check (patient_sex in ('male', 'female', 'other')),
  patient_weight numeric(6, 2),
  clinical_notes jsonb not null default '{}',
  cbct_file_name text,
  cbct_file_path text,
  stage text not null default 'uploading',
  progress integer not null default 0,
  diseases jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.diagnosis_sessions enable row level security;

drop policy if exists "Users can view own sessions" on public.diagnosis_sessions;
create policy "Users can view own sessions"
  on public.diagnosis_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own sessions" on public.diagnosis_sessions;
create policy "Users can insert own sessions"
  on public.diagnosis_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own sessions" on public.diagnosis_sessions;
create policy "Users can update own sessions"
  on public.diagnosis_sessions for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own sessions" on public.diagnosis_sessions;
create policy "Users can delete own sessions"
  on public.diagnosis_sessions for delete
  using (auth.uid() = user_id);

-- 3. treatment_plans --------------------------------------------------------
-- One row per diagnosis session; phases holds the full plan array
-- (treatmentApi.generate -> { sessionId, phases: [...] }).
create table if not exists public.treatment_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null references public.diagnosis_sessions (id) on delete cascade,
  phases jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.treatment_plans enable row level security;

drop policy if exists "Users can view own treatment plans" on public.treatment_plans;
create policy "Users can view own treatment plans"
  on public.treatment_plans for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own treatment plans" on public.treatment_plans;
create policy "Users can insert own treatment plans"
  on public.treatment_plans for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own treatment plans" on public.treatment_plans;
create policy "Users can update own treatment plans"
  on public.treatment_plans for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own treatment plans" on public.treatment_plans;
create policy "Users can delete own treatment plans"
  on public.treatment_plans for delete
  using (auth.uid() = user_id);

-- 4. reports -------------------------------------------------------------
-- Source shape: { id, patientName, type, date, status, summary }
-- date maps to created_at in the app.
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid references public.diagnosis_sessions (id) on delete set null,
  patient_id uuid references public.patients (id) on delete set null,
  patient_name text not null,
  type text not null default 'Diagnostic Report',
  status text not null default 'generated' check (status in ('generated', 'draft', 'archived')),
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.reports enable row level security;

drop policy if exists "Users can view own reports" on public.reports;
create policy "Users can view own reports"
  on public.reports for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own reports" on public.reports;
create policy "Users can insert own reports"
  on public.reports for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own reports" on public.reports;
create policy "Users can update own reports"
  on public.reports for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own reports" on public.reports;
create policy "Users can delete own reports"
  on public.reports for delete
  using (auth.uid() = user_id);

-- 5. notification_prefs ------------------------------------------------------
-- settingsApi shape: { emailAlerts, smsAlerts, weeklySummary }
create table if not exists public.notification_prefs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email_alerts boolean not null default true,
  sms_alerts boolean not null default false,
  weekly_summary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_prefs enable row level security;

drop policy if exists "Users can view own notification prefs" on public.notification_prefs;
create policy "Users can view own notification prefs"
  on public.notification_prefs for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own notification prefs" on public.notification_prefs;
create policy "Users can insert own notification prefs"
  on public.notification_prefs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own notification prefs" on public.notification_prefs;
create policy "Users can update own notification prefs"
  on public.notification_prefs for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own notification prefs" on public.notification_prefs;
create policy "Users can delete own notification prefs"
  on public.notification_prefs for delete
  using (auth.uid() = user_id);

-- 6. cbct-scans Storage bucket ---------------------------------------------
-- Private bucket for CBCT uploads. File path convention: {user_id}/{session_id}/{filename}
-- so every policy below can scope access to the owner's own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cbct-scans',
  'cbct-scans',
  false,
  52428800,
  array['application/dicom', 'application/octet-stream', 'image/png', 'image/jpeg']
)
on conflict (id) do nothing;

drop policy if exists "Users can view own cbct scans" on storage.objects;
create policy "Users can view own cbct scans"
  on storage.objects for select
  using (bucket_id = 'cbct-scans' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can upload own cbct scans" on storage.objects;
create policy "Users can upload own cbct scans"
  on storage.objects for insert
  with check (bucket_id = 'cbct-scans' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can update own cbct scans" on storage.objects;
create policy "Users can update own cbct scans"
  on storage.objects for update
  using (bucket_id = 'cbct-scans' and auth.uid()::text = (storage.foldername(name))[1]);

drop policy if exists "Users can delete own cbct scans" on storage.objects;
create policy "Users can delete own cbct scans"
  on storage.objects for delete
  using (bucket_id = 'cbct-scans' and auth.uid()::text = (storage.foldername(name))[1]);

-- 7. updated_at triggers (uses set_updated_at from dentai-supabase-setup.sql) --
drop trigger if exists on_patients_updated on public.patients;
create trigger on_patients_updated
  before update on public.patients
  for each row execute function public.set_updated_at();

drop trigger if exists on_diagnosis_sessions_updated on public.diagnosis_sessions;
create trigger on_diagnosis_sessions_updated
  before update on public.diagnosis_sessions
  for each row execute function public.set_updated_at();

drop trigger if exists on_treatment_plans_updated on public.treatment_plans;
create trigger on_treatment_plans_updated
  before update on public.treatment_plans
  for each row execute function public.set_updated_at();

drop trigger if exists on_reports_updated on public.reports;
create trigger on_reports_updated
  before update on public.reports
  for each row execute function public.set_updated_at();

drop trigger if exists on_notification_prefs_updated on public.notification_prefs;
create trigger on_notification_prefs_updated
  before update on public.notification_prefs
  for each row execute function public.set_updated_at();
