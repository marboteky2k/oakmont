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

    const { signalId } = await req.json()

    // Fetch the closed trade signal
    const { data: signal, error } = await supabase
      .from('trade_signals')
      .select('*, copy_traders(*)')
      .eq('id', signalId)
      .single()

    if (error || !signal) throw new Error('Signal not found')
    if (signal.status !== 'closed') throw new Error('Signal is not closed')

    const profitUsd = signal.profit_usd ?? 0
    const isProfitable = profitUsd > 0

    // Get all active subscribers for this trader
    const { data: subscriptions } = await supabase
      .from('copy_subscriptions')
      .select('*')
      .eq('trader_id', signal.trader_id)
      .eq('status', 'active')

    if (!subscriptions?.length) {
      return new Response(JSON.stringify({ success: true, affected: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let processed = 0
    for (const sub of subscriptions) {
      const shareRatio = sub.copy_ratio ?? 1.0
      const allocatedPortion = (sub.allocated_amount / (signal.copy_traders as any)?.assets_under_management) || 0.001
      const userProfit = profitUsd * allocatedPortion * shareRatio
      const fee = isProfitable ? userProfit * ((signal.copy_traders as any)?.performance_fee / 100) : 0
      const netProfit = userProfit - fee

      // Update subscription
      await supabase.from('copy_subscriptions').update({
        current_value: sub.current_value + netProfit,
        profit_loss: sub.profit_loss + netProfit,
      }).eq('id', sub.id)

      if (netProfit !== 0) {
        // Credit wallet
        const { data: wallet } = await supabase.from('wallets').select('balance_usdt, total_profit').eq('user_id', sub.investor_id).single()
        const w = wallet as any
        await supabase.from('wallets').update({
          balance_usdt: (w?.balance_usdt ?? 0) + netProfit,
          total_profit: (w?.total_profit ?? 0) + (netProfit > 0 ? netProfit : 0),
          updated_at: new Date().toISOString(),
        }).eq('user_id', sub.investor_id)

        // Create earning transaction
        await supabase.from('transactions').insert({
          user_id: sub.investor_id,
          type: 'copy_earning',
          amount: Math.abs(netProfit),
          currency: 'USDT',
          status: 'confirmed',
          note: `Copy trade ${isProfitable ? 'profit' : 'loss'} from ${(signal.copy_traders as any)?.display_name} — ${signal.pair} ${signal.direction}`,
          metadata: { signal_id: signalId, fee, gross: userProfit },
          created_at: new Date().toISOString(),
        })

        // Notify
        await supabase.from('notifications').insert({
          user_id: sub.investor_id,
          title: isProfitable ? 'Copy Trade Profit' : 'Copy Trade Loss',
          message: `${(signal.copy_traders as any)?.display_name} closed ${signal.pair}: ${netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)} USDT`,
          type: isProfitable ? 'success' : 'warning',
        })
      }
      processed++
    }

    // Update trader's AUM and followers count
    await supabase.from('copy_traders').update({
      followers_count: subscriptions.length,
    }).eq('id', signal.trader_id)

    return new Response(JSON.stringify({ success: true, affected: processed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
