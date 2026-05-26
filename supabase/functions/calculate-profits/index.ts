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

    const now = new Date()

    // Fetch all active investments that have matured
    const { data: maturedInvestments } = await supabase
      .from('investments')
      .select('*, investment_plans(*)')
      .eq('status', 'active')
      .lte('maturity_at', now.toISOString())

    let processed = 0

    for (const inv of maturedInvestments ?? []) {
      const plan = inv.investment_plans as any
      const totalReturn = inv.amount * (1 + plan.roi_percentage / 100)
      const profit = totalReturn - inv.amount

      // Mark investment completed
      await supabase.from('investments').update({
        status: 'completed',
        actual_return: totalReturn,
      }).eq('id', inv.id)

      // Credit wallet
      const { data: wallet } = await supabase.from('wallets').select('balance_usdt, total_profit').eq('user_id', inv.user_id).single()
      const w = wallet as any
      await supabase.from('wallets').update({
        balance_usdt: (w?.balance_usdt ?? 0) + totalReturn,
        total_profit: (w?.total_profit ?? 0) + profit,
        updated_at: now.toISOString(),
      }).eq('user_id', inv.user_id)

      // Log transaction
      await supabase.from('transactions').insert([
        {
          user_id: inv.user_id, type: 'profit', amount: profit, currency: 'USDT',
          status: 'confirmed', note: `Investment ROI — ${plan.name}`, created_at: now.toISOString(),
        },
        {
          user_id: inv.user_id, type: 'deposit', amount: inv.amount, currency: 'USDT',
          status: 'confirmed', note: `Investment principal returned — ${plan.name}`, created_at: now.toISOString(),
        },
      ])

      // Notify user
      await supabase.from('notifications').insert({
        user_id: inv.user_id,
        title: 'Investment Matured!',
        message: `Your ${plan.name} investment has matured. ${inv.amount} USDT + ${profit.toFixed(2)} USDT profit has been credited.`,
        type: 'success',
      })

      processed++
    }

    return new Response(JSON.stringify({ success: true, processed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
