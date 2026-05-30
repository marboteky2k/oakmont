// send-kyc-notification — REQUIRES SERVICE ROLE or admin JWT
// Called from admin KYC approval/rejection flows.
// Sends either the KYC approved or KYC rejected email template.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, corsHeaders, jsonResponse } from '../_shared/resend.ts'
import { kycApprovedEmail, kycRejectedEmail } from '../_shared/templates.ts'

const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON     = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL          = Deno.env.get('SITE_URL') ?? 'https://oakmontridgecapital.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Unauthorized' }, 401)

    // Verify caller is admin or service role
    const anon = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await anon.auth.getUser()

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE)

    // Allow service role calls (no user) or admin users
    if (user) {
      const { data: profile } = await db
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
        return jsonResponse({ error: 'Insufficient permissions' }, 403)
      }
    }

    const { user_id, status, rejection_reason } = await req.json()
    if (!user_id || !status) return jsonResponse({ error: 'user_id and status are required' }, 400)
    if (!['approved', 'rejected'].includes(status)) return jsonResponse({ error: 'status must be approved or rejected' }, 400)

    const { data: targetUser } = await db
      .from('users')
      .select('full_name, email')
      .eq('id', user_id)
      .single()

    if (!targetUser?.email) return jsonResponse({ error: 'Target user not found' }, 404)

    const name = targetUser.full_name?.split(' ')[0] ?? 'Investor'

    if (status === 'approved') {
      await sendEmail(
        targetUser.email,
        'Your KYC Verification Has Been Approved ✓',
        kycApprovedEmail({ name, dashboardLink: `${SITE_URL}/dashboard` }),
      )
    } else {
      const reason = rejection_reason ?? 'Your documents could not be verified. Please ensure they are clear, valid, and match your account details.'
      await sendEmail(
        targetUser.email,
        'Action Required: KYC Verification Rejected — Oakmont Ridge Capital',
        kycRejectedEmail({ name, reason, kycLink: `${SITE_URL}/kyc` }),
      )
    }

    return jsonResponse({ success: true })
  } catch (err: any) {
    console.error('send-kyc-notification error:', err)
    return jsonResponse({ error: err.message ?? 'Internal error' }, 500)
  }
})
