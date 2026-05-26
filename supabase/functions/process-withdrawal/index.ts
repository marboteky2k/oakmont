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

    const { userId, amount, currency, cryptoAddress } = await req.json()

    if (!userId || !amount || !currency || !cryptoAddress) {
      throw new Error('Missing required fields')
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) throw new Error('Invalid amount')

    // Check minimum withdrawal from site settings
    const { data: setting } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'min_withdrawal')
      .single()
    const minWithdrawal = parseFloat(setting?.value ?? '20')
    if (numAmount < minWithdrawal) throw new Error(`Minimum withdrawal is $${minWithdrawal}`)

    // Check wallet balance
    const balanceField = currency === 'USDT' ? 'balance_usdt' : currency === 'BTC' ? 'balance_btc' : 'balance_eth'
    const { data: wallet } = await supabase
      .from('wallets')
      .select(balanceField)
      .eq('user_id', userId)
      .single()

    const balance = (wallet as any)?.[balanceField] ?? 0
    if (balance < numAmount) throw new Error('Insufficient balance')

    // Debit wallet immediately
    await supabase.from('wallets').update({
      [balanceField]: balance - numAmount,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId)

    // Create withdrawal transaction (pending admin approval)
    const { data: tx } = await supabase.from('transactions').insert({
      user_id: userId,
      type: 'withdrawal',
      amount: numAmount,
      currency,
      status: 'pending',
      crypto_address: cryptoAddress,
      note: 'Withdrawal request — awaiting admin processing',
      created_at: new Date().toISOString(),
    }).select().single()

    // Notify user
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'Withdrawal Request Submitted',
      message: `Your withdrawal of ${numAmount} ${currency} is being processed and will arrive within 24 hours.`,
      type: 'info',
    })

    return new Response(JSON.stringify({ success: true, txId: tx?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
