// ── send-otp Edge Function ─────────────────────────────────────────────────
// Generates a 6-digit OTP for the authenticated user, stores it in
// public.email_otps, and sends a branded email via Resend.
//
// Required Supabase secrets (set via: supabase secrets set KEY=value):
//   RESEND_API_KEY   — your Resend API key (re_xxxxxxxx)
//   RESEND_FROM      — verified sender e.g. "Oakmont Ridge Capital <noreply@oakmontridgecapital.com>"
//   SITE_URL         — public URL e.g. https://oakmontridgecapital.com
//
// Request body:  { purpose?: 'withdrawal' | 'general' }
// Auth:          Bearer <user JWT>  (Supabase client sends this automatically)
// ──────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function otpEmailHtml(otp: string, fullName: string, purpose: string, siteUrl: string): string {
  const label = purpose === 'withdrawal' ? 'Withdrawal Verification' : 'Verification'
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${label} Code — Oakmont Ridge Capital</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(30,64,175,0.10);">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#1e40af 0%,#1e3a8a 100%);padding:36px 40px;text-align:center;">
          <div style="display:inline-flex;align-items:center;gap:10px;">
            <div style="width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:10px;display:inline-block;line-height:40px;text-align:center;">
              <span style="font-size:20px;">📈</span>
            </div>
            <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">Oakmont Ridge Capital</span>
          </div>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:40px 40px 32px;">
          <p style="margin:0 0 8px;font-size:14px;color:#64748b;">Hello, ${fullName}</p>
          <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#0f172a;">${label} Code</h1>

          <p style="margin:0 0 32px;font-size:15px;color:#475569;line-height:1.6;">
            ${purpose === 'withdrawal'
              ? `You requested to withdraw funds from your Oakmont Ridge Capital wallet. Use the code below to confirm this action.`
              : `Use the code below to verify your identity.`
            }
          </p>

          <!-- OTP box -->
          <div style="background:#f8fafc;border:2px dashed #cbd5e1;border-radius:12px;padding:28px;text-align:center;margin-bottom:32px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:1.5px;">Your verification code</p>
            <div style="font-size:48px;font-weight:800;letter-spacing:12px;color:#1e40af;font-family:'Courier New',monospace;">${otp}</div>
            <p style="margin:12px 0 0;font-size:12px;color:#94a3b8;">⏱ Expires in <strong>15 minutes</strong></p>
          </div>

          <!-- Security note -->
          <div style="background:#fef9c3;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;margin-bottom:32px;">
            <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
              <strong>🔒 Security notice:</strong> Oakmont Ridge Capital will never ask for this code via phone or chat.
              If you did not request ${purpose === 'withdrawal' ? 'a withdrawal' : 'this code'}, please
              <a href="${siteUrl}/contact" style="color:#1e40af;">contact support</a> immediately.
            </p>
          </div>

          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
            If you didn't request this, you can safely ignore this email. Your account is secure.
          </p>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">
            © ${new Date().getFullYear()} Oakmont Ridge Capital. All rights reserved.
          </p>
          <p style="margin:0;font-size:12px;color:#cbd5e1;">
            447 Broadway, 2nd Floor, New York, NY 10013 · <a href="${siteUrl}" style="color:#3b82f6;text-decoration:none;">${siteUrl.replace('https://', '')}</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const RESEND_FROM    = Deno.env.get('RESEND_FROM') ?? 'Oakmont Ridge Capital <noreply@oakmontridgecapital.com>'
    const SITE_URL       = Deno.env.get('SITE_URL')    ?? 'https://oakmontridgecapital.com'

    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY secret is not set')

    // ── Authenticate the caller ──────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser()
    if (authErr || !user) throw new Error('Unauthorized')

    // ── Service-role client for DB writes ────────────────────────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── Resolve profile ──────────────────────────────────────────
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name')
      .eq('id', user.id)
      .single()
    if (!profile) throw new Error('User profile not found')

    const { purpose = 'withdrawal' } = await req.json().catch(() => ({}))

    // ── Rate limit: max 3 OTPs per user per purpose per hour ─────
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabaseAdmin
      .from('email_otps')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('purpose', purpose)
      .gte('created_at', hourAgo)

    if ((count ?? 0) >= 3) {
      throw new Error('Too many requests. Please wait before requesting another code.')
    }

    // ── Invalidate previous unused OTPs for same user+purpose ────
    await supabaseAdmin
      .from('email_otps')
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', profile.id)
      .eq('purpose', purpose)
      .is('used_at', null)

    // ── Generate & store new OTP ─────────────────────────────────
    const otp = generateOtp()
    const { error: insertErr } = await supabaseAdmin.from('email_otps').insert({
      user_id:    profile.id,
      email:      profile.email,
      otp,
      purpose,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    })
    if (insertErr) throw insertErr

    // ── Send via Resend ──────────────────────────────────────────
    const subject = purpose === 'withdrawal'
      ? '🔐 Your withdrawal verification code — Oakmont Ridge Capital'
      : '🔐 Your verification code — Oakmont Ridge Capital'

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    RESEND_FROM,
        to:      profile.email,
        subject,
        html:    otpEmailHtml(otp, profile.full_name ?? 'Investor', purpose, SITE_URL),
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`Resend delivery failed: ${errBody}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: `Verification code sent to ${profile.email}` }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
