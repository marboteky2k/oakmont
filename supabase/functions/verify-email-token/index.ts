// ── verify-email-token Edge Function ──────────────────────────────────────
// Validates the token from the verification link clicked in the email.
// Does NOT require authentication — the user may click from any device.
//
// Request body: { token: string }
// Returns: { success: true, email: string } | { error: string }
// ──────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { token } = await req.json()
    if (!token) throw new Error('Token is required')

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ── Look up the token ────────────────────────────────────────
    const { data: record, error: lookupErr } = await supabaseAdmin
      .from('email_verifications')
      .select('id, user_id, email, expires_at, used_at')
      .eq('token', token)
      .maybeSingle()

    if (lookupErr) throw lookupErr

    if (!record) {
      throw new Error('This verification link is invalid or has already been used.')
    }

    if (record.used_at) {
      throw new Error('This verification link has already been used. You can sign in now.')
    }

    if (new Date(record.expires_at) < new Date()) {
      throw new Error('This verification link has expired. Please request a new one.')
    }

    // ── Mark email as verified on the user profile ───────────────
    const { error: updateErr } = await supabaseAdmin
      .from('users')
      .update({ email_verified: true })
      .eq('id', record.user_id)

    if (updateErr) throw updateErr

    // ── Consume the token (single-use) ───────────────────────────
    await supabaseAdmin
      .from('email_verifications')
      .update({ used_at: new Date().toISOString() })
      .eq('id', record.id)

    return new Response(
      JSON.stringify({ success: true, email: record.email }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
