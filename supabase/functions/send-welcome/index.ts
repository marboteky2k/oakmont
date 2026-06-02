// send-welcome — PUBLIC (no auth required)
// Sends a welcome email after successful email verification.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, corsHeaders, jsonResponse } from '../_shared/resend.ts'
import { welcomeEmail } from '../_shared/templates.ts'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL         = Deno.env.get('SITE_URL') ?? 'https://oakmontridgecapital.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { user_id, email: bodyEmail } = await req.json()
    if (!user_id && !bodyEmail) return jsonResponse({ success: false, error: 'user_id or email is required' })

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE)
    const query = db.from('users').select('id, full_name, email, created_at')
    const { data: user } = await (user_id ? query.eq('id', user_id) : query.eq('email', bodyEmail)).single()

    if (!user) return jsonResponse({ success: false, error: 'User not found' })

    const ageMs = Date.now() - new Date(user.created_at).getTime()
    if (ageMs > 10 * 60 * 1000) return jsonResponse({ success: true, skipped: true })

    const name = user.full_name?.split(' ')[0] ?? 'Investor'

    try {
      await sendEmail(
        user.email,
        `Welcome to Oakmont Ridge Capital, ${name}!`,
        welcomeEmail({ name, dashboardLink: `${SITE_URL}/dashboard` }),
      )
    } catch (mailErr: any) {
      console.warn('Welcome email failed (non-fatal):', mailErr.message)
    }

    return jsonResponse({ success: true })
  } catch (err: any) {
    console.error('send-welcome error:', err)
    return jsonResponse({ success: false, error: err.message ?? 'Internal error' })
  }
})
