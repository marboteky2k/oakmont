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

    const { referrerId, newUserId, depositAmount } = await req.json()

    if (!referrerId || !newUserId || !depositAmount) throw new Error('Missing fields')

    // Get referral bonus percentage from settings
    const { data: setting } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'referral_bonus_pct')
      .single()
    const bonusPct = parseFloat(setting?.value ?? '5') / 100
    const bonus = parseFloat(depositAmount) * bonusPct

    if (bonus <= 0) return new Response(JSON.stringify({ success: true, bonus: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

    // Credit referrer
    const { data: wallet } = await supabase.from('wallets').select('balance_usdt').eq('user_id', referrerId).single()
    await supabase.from('wallets').update({
      balance_usdt: ((wallet as any)?.balance_usdt ?? 0) + bonus,
      updated_at: new Date().toISOString(),
    }).eq('user_id', referrerId)

    await supabase.from('transactions').insert({
      user_id: referrerId,
      type: 'copy_earning',
      amount: bonus,
      currency: 'USDT',
      status: 'confirmed',
      note: `Referral bonus for inviting new investor`,
      metadata: { referred_user: newUserId, deposit: depositAmount, pct: bonusPct * 100 },
      created_at: new Date().toISOString(),
    })

    await supabase.from('notifications').insert({
      user_id: referrerId,
      title: 'Referral Bonus Earned!',
      message: `You earned ${bonus.toFixed(2)} USDT referral commission from your invite.`,
      type: 'success',
    })

    return new Response(JSON.stringify({ success: true, bonus }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
