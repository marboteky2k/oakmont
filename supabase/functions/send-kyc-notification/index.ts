// send-kyc-notification — REQUIRES admin JWT
// Sends KYC approved or rejected email to the user.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, corsHeaders, jsonResponse } from '../_shared/resend.ts'
import { kycApprovedEmail, kycRejectedEmail } from '../_shared/templates.ts'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON    = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL         = Deno.env.get('SITE_URL') ?? 'https://oakmontridgecapital.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ success: false, error: 'Unauthorized' }, 401)

    const anon = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user } } = await anon.auth.getUser()

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE)

    if (user) {
      const { data: profile } = await db.from('users').select('role').eq('id', user.id).single()
      if (!profile || !['super_admin', 'admin'].includes(profile.role)) {
        return jsonResponse({ success: false, error: 'Insufficient permissions' })
      }
    }

    const { user_id, status, rejection_reason } = await req.json()
    if (!user_id || !status) return jsonResponse({ success: false, error: 'user_id and status are required' })
    if (!['approved', 'rejected'].includes(status)) {
      return jsonResponse({ success: false, error: 'status must be approved or rejected' })
    }

    const { data: targetUser } = await db.from('users').select('full_name, email').eq('id', user_id).single()
    if (!targetUser?.email) return jsonResponse({ success: false, error: 'Target user not found' })

    const name = targetUser.full_name?.split(' ')[0] ?? 'Investor'

    try {
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
          'Action Required: KYC Verification — Oakmont Ridge Capital',
          kycRejectedEmail({ name, reason, kycLink: `${SITE_URL}/kyc` }),
        )
      }
    } catch (mailErr: any) {
      console.warn('KYC notification email failed (non-fatal):', mailErr.message)
    }

    return jsonResponse({ success: true })
  } catch (err: any) {
    console.error('send-kyc-notification error:', err)
    return jsonResponse({ success: false, error: err.message ?? 'Internal error' })
  }
})
