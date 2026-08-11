import { supabase } from '@/lib/supabaseClient'

// --- Mock treatment-plan stub ----------------------------------------------
// A real plan generator is a future Edge Function. Until then, a fixed plan
// is persisted once per session (idempotent — re-calling returns the stored
// phases), mirroring the old client-side mock.
const MOCK_PHASES = [
  {
    id: 'phase_1',
    title: 'Initial Restorative Care',
    duration: '1–2 weeks',
    status: 'Recommended',
    objectives: 'Address active decay before it progresses to the pulp.',
    description:
      'Composite restorations on the identified carious lesions, starting with the highest-confidence findings.',
    recommendations: ['Composite fillings on affected teeth', 'Fluoride varnish application'],
    expectedOutcomes: 'Halted decay progression and restored tooth structure.',
  },
  {
    id: 'phase_2',
    title: 'Endodontic Evaluation',
    duration: '2–3 weeks',
    status: 'Conditional',
    objectives: 'Confirm and treat the periapical lesion if symptomatic.',
    description:
      'Root canal therapy is indicated if the periapical lesion is confirmed symptomatic on clinical exam.',
    recommendations: ['Vitality testing', 'Root canal therapy if confirmed'],
    expectedOutcomes: 'Resolution of periapical infection and pain relief.',
  },
  {
    id: 'phase_3',
    title: 'Periodontal Monitoring',
    duration: 'Ongoing',
    status: 'Monitor',
    objectives: 'Track the possible periodontal bone loss over time.',
    description:
      'Scaling and root planing, with a follow-up CBCT in 6 months to assess progression.',
    recommendations: ['Scaling and root planing', 'Re-imaging in 6 months'],
    expectedOutcomes: 'Stabilized periodontal support and early detection of further loss.',
  },
]

export const treatmentApi = {
  async generate(sessionId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: existing, error: readError } = await supabase
      .from('treatment_plans')
      .select('phases')
      .eq('session_id', sessionId)
      .limit(1)
    if (readError) throw readError
    if (existing && existing.length > 0) {
      return { sessionId, phases: existing[0].phases ?? [] }
    }

    const { data, error } = await supabase
      .from('treatment_plans')
      .insert({ user_id: user?.id, session_id: sessionId, phases: MOCK_PHASES })
      .select('phases')
      .single()
    if (error) throw error

    return { sessionId, phases: data.phases ?? [] }
  },
}
