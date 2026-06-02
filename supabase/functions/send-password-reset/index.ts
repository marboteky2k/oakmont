// send-password-reset — PUBLIC (no auth required)
// Uses Supabase admin API to generate a secure recovery link,
// then delivers it via Resend instead of Supabase's built-in email system.
// Returns success for unknown emails to prevent user enumeration.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, corsHeaders, jsonResponse } from '../_shared/resend.ts'
import { passwordResetEmail } from '../_shared/templates.ts'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL         = Deno.env.get('SITE_URL') ?? 'https://oakmontridgecapital.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return jsonResponse({ success: false, error: 'email is required' })
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Look up the user's display name from public.users
    // Always return success even if not found — prevents user enumeration
    const { data: user } = await admin
      .from('users')
      .select('full_name')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (!user) {
      // Silently succeed — don't reveal whether the email exists
      return jsonResponse({ success: true })
    }

    // Generate Supabase password recovery link via admin API
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: email.toLowerCase().trim(),
      options: { redirectTo: `${SITE_URL}/reset-password` },
    })

    if (linkErr || !linkData?.properties?.action_link) {
      throw new Error(linkErr?.message ?? 'Failed to generate reset link')
    }

    const name = user.full_name?.split(' ')[0] ?? 'there'
    const link = linkData.properties.action_link

    try {
      await sendEmail(
        email,
        'Reset Your Password — Oakmont Ridge Capital',
        passwordResetEmail({ name, link }),
      )
    } catch (mailErr: any) {
      console.error('Password reset email failed:', mailErr.message)
      return jsonResponse({
        success: false,
        error: 'We could not send the reset email right now. Please try again later or contact support@oakmontridgecapital.com',
      })
    }

    return jsonResponse({ success: true })
  } catch (err: any) {
    console.error('send-password-reset error:', err)
    return jsonResponse({ success: false, error: err.message ?? 'Internal error' })
  }
})
