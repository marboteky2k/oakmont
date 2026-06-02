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

    const { userId, amount, currency, note } = await req.json()
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return json({ success: false, error: 'Invalid amount' })
    }

    const balanceField =
      currency === 'USDT' ? 'balance_usdt' :
      currency === 'BTC'  ? 'balance_btc'  : 'balance_eth'

    const { data: wallet } = await supabase.from('wallets').select(balanceField).eq('user_id', userId).single()
    const currentBalance = (wallet as any)?.[balanceField] ?? 0

    await supabase.from('wallets').update({
      [balanceField]: currentBalance + numAmount,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId)

    await supabase.from('transactions').insert({
      user_id:    userId,
      type:       'deposit',
      amount:     numAmount,
      currency,
      status:     'confirmed',
      note:       note ?? 'Admin manual credit',
      created_at: new Date().toISOString(),
    })

    await supabase.from('notifications').insert({
      user_id: userId,
      title:   'Account Credited',
      message: `${numAmount} ${currency} has been credited to your account by an administrator.`,
      type:    'success',
    })

    await supabase.from('audit_logs').insert({
      admin_id:    user.id,
      action:      'admin_credit',
      target_type: 'wallet',
      target_id:   userId,
      details:     { amount: numAmount, currency, note },
    })

    return json({ success: true })
  } catch (err: any) {
    console.error('admin-credit-wallet error:', err)
    return json({ success: false, error: err.message ?? 'Internal error' })
  }
})
