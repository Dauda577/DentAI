// Sends a weekly digest of clinical activity to every user who has
// weekly_summary enabled in notification_prefs.
//
// Triggered by a Supabase cron job (pg_cron + pg_net) that HTTP POSTs to
// this function with an Authorization: Bearer <service_role_key> header.
// verify_jwt = false so the cron call succeeds; the service_role key is
// only required when the function is hit directly.
//
// Env secrets (set in Supabase dashboard > Edge Functions > Secrets):
//   RESEND_API_KEY      required
//   RESEND_FROM_EMAIL   optional, defaults to DentAI <onboarding@resend.dev>
//   APP_URL             optional base URL for linked buttons
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

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
    const from = Deno.env.get('RESEND_FROM_EMAIL') || 'DentAI <onboarding@resend.dev>'
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const sent: string[] = []
    const skipped: string[] = []

    for (const subscriber of subscribers) {
      const email = await digestForUser(supabase, resend, from, since, subscriber.user_id)
      if (email) sent.push(email)
      else skipped.push(subscriber.user_id)
    }

    return jsonResponse({ success: true, sent, skipped }, 200, corsHeaders)
  } catch (err) {
    console.error('send-weekly-digest failed:', err)
    return jsonResponse({ error: err.message }, 500, corsHeaders)
  }
})

async function digestForUser(supabase: any, resend: any, from: string, since: string, userId: string): Promise<string | null> {
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

  const breakdown =
    perDisease.size > 0
      ? [...perDisease.entries()]
          .map(([name, count]) => `<li><strong>${name}</strong>: ${count} case${count === 1 ? '' : 's'}</li>`)
          .join('')
      : '<li>No positive findings.</li>'

  const appUrl = Deno.env.get('APP_URL')
  const reportsLink = appUrl
    ? `<p style="margin:24px 0"><a href="${appUrl}/reports" style="background-color:#0f766e;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">View reports</a></p>`
    : ''

  const { data, error } = await resend.emails.send({
    from,
    to: profile.email,
    subject: `Your weekly DentAI summary — ${total} diagnosis${total === 1 ? '' : 'es'}`,
    html: `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
        <h2 style="margin:0 0 8px">Your weekly summary</h2>
        <p style="color:#64748b;margin:0 0 24px">Hi ${profile.name || 'there'}, here's your activity over the past 7 days.</p>
        <p style="margin:0 0 8px"><strong>${total}</strong> diagnosis${total === 1 ? '' : 'es'} completed</p>
        <h3 style="margin:16px 0 8px">Conditions detected</h3>
        <ul style="margin:0;padding-left:20px;color:#334155">${breakdown}</ul>
        ${reportsLink}
        <p style="color:#94a3b8;font-size:12px;margin:32px 0 0">Sent by DentAI</p>
      </div>
    `,
  })
  if (error) throw error
  return data?.id ?? null
}

function jsonResponse(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}