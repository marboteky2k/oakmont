-- 026_realistic_portfolio_data.sql
-- Add realistic portfolio growth data for test users

-- User 1: msenibo@gmail.com (conservative)
UPDATE public.wallets
SET
  balance_usdt = 15250.75,
  balance_btc = 0.35,
  balance_eth = 2.8,
  total_invested = 12000.00,
  total_profit = 3250.75,
  updated_at = NOW()
WHERE user_id IN (SELECT id FROM public.users WHERE email = 'msenibo@gmail.com');

-- User 2: martinsowukio@gmail.com (moderate)
UPDATE public.wallets
SET
  balance_usdt = 28500.50,
  balance_btc = 0.65,
  balance_eth = 5.5,
  total_invested = 24000.00,
  total_profit = 4500.50,
  updated_at = NOW()
WHERE user_id IN (SELECT id FROM public.users WHERE email = 'martinsowukio@gmail.com');

-- User 3: admin@oakmontridge.com (aggressive)
UPDATE public.wallets
SET
  balance_usdt = 45000.00,
  balance_btc = 1.2,
  balance_eth = 10.2,
  total_invested = 38000.00,
  total_profit = 7000.00,
  updated_at = NOW()
WHERE user_id IN (SELECT id FROM public.users WHERE email = 'admin@oakmontridge.com');
