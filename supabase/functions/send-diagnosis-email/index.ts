// Sends an email alert when a diagnosis session completes via Brevo.
//
// Env secrets (set in Supabase dashboard > Edge Functions > Secrets):
//   BREVO_API_KEY       required — from https://app.brevo.com/settings/keys/api
//   BREVO_FROM_EMAIL    optional — defaults to the configured Brevo sender
//   APP_URL             optional — base URL for "View results" button

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TEAL = '#0f766e'
const TEAL_DARK = '#115e59'

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

    const apiKey = Deno.env.get('BREVO_API_KEY')
    if (!apiKey) throw new Error('BREVO_API_KEY not set')

    const fromEmail = Deno.env.get('BREVO_FROM_EMAIL') || 'DentAI <daudakasim577@gmail.com>'

    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'DentAI', email: fromEmail },
        to: [{ email: profile.email, name: profile.name || undefined }],
        subject: `Diagnosis complete — ${session.patient_name}`,
        htmlContent: renderDiagnosisEmail(session),
      }),
    })

    if (!resp.ok) {
      const body = await resp.text()
      throw new Error(`Brevo API error ${resp.status}: ${body}`)
    }

    const data = await resp.json()
    return jsonResponse({ success: true, messageId: data.messageId }, 200, corsHeaders)
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
  const diseaseCards = Array.isArray(session.diseases)
    ? session.diseases.map((d: any) => {
        const pct = Math.round(d.confidence * 100)
        const color = pct >= 75 ? '#166534' : pct >= 45 ? '#854d0e' : '#64748b'
        const bg   = pct >= 75 ? '#dcfce7' : pct >= 45 ? '#fef9c3' : '#f1f5f9'
        return `
          <tr>
            <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0">
              <span style="font-weight:600;color:#0f172a">${d.name}</span>
              <span style="color:${color};font-size:13px;margin-left:12px">${d.status} · ${pct}%</span>
            </td>
          </tr>`
      }).join('')
    : '<tr><td style="padding:12px 16px;color:#94a3b8">No findings recorded.</td></tr>'

  const appUrl = Deno.env.get('APP_URL')
  const resultsLink = appUrl
    ? `<a href="${appUrl}/diagnosis/${session.id}" style="display:inline-block;background-color:${TEAL};color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin-top:24px">View full results →</a>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f8fafc">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px">
    <!-- header -->
    <div style="background:linear-gradient(135deg,${TEAL},${TEAL_DARK});padding:28px 32px;border-radius:12px 12px 0 0">
      <h1 style="margin:0;color:#fff;font-size:22px;font-family:system-ui,-apple-system,sans-serif;font-weight:700">
        🦷 DentAI
      </h1>
      <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:14px;font-family:system-ui,-apple-system,sans-serif">
        Diagnosis report
      </p>
    </div>
    <!-- body -->
    <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;font-family:system-ui,-apple-system,sans-serif;color:#0f172a">
      <h2 style="margin:0 0 4px;font-size:18px">Diagnosis complete</h2>
      <p style="margin:0 0 24px;color:#64748b;font-size:14px">
        ${session.patient_name}, age ${session.patient_age} (${session.patient_sex || 'N/A'})
      </p>

      <h3 style="margin:0 0 12px;font-size:15px;color:#334155">Detected conditions</h3>
      <table style="width:100%;border-collapse:collapse">
        ${diseaseCards}
      </table>

      ${resultsLink}

      <p style="margin:32px 0 0;padding-top:16px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px">
        Sent by DentAI · <a href="${appUrl || '#'}" style="color:${TEAL}">dentai.vercel.app</a>
      </p>
    </div>
  </div>
</body>
</html>`
}
