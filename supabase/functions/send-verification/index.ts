// send-verification — PUBLIC (no auth required)
// Generates a UUID token, stores it, and sends a branded verification email via Resend.
// Called right after registration before the user has a session.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, corsHeaders, jsonResponse } from '../_shared/resend.ts'
import { verificationEmail } from '../_shared/templates.ts'

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL          = Deno.env.get('SITE_URL') ?? 'https://oakmontridgecapital.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { email } = await req.json()
    if (!email) return jsonResponse({ error: 'email is required' }, 400)

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE)

    // Look up the user
    const { data: user, error: userErr } = await db
      .from('users')
      .select('id, full_name, email_verified')
      .eq('email', email)
      .single()

    if (userErr || !user) return jsonResponse({ error: 'No account found for that email.' }, 404)
    if (user.email_verified) return jsonResponse({ already_verified: true })

    // Rate limit: max 3 emails per hour per user
    const hourAgo = new Date(Date.now() - 3_600_000).toISOString()
    const { count } = await db
      .from('email_verifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', hourAgo)

    if ((count ?? 0) >= 3) {
      return jsonResponse({ error: 'Too many verification emails sent. Please wait before trying again.' }, 429)
    }

    // Invalidate previous unused tokens
    await db
      .from('email_verifications')
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('used_at', null)

    // Insert new token
    const { data: record, error: insertErr } = await db
      .from('email_verifications')
      .insert({ user_id: user.id, email })
      .select('token')
      .single()

    if (insertErr || !record) throw new Error('Failed to create verification token')

    const link = `${SITE_URL}/verify-email?token=${record.token}`
    const name = user.full_name?.split(' ')[0] ?? 'there'

    await sendEmail(email, 'Verify Your Email Address — Oakmont Ridge Capital', verificationEmail({ name, link }))

    return jsonResponse({ success: true })
  } catch (err: any) {
    console.error('send-verification error:', err)
    return jsonResponse({ error: err.message ?? 'Internal error' }, 500)
  }
})
