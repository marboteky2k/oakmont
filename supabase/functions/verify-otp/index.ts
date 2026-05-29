// ── verify-otp Edge Function ───────────────────────────────────────────────
// Validates the 6-digit OTP the user entered, checks it hasn't expired or
// been used, then marks it consumed so it cannot be reused.
//
// Request body:  { otp: string, purpose?: 'withdrawal' | 'general' }
// Auth:          Bearer <user JWT>
// ──────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
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

    // ── Parse body ───────────────────────────────────────────────
    const body = await req.json()
    const otp     = String(body.otp ?? '').trim()
    const purpose = String(body.purpose ?? 'withdrawal')

    if (!otp || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      throw new Error('Enter the 6-digit code sent to your email')
    }

    // ── Service-role client to read/update email_otps ────────────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── Look up a valid (unused, non-expired) matching OTP ───────
    const { data: record, error: lookupErr } = await supabaseAdmin
      .from('email_otps')
      .select('id, expires_at')
      .eq('user_id', user.id)
      .eq('otp', otp)
      .eq('purpose', purpose)
      .is('used_at', null)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lookupErr) throw lookupErr

    if (!record) {
      // Give a generic error — don't reveal whether otp is wrong vs expired
      throw new Error('The code is incorrect or has expired. Please request a new one.')
    }

    // ── Mark OTP as used (single-use) ───────────────────────────
    const { error: updateErr } = await supabaseAdmin
      .from('email_otps')
      .update({ used_at: new Date().toISOString() })
      .eq('id', record.id)

    if (updateErr) throw updateErr

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
