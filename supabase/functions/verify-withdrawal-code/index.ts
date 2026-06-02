// verify-withdrawal-code — REQUIRES AUTH (user JWT)
// User enters their 6-digit code in the wallet modal.
// Validates the code for the authenticated user, promotes the transaction
// from 'pending_verification' → 'pending' for admin processing.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/resend.ts'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON    = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ success: false, error: 'Unauthorized' }, 401)

    // Verify caller identity
    const anon = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authErr } = await anon.auth.getUser()
    if (authErr || !user) return jsonResponse({ success: false, error: 'Unauthorized' }, 401)

    const body = await req.json()
    const code = body?.code
    if (!code || typeof code !== 'string' || !code.trim()) {
      return jsonResponse({ success: false, error: 'Verification code is required' })
    }

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE)

    // Find the matching verification record for this user
    const { data: verif, error: verifErr } = await db
      .from('withdrawal_verifications')
      .select('id, withdrawal_id, amount, currency, crypto_address, network, expires_at')
      .eq('user_id', user.id)
      .eq('code', code.trim())
      .is('verified_at', null)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (verifErr) {
      console.error('Verification lookup error:', verifErr)
      return jsonResponse({ success: false, error: 'Failed to look up verification record' })
    }

    if (!verif) {
      return jsonResponse({ success: false, error: 'Invalid or expired verification code. Please request a new withdrawal.' })
    }

    // Confirm the withdrawal — promote to 'pending' for admin processing
    const { error: txErr } = await db
      .from('transactions')
      .update({ status: 'pending', note: 'Email code verified — awaiting admin approval' })
      .eq('id', verif.withdrawal_id)
      .eq('status', 'pending_verification') // guard against double-confirm

    if (txErr) {
      console.error('Transaction update error:', txErr)
      return jsonResponse({ success: false, error: 'Failed to confirm transaction — please contact support' })
    }

    // Mark the verification record as used
    await db
      .from('withdrawal_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', verif.id)

    return jsonResponse({
      success: true,
      withdrawal: {
        amount:   verif.amount,
        currency: verif.currency,
        address:  verif.crypto_address,
        network:  verif.network,
      },
    })
  } catch (err: any) {
    console.error('verify-withdrawal-code error:', err)
    return jsonResponse({ success: false, error: err.message ?? 'Internal error' })
  }
})
