import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ success: false, error: 'Unauthorized' }, 401)

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) return json({ success: false, error: 'Unauthorized' }, 401)

    const { data: adminProfile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!['admin', 'super_admin'].includes((adminProfile as any)?.role)) {
      return json({ success: false, error: 'Forbidden' })
    }

    const { kycId, userId, action, reason } = await req.json()
    if (!['approve', 'reject'].includes(action)) {
      return json({ success: false, error: 'Invalid action' })
    }

    const kycStatus  = action === 'approve' ? 'approved' : 'rejected'
    const userStatus = action === 'approve' ? 'verified'  : 'rejected'

    await supabase.from('kyc_documents').update({
      status: kycStatus,
      rejection_reason: action === 'reject' ? reason : null,
      reviewed_by: user.id,
    }).eq('id', kycId)

    await supabase.from('users').update({ kyc_status: userStatus }).eq('id', userId)

    await supabase.from('notifications').insert({
      user_id: userId,
      title:   action === 'approve' ? 'KYC Approved! ✅' : 'KYC Rejected',
      message: action === 'approve'
        ? 'Your identity has been verified. You now have full access to all platform features.'
        : `Your KYC submission was rejected. Reason: ${reason ?? 'Document not clear'}. Please re-submit.`,
      type: action === 'approve' ? 'success' : 'danger',
    })

    await supabase.from('audit_logs').insert({
      admin_id:    user.id,
      action:      `kyc_${action}d`,
      target_type: 'kyc_document',
      target_id:   kycId,
      details:     { userId, reason },
    })

    return json({ success: true })
  } catch (err: any) {
    console.error('admin-approve-kyc error:', err)
    return json({ success: false, error: err.message ?? 'Internal error' })
  }
})
