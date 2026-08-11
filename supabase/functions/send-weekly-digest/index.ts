// Sends a weekly digest of clinical activity via Brevo.
//
// Triggered by pg_cron → net.http_post with service_role Bearer token.
// verify_jwt = false so the cron call succeeds.
//
// Env secrets (set in Supabase dashboard > Edge Functions > Secrets):
//   BREVO_API_KEY       required
//   BREVO_FROM_EMAIL    optional — defaults to the configured Brevo sender
//   APP_URL             optional — base URL for "View reports" button

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: subscribers, error: prefsError } = await supabase
      .from('notification_prefs')
      .select('user_id, email_alerts')
      .eq('weekly_summary', true)
    if (prefsError) throw prefsError

    if (!subscribers?.length) {
      return jsonResponse({ skipped: true, reason: 'no subscribers' }, 200, corsHeaders)
    }

    const apiKey = Deno.env.get('BREVO_API_KEY')
    if (!apiKey) throw new Error('BREVO_API_KEY not set')

    const fromEmail = Deno.env.get('BREVO_FROM_EMAIL') || 'DentAI <daudakasim577@gmail.com>'
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const sent: string[] = []
    const skipped: string[] = []

    for (const subscriber of subscribers) {
      const msgId = await digestForUser(supabase, apiKey, fromEmail, since, subscriber.user_id)
      if (msgId) sent.push(msgId)
      else skipped.push(subscriber.user_id)
    }

    return jsonResponse({ success: true, sent, skipped }, 200, corsHeaders)
  } catch (err) {
    console.error('send-weekly-digest failed:', err)
    return jsonResponse({ error: err.message }, 500, corsHeaders)
  }
})

async function digestForUser(
  supabase: any, apiKey: string, from: string, since: string, userId: string
): Promise<string | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, name')
    .eq('id', userId)
    .maybeSingle()
  if (!profile?.email) return null

  const { data: sessions } = await supabase
    .from('diagnosis_sessions')
    .select('patient_name, diseases, created_at')
    .eq('user_id', userId)
    .eq('stage', 'complete')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(100)

  if (!sessions?.length) return null

  const total = sessions.length
  const perDisease = new Map<string, number>()
  for (const s of sessions) {
    for (const d of Array.isArray(s.diseases) ? s.diseases : []) {
      if (d?.status && d?.name && d.status !== 'Unlikely') {
        perDisease.set(d.name, (perDisease.get(d.name) ?? 0) + 1)
      }
    }
  }

  const breakdownRows =
    perDisease.size > 0
      ? [...perDisease.entries()]
          .map(([name, count]) =>
            `<tr>
              <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0">${name}</td>
              <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;color:${TEAL_DARK}">${count}</td>
            </tr>`)
          .join('')
      : '<tr><td colspan="2" style="padding:12px 16px;color:#94a3b8">No positive findings this week.</td></tr>'

  const appUrl = Deno.env.get('APP_URL')
  const reportsLink = appUrl
    ? `<a href="${appUrl}/reports" style="display:inline-block;background-color:${TEAL};color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;margin-top:24px">View reports →</a>`
    : ''

  const recentPatients = sessions.slice(0, 5).map(s =>
    `<tr><td style="padding:6px 16px;border-bottom:1px solid #f1f5f9;font-size:13px">${s.patient_name}</td></tr>`
  ).join('')

  const html = `<!DOCTYPE html>
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
        Weekly summary
      </p>
    </div>
    <!-- body -->
    <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;font-family:system-ui,-apple-system,sans-serif;color:#0f172a">
      <h2 style="margin:0 0 4px;font-size:18px">Your weekly summary</h2>
      <p style="margin:0 0 24px;color:#64748b;font-size:14px">
        Hi ${profile.name || 'there'}, here's your activity for the past 7 days.
      </p>

      <div style="background:#f0fdf4;border-radius:8px;padding:16px 24px;margin-bottom:24px">
        <span style="font-size:28px;font-weight:700;color:${TEAL_DARK}">${total}</span>
        <span style="color:#64748b;font-size:14px"> diagnosis${total === 1 ? '' : 'es'} completed</span>
      </div>

      <h3 style="margin:0 0 12px;font-size:15px;color:#334155">Conditions detected</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
        ${breakdownRows}
      </table>

      ${recentPatients ? `<h3 style="margin:0 0 8px;font-size:15px;color:#334155">Recent patients</h3><table style="width:100%;border-collapse:collapse;margin-bottom:24px">${recentPatients}</table>` : ''}

      ${reportsLink}

      <p style="margin:32px 0 0;padding-top:16px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px">
        Sent by DentAI · <a href="${appUrl || '#'}" style="color:${TEAL}">dentai.vercel.app</a><br>
        <span style="font-size:11px">Update your <a href="${appUrl || '#'}/settings" style="color:${TEAL}">notification preferences</a> anytime.</span>
      </p>
    </div>
  </div>
</body>
</html>`

  const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { name: 'DentAI', email: from },
      to: [{ email: profile.email, name: profile.name || undefined }],
      subject: `Your weekly DentAI summary — ${total} diagnosis${total === 1 ? '' : 'es'}`,
      htmlContent: html,
    }),
  })

  if (!resp.ok) {
    const body = await resp.text()
    console.error(`Brevo error for user ${userId}: ${resp.status} ${body}`)
    return null
  }

  const data = await resp.json()
  return data.messageId ?? null
}

function jsonResponse(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}
