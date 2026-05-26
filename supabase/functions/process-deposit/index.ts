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

    const { txId } = await req.json()

    // Fetch pending transaction
    const { data: tx, error: txErr } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', txId)
      .eq('status', 'pending')
      .eq('type', 'deposit')
      .single()

    if (txErr || !tx) throw new Error('Transaction not found or already processed')

    // Mark transaction confirmed
    await supabase.from('transactions').update({ status: 'confirmed' }).eq('id', txId)

    // Credit wallet
    const field = tx.currency === 'USDT' ? 'balance_usdt' : tx.currency === 'BTC' ? 'balance_btc' : 'balance_eth'
    const { data: wallet } = await supabase
      .from('wallets')
      .select(field)
      .eq('user_id', tx.user_id)
      .single()

    const currentBalance = (wallet as any)?.[field] ?? 0
    await supabase.from('wallets').update({
      [field]: currentBalance + tx.amount,
      updated_at: new Date().toISOString(),
    }).eq('user_id', tx.user_id)

    // Send notification
    await supabase.from('notifications').insert({
      user_id: tx.user_id,
      title: 'Deposit Confirmed',
      message: `Your deposit of ${tx.amount} ${tx.currency} has been confirmed and credited to your wallet.`,
      type: 'success',
    })

    // Log audit
    await supabase.from('audit_logs').insert({
      admin_id: tx.user_id,
      action: 'deposit_confirmed',
      target_type: 'transaction',
      target_id: txId,
      details: { amount: tx.amount, currency: tx.currency },
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
