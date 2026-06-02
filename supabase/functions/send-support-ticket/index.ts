// send-support-ticket — PUBLIC (no JWT required)
// Accepts a support / contact-us form submission.
// 1. Generates a unique ticket number (ORC-XXXXXX)
// 2. Saves the ticket to the support_tickets table
// 3. Sends an internal notification email to support@oakmontridgecapital.com
// 4. Sends a confirmation email to the submitting user

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendEmail, corsHeaders, jsonResponse } from '../_shared/resend.ts'
import { supportTicketAdminEmail, supportTicketUserEmail } from '../_shared/templates.ts'

const SUPABASE_URL     = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_ANON    = Deno.env.get('SUPABASE_ANON_KEY')!
const SITE_URL         = Deno.env.get('SITE_URL') ?? 'https://oakmontridgecapital.com'
const SUPPORT_INBOX    = 'support@oakmontridgecapital.com'

/** Generates ORC-XXXXXX where X is a digit */
function generateTicketNumber(): string {
  const arr = new Uint32Array(1)
  crypto.getRandomValues(arr)
  const digits = String(arr[0] % 1_000_000).padStart(6, '0')
  return `ORC-${digits}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { name, email, subject, topic, message, source } = await req.json()

    if (!name?.trim())  return jsonResponse({ success: false, error: 'Name is required' })
    if (!email?.includes('@')) return jsonResponse({ success: false, error: 'Valid email is required' })
    if (!message?.trim() || message.trim().length < 5) {
      return jsonResponse({ success: false, error: 'Message is required' })
    }

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE)

    // Optionally link to a logged-in user
    let userId: string | null = null
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const anon = createClient(SUPABASE_URL, SUPABASE_ANON, {
        global: { headers: { Authorization: authHeader } },
      })
      const { data: { user } } = await anon.auth.getUser()
      if (user) userId = user.id
    }

    // Generate a unique ticket number (retry once on collision)
    let ticketNumber = generateTicketNumber()
    for (let attempt = 0; attempt < 2; attempt++) {
      const { data: existing } = await db
        .from('support_tickets')
        .select('id')
        .eq('ticket_number', ticketNumber)
        .maybeSingle()
      if (!existing) break
      ticketNumber = generateTicketNumber()
    }

    const now = new Date()
    const createdAtLabel = now.toLocaleString('en-US', {
      timeZone: 'UTC',
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZoneName: 'short',
    })

    // Insert ticket
    const { error: insertErr } = await db.from('support_tickets').insert({
      ticket_number: ticketNumber,
      user_id:       userId,
      name:          name.trim(),
      email:         email.trim().toLowerCase(),
      subject:       (subject || topic || '').trim() || null,
      topic:         (topic || subject || '').trim() || null,
      message:       message.trim(),
      source:        source ?? 'support',
      status:        'open',
      created_at:    now.toISOString(),
    })

    if (insertErr) {
      console.error('Ticket insert error:', insertErr)
      return jsonResponse({ success: false, error: 'Failed to save ticket: ' + insertErr.message })
    }

    const subjectLine = (subject || topic || '').trim() || 'General Inquiry'

    // Both emails are best-effort — the ticket is already saved in the DB.
    // If Resend isn't configured yet (domain not verified), we still return
    // the ticket number so the user knows their message was received.
    try {
      await sendEmail(
        SUPPORT_INBOX,
        `[${ticketNumber}] New Support Ticket — ${subjectLine}`,
        supportTicketAdminEmail({
          ticketNumber,
          name:      name.trim(),
          email:     email.trim(),
          subject:   subjectLine,
          message:   message.trim(),
          source:    source ?? 'support',
          createdAt: createdAtLabel,
        }),
      )
    } catch (mailErr) {
      console.warn('Admin notification email failed (non-fatal):', mailErr)
    }

    try {
      await sendEmail(
        email.trim(),
        `Your Support Request Has Been Received — ${ticketNumber}`,
        supportTicketUserEmail({
          ticketNumber,
          name:         name.trim().split(' ')[0] ?? name.trim(),
          subject:      subjectLine,
          message:      message.trim(),
          dashboardLink: `${SITE_URL}/dashboard`,
        }),
      )
    } catch (mailErr) {
      console.warn('User confirmation email failed (non-fatal):', mailErr)
    }

    return jsonResponse({ success: true, ticket_number: ticketNumber })
  } catch (err: any) {
    console.error('send-support-ticket error:', err)
    return jsonResponse({ success: false, error: err.message ?? 'Internal error' })
  }
})
