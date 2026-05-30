// send-withdrawal-verification — REQUIRES AUTH (user JWT)
// Creates a pending withdrawal transaction and sends a confirmation link via Resend.
// The withdrawal stays in 'pending_verification' until the user clicks the link.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, corsHeaders, jsonResponse } from '../_shared/resend.ts'
import { withdrawalVerificationEmail } from '../_shared/templates.ts'

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON     = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL          = Deno.env.get('SITE_URL') ?? 'https://oakmontridgecapital.com'
const EXPIRE_MINS       = 30

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401)

    // Verify caller identity
    const anon = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authErr } = await anon.auth.getUser()
    if (authErr || !user) return jsonResponse({ error: 'Unauthorized' }, 401)

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE)

    const { amount, currency, address, network } = await req.json()
    if (!amount || !currency || !address) return jsonResponse({ error: 'Missing required fields' }, 400)

    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) return jsonResponse({ error: 'Invalid amount' }, 400)

    // Fetch user profile for name + email
    const { data: profile } = await db
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    if (!profile?.email) return jsonResponse({ error: 'User email not found' }, 400)

    // Create the withdrawal transaction (status = pending_verification)
    const { data: tx, error: txErr } = await db
      .from('transactions')
      .insert({
        user_id:        user.id,
        type:           'withdrawal',
        amount:         amt,
        currency,
        status:         'pending_verification',
        crypto_address: address.trim(),
        network:        network ?? null,
        note:           'Awaiting email confirmation before admin processing',
        created_at:     new Date().toISOString(),
      })
      .select('id')
      .single()

    if (txErr || !tx) throw new Error(`Failed to create transaction: ${txErr?.message}`)

    // Create verification record
    const expiresAt = new Date(Date.now() + EXPIRE_MINS * 60 * 1000).toISOString()
    const { data: verif, error: verifErr } = await db
      .from('withdrawal_verifications')
      .insert({
        withdrawal_id:  tx.id,
        user_id:        user.id,
        amount:         amt,
        currency,
        crypto_address: address.trim(),
        network:        network ?? null,
        expires_at:     expiresAt,
      })
      .select('token')
      .single()

    if (verifErr || !verif) throw new Error('Failed to create verification token')

    const link = `${SITE_URL}/verify-withdrawal?token=${verif.token}`
    const name = profile.full_name?.split(' ')[0] ?? 'Investor'

    await sendEmail(
      profile.email,
      'Confirm Your Withdrawal Request — Oakmont Ridge Capital',
      withdrawalVerificationEmail({
        name,
        amount: amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 }),
        currency,
        address: address.trim(),
        link,
        expiresMins: EXPIRE_MINS,
      }),
    )

    return jsonResponse({ success: true, tx_id: tx.id })
  } catch (err: any) {
    console.error('send-withdrawal-verification error:', err)
    return jsonResponse({ error: err.message ?? 'Internal error' }, 500)
  }
})
