import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Unauthorized')
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) throw new Error('Unauthorized')

    const { data: adminProfile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!['admin', 'super_admin'].includes((adminProfile as any)?.role)) throw new Error('Forbidden')

    const { kycId, userId, action, reason } = await req.json()

    if (!['approve', 'reject'].includes(action)) throw new Error('Invalid action')

    const kycStatus = action === 'approve' ? 'approved' : 'rejected'
    const userKycStatus = action === 'approve' ? 'verified' : 'rejected'

    // Update KYC document
    await supabase.from('kyc_documents').update({
      status: kycStatus,
      rejection_reason: action === 'reject' ? reason : null,
      reviewed_by: user.id,
    }).eq('id', kycId)

    // Update user kyc_status
    await supabase.from('users').update({ kyc_status: userKycStatus }).eq('id', userId)

    // Notify user
    const notifTitle = action === 'approve' ? 'KYC Approved! ✅' : 'KYC Rejected'
    const notifMsg = action === 'approve'
      ? 'Your identity has been verified. You now have full access to all platform features.'
      : `Your KYC submission was rejected. Reason: ${reason ?? 'Document not clear'}. Please re-submit.`

    await supabase.from('notifications').insert({
      user_id: userId,
      title: notifTitle,
      message: notifMsg,
      type: action === 'approve' ? 'success' : 'danger',
    })

    // Audit log
    await supabase.from('audit_logs').insert({
      admin_id: user.id,
      action: `kyc_${action}d`,
      target_type: 'kyc_document',
      target_id: kycId,
      details: { userId, reason },
    })

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
