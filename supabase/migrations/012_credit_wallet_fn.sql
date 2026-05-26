-- ================================================================
-- PASTE THIS INTO: Supabase Dashboard → SQL Editor → New Query → RUN
-- ================================================================

CREATE OR REPLACE FUNCTION public.credit_wallet(
  p_user_id  UUID,
  p_currency TEXT,
  p_amount   NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;
  INSERT INTO public.wallets (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
  IF    p_currency = 'USDT' THEN UPDATE public.wallets SET balance_usdt = balance_usdt + p_amount WHERE user_id = p_user_id;
  ELSIF p_currency = 'BTC'  THEN UPDATE public.wallets SET balance_btc  = balance_btc  + p_amount WHERE user_id = p_user_id;
  ELSIF p_currency = 'ETH'  THEN UPDATE public.wallets SET balance_eth  = balance_eth  + p_amount WHERE user_id = p_user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.credit_wallet(UUID, TEXT, NUMERIC) TO authenticated;

-- ================================================================
-- Run the two lines below SEPARATELY if the above succeeds
-- (they may error if tables are already in the publication — that's fine)
-- ================================================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
