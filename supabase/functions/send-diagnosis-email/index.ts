// Sends an email alert when a diagnosis session completes.
//
// Triggered by the frontend (Processing page) after it detects
// stage = 'complete'. Runs with verify_jwt = true, so only
// authenticated clients can call it. Reads the session, the owner's
// email, and their notification_prefs before sending via Resend.
//
// Env secrets (set in Supabase dashboard > Edge Functions > Secrets):
//   RESEND_API_KEY      required
//   RESEND_FROM_EMAIL   optional, defaults to DentAI <onboarding@resend.dev>
//   APP_URL             optional base URL for linked buttons (defaults to work in-app)
import { createClient } from 'npm:@supabase/supabase-js@2'
import { Resend } from 'npm:resend@4.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sessionId } = await req.json()
    if (!sessionId) {
      return jsonResponse({ error: 'Missing sessionId' }, 400, corsHeaders)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: session, error: sessionError } = await supabase
      .from('diagnosis_sessions')
      .select(
        'id, user_id, patient_name, patient_age, patient_sex, patient_weight, clinical_notes, diseases, created_at'
      )
      .eq('id', sessionId)
      .maybeSingle()
    if (sessionError) throw sessionError
    if (!session) return jsonResponse({ skipped: true, reason: 'session not found' }, 200, corsHeaders)

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', session.user_id)
      .maybeSingle()

    if (!profile?.email) {
      return jsonResponse({ skipped: true, reason: 'no email' }, 200, corsHeaders)
    }

    const { data: prefs } = await supabase
      .from('notification_prefs')
      .select('email_alerts')
      .eq('user_id', session.user_id)
      .maybeSingle()
    if (prefs && prefs.email_alerts === false) {
      return jsonResponse({ skipped: true, reason: 'email alerts disabled' }, 200, corsHeaders)
    }

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
    const from = Deno.env.get('RESEND_FROM_EMAIL') || 'DentAI <onboarding@resend.dev>'

    const { data, error } = await resend.emails.send({
      from,
      to: profile.email,
      subject: `Diagnosis complete — ${session.patient_name}`,
      html: renderDiagnosisEmail(session),
    })
    if (error) throw error

    return jsonResponse({ success: true, emailId: data?.id }, 200, corsHeaders)
  } catch (err) {
    console.error('send-diagnosis-email failed:', err)
    return jsonResponse({ error: err.message }, 500, corsHeaders)
  }
})

function jsonResponse(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}

function renderDiagnosisEmail(session: any): string {
  const findings = Array.isArray(session.diseases)
    ? session.diseases
        .map((d: any) => `<li><strong>${d.name}</strong> — ${d.status} (${Math.round(d.confidence * 100)}%)</li>`)
        .join('')
    : '<li>No findings recorded.</li>'

  const appUrl = Deno.env.get('APP_URL')
  const resultsLink = appUrl
    ? `<p style="margin:24px 0"><a href="${appUrl}/diagnosis/${session.id}" style="background-color:#0f766e;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">View full results</a></p>`
    : ''

  return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
      <h2 style="margin:0 0 8px">Diagnosis complete</h2>
      <p style="color:#64748b;margin:0 0 24px">${session.patient_name}, age ${session.patient_age} (${
        session.patient_sex
      })</p>
      <h3 style="margin:0 0 8px">Detected conditions</h3>
      <ul style="margin:0;padding-left:20px;color:#334155">${findings}</ul>
      ${resultsLink}
      <p style="color:#94a3b8;font-size:12px;margin:32px 0 0">Sent by DentAI</p>
    </div>
  `
}