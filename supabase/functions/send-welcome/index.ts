// ── send-welcome Edge Function ─────────────────────────────────────────────
// Sends a branded welcome email to a newly registered user via Resend.
// Called from the frontend immediately after the user's first sign-in
// following registration.
//
// Required secrets: RESEND_API_KEY, RESEND_FROM, SITE_URL
// Auth: Bearer <user JWT>
// ──────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function welcomeEmailHtml(fullName: string, siteUrl: string): string {
  const firstName = fullName.split(' ')[0] ?? fullName
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Welcome to Oakmont Ridge Capital</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(30,64,175,0.10);">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#1e40af 0%,#1e3a8a 100%);padding:48px 40px;text-align:center;">
          <div style="margin-bottom:16px;">
            <div style="display:inline-block;width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:14px;line-height:56px;text-align:center;font-size:28px;">📈</div>
          </div>
          <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Oakmont Ridge Capital</h1>
          <p style="margin:8px 0 0;color:#93c5fd;font-size:14px;">Professional Investment & Copy Trading Platform</p>
        </td>
      </tr>

      <!-- Welcome message -->
      <tr>
        <td style="padding:48px 40px 32px;">
          <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Welcome aboard, ${firstName}! 🎉</h2>
          <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7;">
            Your Oakmont Ridge Capital account is ready. You now have access to world-class
            investment tools, professional copy trading, and real-time market signals.
          </p>

          <!-- Steps -->
          <div style="margin-bottom:32px;">
            <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:20px;padding:16px;background:#f8fafc;border-radius:12px;border-left:4px solid #f59e0b;">
              <div style="min-width:32px;height:32px;background:#fef3c7;border-radius:8px;text-align:center;line-height:32px;font-size:16px;">1</div>
              <div>
                <p style="margin:0 0 4px;font-weight:600;color:#0f172a;font-size:14px;">Complete KYC Verification</p>
                <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Verify your identity to unlock withdrawals, full investment access, and higher trading limits.</p>
              </div>
            </div>
            <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:20px;padding:16px;background:#f8fafc;border-radius:12px;border-left:4px solid #3b82f6;">
              <div style="min-width:32px;height:32px;background:#dbeafe;border-radius:8px;text-align:center;line-height:32px;font-size:16px;">2</div>
              <div>
                <p style="margin:0 0 4px;font-weight:600;color:#0f172a;font-size:14px;">Fund Your Wallet</p>
                <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Deposit USDT, BTC, or ETH to start investing and copy-trading top traders.</p>
              </div>
            </div>
            <div style="display:flex;align-items:flex-start;gap:16px;padding:16px;background:#f8fafc;border-radius:12px;border-left:4px solid #22c55e;">
              <div style="min-width:32px;height:32px;background:#dcfce7;border-radius:8px;text-align:center;line-height:32px;font-size:16px;">3</div>
              <div>
                <p style="margin:0 0 4px;font-weight:600;color:#0f172a;font-size:14px;">Browse Top Traders</p>
                <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Follow professional traders and automatically mirror their trades in real time.</p>
              </div>
            </div>
          </div>

          <!-- CTA -->
          <div style="text-align:center;margin-bottom:32px;">
            <a href="${siteUrl}/kyc"
               style="display:inline-block;background:linear-gradient(135deg,#1e40af,#2563eb);color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:12px;box-shadow:0 4px 14px rgba(30,64,175,0.35);">
              Complete KYC Verification →
            </a>
          </div>

          <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.5;">
            Need help? Our support team is available 24/5.
            <a href="${siteUrl}/contact" style="color:#3b82f6;text-decoration:none;">Contact us</a> or visit the
            <a href="${siteUrl}/support" style="color:#3b82f6;text-decoration:none;">Help Center</a>.
          </p>
        </td>
      </tr>

      <!-- Security strip -->
      <tr>
        <td style="background:#1e3a8a;padding:20px 40px;">
          <p style="margin:0;font-size:12px;color:#93c5fd;text-align:center;line-height:1.6;">
            🔒 Your account is protected with bank-grade encryption and email-verified withdrawals.
            Never share your password with anyone — our team will never ask for it.
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

    // ── Authenticate ─────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser()
    if (authErr || !user) throw new Error('Unauthorized')

    // ── Get profile ──────────────────────────────────────────────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('email, full_name, created_at')
      .eq('id', user.id)
      .single()
    if (!profile) throw new Error('Profile not found')

    // ── Only send welcome email once (within 10 min of account creation) ──
    const createdAt = new Date(profile.created_at).getTime()
    const ageMinutes = (Date.now() - createdAt) / 60_000
    if (ageMinutes > 10) {
      // Account is older — silently skip (idempotent, not an error)
      return new Response(
        JSON.stringify({ success: true, skipped: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
        subject: `Welcome to Oakmont Ridge Capital, ${profile.full_name?.split(' ')[0] ?? 'Investor'}! 🎉`,
        html:    welcomeEmailHtml(profile.full_name ?? 'Investor', SITE_URL),
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      // Log but don't throw — welcome email failure should not break registration flow
      console.error(`send-welcome Resend error: ${errBody}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    console.error('send-welcome error:', err.message)
    // Return success anyway — welcome email failure must not disrupt registration
    return new Response(
      JSON.stringify({ success: true, warning: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
