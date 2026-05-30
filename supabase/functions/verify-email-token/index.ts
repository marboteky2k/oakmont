// verify-email-token — PUBLIC (no auth required)
// User clicks link from their email: /verify-email?token=xxx
// Validates the token, marks user as verified, sends welcome email.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, corsHeaders, jsonResponse } from '../_shared/resend.ts'
import { welcomeEmail } from '../_shared/templates.ts'

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL          = Deno.env.get('SITE_URL') ?? 'https://oakmontridgecapital.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { token } = await req.json()
    if (!token) return jsonResponse({ error: 'token is required' }, 400)

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE)

    // Find valid, unused, non-expired token
    const { data: record, error } = await db
      .from('email_verifications')
      .select('id, user_id, email, used_at, expires_at')
      .eq('token', token)
      .single()

    if (error || !record) return jsonResponse({ error: 'Invalid or expired verification link.' }, 400)
    if (record.used_at)   return jsonResponse({ error: 'This verification link has already been used.' }, 400)
    if (new Date(record.expires_at) < new Date()) {
      return jsonResponse({ error: 'This verification link has expired. Please request a new one.' }, 400)
    }

    // Get user details
    const { data: user } = await db
      .from('users')
      .select('full_name, email_verified')
      .eq('id', record.user_id)
      .single()

    if (user?.email_verified) {
      // Already verified by a different path — idempotent success
      return jsonResponse({ success: true, email: record.email })
    }

    // Mark user as verified
    await db
      .from('users')
      .update({ email_verified: true })
      .eq('id', record.user_id)

    // Consume the token
    await db
      .from('email_verifications')
      .update({ used_at: new Date().toISOString() })
      .eq('id', record.id)

    // Send welcome email (fire-and-forget — don't fail the verification if this errors)
    const name = user?.full_name?.split(' ')[0] ?? 'Investor'
    sendEmail(
      record.email,
      `Welcome to Oakmont Ridge Capital, ${name}!`,
      welcomeEmail({ name, dashboardLink: `${SITE_URL}/dashboard` }),
    ).catch(console.error)

    return jsonResponse({ success: true, email: record.email })
  } catch (err: any) {
    console.error('verify-email-token error:', err)
    return jsonResponse({ error: err.message ?? 'Internal error' }, 500)
  }
})
