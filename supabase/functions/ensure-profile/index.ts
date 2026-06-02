// ensure-profile — REQUIRES AUTH (user JWT)
// Called by the frontend immediately after signup as a reliable fallback.
// Uses the service-role key so RLS is bypassed entirely.
// Idempotent: safe to call even if the DB trigger already created the row.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/resend.ts'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON    = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/** 8-char unique referral code — no confusable chars */
function makeCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  const arr = new Uint8Array(8)
  crypto.getRandomValues(arr)
  for (const b of arr) code += chars[b % chars.length]
  return code
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Verify the caller is a real authenticated user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ success: false, error: 'Unauthorized' }, 401)

    const anon = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authErr } = await anon.auth.getUser()
    if (authErr || !user) return jsonResponse({ success: false, error: 'Unauthorized' }, 401)

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE)

    // Parse optional profile fields from request body
    const body = await req.json().catch(() => ({}))
    const {
      full_name, phone, country,
      investment_experience, investment_goals, asset_interests,
      referral_code: referrer_code,
    } = body

    // Check if profile already exists
    const { data: existing } = await db
      .from('users')
      .select('id, referral_code')
      .eq('id', user.id)
      .maybeSingle()

    if (existing?.referral_code) {
      // Profile exists and has a code — nothing to do
      return jsonResponse({ success: true, created: false })
    }

    // Generate a unique referral code
    let code = makeCode()
    for (let i = 0; i < 20; i++) {
      const { data: clash } = await db
        .from('users')
        .select('id')
        .eq('referral_code', code)
        .maybeSingle()
      if (!clash) break
      code = makeCode()
    }

    // Resolve referrer
    let referrerId: string | null = null
    if (referrer_code?.trim()) {
      const { data: referrer } = await db
        .from('users')
        .select('id')
        .eq('referral_code', referrer_code.trim().toUpperCase())
        .maybeSingle()
      referrerId = referrer?.id ?? null
    }

    const displayName = (
      full_name?.trim() ||
      user.user_metadata?.full_name?.trim() ||
      user.email?.split('@')[0] ||
      'Investor'
    )

    // Upsert profile — service role bypasses RLS
    const { error: upsertErr } = await db.from('users').upsert({
      id:                    user.id,
      email:                 user.email ?? '',
      full_name:             displayName,
      avatar_url:            user.user_metadata?.avatar_url ?? null,
      phone:                 phone?.trim() || user.user_metadata?.phone?.trim() || null,
      country:               country?.trim() || user.user_metadata?.country?.trim() || null,
      investment_experience: investment_experience?.trim() || user.user_metadata?.investment_experience?.trim() || null,
      investment_goals:      investment_goals?.trim() || user.user_metadata?.investment_goals?.trim() || null,
      asset_interests:       asset_interests?.trim() || user.user_metadata?.asset_interests?.trim() || null,
      email_verified:        false,
      referral_code:         code,
      referred_by:           referrerId,
    }, { onConflict: 'id', ignoreDuplicates: false })

    if (upsertErr) {
      console.error('ensure-profile upsert error:', upsertErr)
      return jsonResponse({ success: false, error: upsertErr.message })
    }

    // Ensure wallet
    await db.from('wallets').upsert({ user_id: user.id }, { onConflict: 'user_id' })

    return jsonResponse({ success: true, created: true })
  } catch (err: any) {
    console.error('ensure-profile error:', err)
    return jsonResponse({ success: false, error: err.message ?? 'Internal error' })
  }
})
