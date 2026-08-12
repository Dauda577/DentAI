-- DentAI: add treatment_summary to diagnosis_sessions
-- Required by the real inference pipeline (stored with the diagnosis result
-- and shown on the Diagnosis Result page). Idempotent — safe to re-run.
-- Run in the Supabase Dashboard: SQL Editor > New query > paste > Run

alter table public.diagnosis_sessions
  add column if not exists treatment_summary text;
