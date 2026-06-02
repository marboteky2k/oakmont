// verify-withdrawal-token — PUBLIC (no auth required)
// User clicks confirmation link from withdrawal email.
// Validates the token, promotes transaction from 'pending_verification' → 'pending'.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/resend.ts'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { token } = await req.json()
    if (!token) return jsonResponse({ success: false, error: 'token is required' })

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE)

    const { data: record, error } = await db
      .from('withdrawal_verifications')
      .select('id, withdrawal_id, user_id, amount, currency, crypto_address, network, verified_at, expires_at')
      .eq('token', token)
      .single()

    if (error || !record) return jsonResponse({ success: false, error: 'Invalid or expired confirmation link.' })
    if (record.verified_at) {
      return jsonResponse({ success: true, already_verified: true, message: 'This withdrawal has already been confirmed.' })
    }
    if (new Date(record.expires_at) < new Date()) {
      return jsonResponse({ success: false, error: 'This confirmation link has expired (30-minute window). Please submit a new withdrawal request.' })
    }

    const { data: tx } = await db
      .from('transactions')
      .select('id, status')
      .eq('id', record.withdrawal_id)
      .single()

    if (!tx) return jsonResponse({ success: false, error: 'Withdrawal transaction not found.' })
    if (tx.status !== 'pending_verification') {
      return jsonResponse({ success: true, already_verified: true, message: 'This withdrawal has already been processed.' })
    }

    await db
      .from('transactions')
      .update({ status: 'pending', note: 'Email confirmed — awaiting admin processing' })
      .eq('id', record.withdrawal_id)

    await db
      .from('withdrawal_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', record.id)

    return jsonResponse({
      success: true,
      withdrawal: {
        amount:   record.amount,
        currency: record.currency,
        address:  record.crypto_address,
        network:  record.network,
      },
    })
  } catch (err: any) {
    console.error('verify-withdrawal-token error:', err)
    return jsonResponse({ success: false, error: err.message ?? 'Internal error' })
  }
})
