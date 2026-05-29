// ── send-verification Edge Function ───────────────────────────────────────
// Generates a 24-hour email verification token, stores it in
// public.email_verifications, and sends a branded HTML email via Resend
// with a click-to-verify link.
//
// Called immediately after registration (authenticated request).
// Required secrets: RESEND_API_KEY, RESEND_FROM, SITE_URL
// Auth: Bearer <user JWT>
// ──────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function verifyEmailHtml(fullName: string, verifyUrl: string, siteUrl: string): string {
  const firstName = fullName.split(' ')[0] ?? fullName
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Verify your email — Oakmont Ridge Capital</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
  <tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(30,64,175,0.10);">

    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg,#1e40af 0%,#1e3a8a 100%);padding:48px 40px;text-align:center;">
        <div style="display:inline-block;width:60px;height:60px;background:rgba(255,255,255,0.2);border-radius:16px;line-height:60px;text-align:center;font-size:30px;margin-bottom:16px;">📈</div>
        <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Oakmont Ridge Capital</h1>
        <p style="margin:8px 0 0;color:#93c5fd;font-size:13px;">Professional Investment Platform</p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:48px 40px 36px;">
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Welcome, ${firstName}! 🎉</h2>
        <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7;">
          Your account has been created. Please verify your email address to complete
          your registration and unlock full access to the platform.
        </p>

        <!-- CTA Button -->
        <div style="text-align:center;margin-bottom:36px;">
          <a href="${verifyUrl}"
             style="display:inline-block;background:linear-gradient(135deg,#1e40af,#2563eb);color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;padding:16px 44px;border-radius:14px;box-shadow:0 4px 16px rgba(30,64,175,0.4);">
            ✓ Verify Email Address
          </a>
        </div>

        <!-- Expiry note -->
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;margin-bottom:28px;text-align:center;">
          <p style="margin:0;font-size:13px;color:#64748b;">⏱ This link expires in <strong>24 hours</strong></p>
        </div>

        <!-- Or paste link -->
        <p style="margin:0 0 8px;font-size:12px;color:#94a3b8;">If the button doesn't work, copy and paste this URL into your browser:</p>
        <p style="margin:0 0 28px;font-size:11px;color:#3b82f6;word-break:break-all;background:#f8fafc;padding:10px 14px;border-radius:8px;border:1px solid #e2e8f0;">
          ${verifyUrl}
        </p>

        <!-- Next steps -->
        <div style="border-top:1px solid #f1f5f9;padding-top:24px;">
          <p style="margin:0 0 16px;font-size:13px;font-weight:600;color:#0f172a;">After verifying, you'll be able to:</p>
          <div style="space-y:8px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
              <span style="color:#22c55e;font-size:16px;">✓</span>
              <span style="font-size:13px;color:#475569;">Complete KYC identity verification</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
              <span style="color:#22c55e;font-size:16px;">✓</span>
              <span style="font-size:13px;color:#475569;">Deposit USDT, BTC, or ETH</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="color:#22c55e;font-size:16px;">✓</span>
              <span style="font-size:13px;color:#475569;">Start copy trading with top traders</span>
            </div>
          </div>
        </div>
      </td>
    </tr>

    <!-- Security -->
    <tr>
      <td style="background:#fef9c3;border-top:1px solid #fde68a;padding:16px 40px;">
        <p style="margin:0;font-size:12px;color:#92400e;text-align:center;">
          🔒 If you didn't create an account at Oakmont Ridge Capital, you can safely ignore this email.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
        <p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} Oakmont Ridge Capital. All rights reserved.</p>
        <p style="margin:0;font-size:12px;color:#cbd5e1;">
          447 Broadway, 2nd Floor, New York, NY 10013 ·
          <a href="${siteUrl}" style="color:#3b82f6;text-decoration:none;">${siteUrl.replace('https://', '')}</a>
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

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── Fetch profile ────────────────────────────────────────────
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, email_verified')
      .eq('id', user.id)
      .single()

    if (!profile) throw new Error('User profile not found')

    // Already verified — silently succeed
    if (profile.email_verified) {
      return new Response(
        JSON.stringify({ success: true, already_verified: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Rate limit: max 3 verification emails per user per hour ──
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await supabaseAdmin
      .from('email_verifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .gte('created_at', hourAgo)

    if ((count ?? 0) >= 3) {
      throw new Error('Too many requests. Please wait before requesting another verification email.')
    }

    // ── Invalidate previous unused tokens ────────────────────────
    await supabaseAdmin
      .from('email_verifications')
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', profile.id)
      .is('used_at', null)

    // ── Generate & store new token ───────────────────────────────
    const { data: verif, error: insertErr } = await supabaseAdmin
      .from('email_verifications')
      .insert({
        user_id:    profile.id,
        email:      profile.email,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select('token')
      .single()

    if (insertErr || !verif) throw insertErr ?? new Error('Failed to create verification token')

    const verifyUrl = `${SITE_URL}/verify-email?token=${verif.token}`

    // ── Send via Resend ──────────────────────────────────────────
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    RESEND_FROM,
        to:      profile.email,
        subject: `✉️ Verify your Oakmont Ridge Capital email`,
        html:    verifyEmailHtml(profile.full_name ?? 'Investor', verifyUrl, SITE_URL),
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      throw new Error(`Resend error: ${errBody}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
