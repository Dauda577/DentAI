// Supabase Auth Email Hook → Brevo
//
// Receives auth email events from Supabase (confirmation, recovery, invite,
// magic link, email change), renders DentAI-branded HTML, and sends via Brevo API.
//
// Enable in Supabase Dashboard → Authentication → Hooks → Send Email
//   URI: https://ozjuiwzgoysxpicmelit.supabase.co/functions/v1/auth-email-hook
//   Secret: any random string (must match HOOK_SECRET env)
//
// Env secrets:
//   BREVO_API_KEY       required
//   BREVO_FROM_EMAIL    optional (defaults to daudakassim577@gmail.com)
//   HOOK_SECRET         required — same value as the Dashboard hook secret

const TEAL = '#0f766e'
const TEAL_DARK = '#115e59'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { type, email, token, token_hash, redirect_to } = body

    // Validate: must have type + email from Supabase hook
    if (!type || !email) {
      return jsonResponse({ error: 'Invalid payload' }, 400, corsHeaders)
    }
    if (!['signup', 'recovery', 'invite', 'magiclink', 'email_change'].includes(type)) {
      return jsonResponse({ error: 'Unknown email type' }, 400, corsHeaders)
    }

    const apiKey = Deno.env.get('BREVO_API_KEY')
    if (!apiKey) throw new Error('BREVO_API_KEY not set')

    const fromEmail = Deno.env.get('BREVO_FROM_EMAIL') || 'daudakassim577@gmail.com'

    const { subject, html } = renderTemplate(type, email, token, token_hash, redirect_to)

    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender: { name: 'DentAI', email: fromEmail },
        to: [{ email }],
        subject,
        htmlContent: html,
      }),
    })

    if (!resp.ok) {
      const errBody = await resp.text()
      throw new Error(`Brevo error ${resp.status}: ${errBody}`)
    }

    const data = await resp.json()
    return jsonResponse({ success: true, messageId: data.messageId }, 200, corsHeaders)
  } catch (err) {
    console.error('auth-email-hook failed:', err)
    return jsonResponse({ error: err.message }, 500, corsHeaders)
  }
})

function jsonResponse(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}

function renderTemplate(
  type: string, email: string, token: string, tokenHash: string, redirectTo: string
): { subject: string; html: string } {
  const siteUrl = Deno.env.get('APP_URL') || 'https://dentai.vercel.app'

  const templates: Record<string, { subject: string; title: string; message: string; button: string }> = {
    signup: {
      subject: 'Confirm your DentAI account',
      title: 'Welcome to DentAI',
      message: 'Click the button below to confirm your email address and activate your account.',
      button: 'Confirm email',
    },
    recovery: {
      subject: 'Reset your DentAI password',
      title: 'Reset your password',
      message: 'Click the button below to choose a new password for your DentAI account.',
      button: 'Reset password',
    },
    invite: {
      subject: "You've been invited to DentAI",
      title: "You've been invited",
      message: "You've been invited to join DentAI — an AI-powered dental diagnosis platform. Click below to accept and create your account.",
      button: 'Accept invitation',
    },
    magiclink: {
      subject: 'Your DentAI sign-in link',
      title: 'Sign in to DentAI',
      message: 'Click the button below to securely sign in to your DentAI account. This link expires shortly.',
      button: 'Sign in',
    },
    email_change: {
      subject: 'Confirm your new DentAI email',
      title: 'Confirm your new email',
      message: 'Click the button below to confirm your new email address for DentAI.',
      button: 'Confirm new email',
    },
  }

  const t = templates[type] || {
    subject: 'DentAI',
    title: 'DentAI',
    message: 'Click the link below to continue.',
    button: 'Continue',
  }

  const link = `${siteUrl}/auth/callback?token_hash=${tokenHash}&type=${type}${redirectTo ? `&redirect_to=${encodeURIComponent(redirectTo)}` : ''}`

  return {
    subject: t.subject,
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f8fafc">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px">
    <div style="background:linear-gradient(135deg,${TEAL},${TEAL_DARK});padding:28px 32px;border-radius:12px 12px 0 0">
      <h1 style="margin:0;color:#fff;font-size:22px;font-family:system-ui,-apple-system,sans-serif;font-weight:700">
        DentAI
      </h1>
    </div>
    <div style="background:#fff;padding:32px;border-radius:0 0 12px 12px;font-family:system-ui,-apple-system,sans-serif;color:#0f172a">
      <h2 style="margin:0 0 8px;font-size:18px">${t.title}</h2>
      <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6">${t.message}</p>
      <a href="${link}" style="display:inline-block;background-color:${TEAL};color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">${t.button}</a>
      <p style="margin:28px 0 0;padding-top:16px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px">
        If you didn't request this, please ignore this email.
      </p>
    </div>
  </div>
</body>
</html>`,
  }
}
