-- =============================================================
-- MIGRATION 010 — Auto-credit wallet on deposit + Crypto Swap
-- =============================================================

-- 1. Add receipt_url column to transactions (used by frontend already)
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- 2. Add 'swap' to the transaction_type enum
-- (Must run outside a transaction block in Postgres; Supabase SQL editor handles this)
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'swap';

-- =============================================================
-- 3. Trigger: automatically credit wallet when deposit is confirmed
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_deposit_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Only fire when:
  --   • type  = 'deposit'
  --   • status just changed TO 'confirmed'
  --   • it was NOT already 'confirmed' (prevents double-credit on re-saves)
  IF NEW.type = 'deposit'
     AND NEW.status = 'confirmed'
     AND (OLD.status IS DISTINCT FROM 'confirmed') THEN

    IF NEW.currency = 'USDT' THEN
      UPDATE public.wallets
        SET balance_usdt = balance_usdt + NEW.amount
        WHERE user_id = NEW.user_id;

    ELSIF NEW.currency = 'BTC' THEN
      UPDATE public.wallets
        SET balance_btc = balance_btc + NEW.amount
        WHERE user_id = NEW.user_id;

    ELSIF NEW.currency = 'ETH' THEN
      UPDATE public.wallets
        SET balance_eth = balance_eth + NEW.amount
        WHERE user_id = NEW.user_id;
    END IF;

    -- Also send a notification to the user
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.user_id,
      'Deposit Confirmed ✅',
      'Your deposit of ' || NEW.amount || ' ' || NEW.currency || ' has been confirmed and credited to your wallet.',
      'success'
    );

  END IF;

  RETURN NEW;
END;
$$;

-- Drop if exists to allow re-runs
DROP TRIGGER IF EXISTS on_deposit_confirmed ON public.transactions;

CREATE TRIGGER on_deposit_confirmed
  AFTER UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_deposit_confirmed();

-- =============================================================
-- 4. SECURITY DEFINER RPC: process_crypto_swap
--    Atomically deducts from-currency and credits to-currency
--    in a single transaction, then records it.
-- =============================================================
CREATE OR REPLACE FUNCTION public.process_crypto_swap(
  p_user_id      UUID,
  p_from_currency TEXT,   -- 'USDT' | 'BTC' | 'ETH'
  p_to_currency   TEXT,
  p_from_amount   NUMERIC,
  p_to_amount     NUMERIC,
  p_rate          NUMERIC  -- informational: 1 [from] = p_rate [to]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_bal_usdt NUMERIC;
  v_bal_btc  NUMERIC;
  v_bal_eth  NUMERIC;
BEGIN
  -- Auth guard
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Validate currencies
  IF p_from_currency = p_to_currency THEN
    RAISE EXCEPTION 'Cannot swap a currency for itself';
  END IF;

  IF p_from_currency NOT IN ('USDT','BTC','ETH') OR p_to_currency NOT IN ('USDT','BTC','ETH') THEN
    RAISE EXCEPTION 'Unsupported currency';
  END IF;

  IF p_from_amount <= 0 OR p_to_amount <= 0 THEN
    RAISE EXCEPTION 'Amounts must be positive';
  END IF;

  -- Lock the wallet row for this update
  SELECT balance_usdt, balance_btc, balance_eth
    INTO v_bal_usdt, v_bal_btc, v_bal_eth
    FROM public.wallets
    WHERE user_id = p_user_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet not found';
  END IF;

  -- Sufficient balance check
  IF    p_from_currency = 'USDT' AND v_bal_usdt < p_from_amount THEN
    RAISE EXCEPTION 'Insufficient USDT balance';
  ELSIF p_from_currency = 'BTC'  AND v_bal_btc  < p_from_amount THEN
    RAISE EXCEPTION 'Insufficient BTC balance';
  ELSIF p_from_currency = 'ETH'  AND v_bal_eth  < p_from_amount THEN
    RAISE EXCEPTION 'Insufficient ETH balance';
  END IF;

  -- Deduct from source
  IF    p_from_currency = 'USDT' THEN
    UPDATE public.wallets SET balance_usdt = balance_usdt - p_from_amount WHERE user_id = p_user_id;
  ELSIF p_from_currency = 'BTC' THEN
    UPDATE public.wallets SET balance_btc  = balance_btc  - p_from_amount WHERE user_id = p_user_id;
  ELSIF p_from_currency = 'ETH' THEN
    UPDATE public.wallets SET balance_eth  = balance_eth  - p_from_amount WHERE user_id = p_user_id;
  END IF;

  -- Credit to destination
  IF    p_to_currency = 'USDT' THEN
    UPDATE public.wallets SET balance_usdt = balance_usdt + p_to_amount WHERE user_id = p_user_id;
  ELSIF p_to_currency = 'BTC' THEN
    UPDATE public.wallets SET balance_btc  = balance_btc  + p_to_amount WHERE user_id = p_user_id;
  ELSIF p_to_currency = 'ETH' THEN
    UPDATE public.wallets SET balance_eth  = balance_eth  + p_to_amount WHERE user_id = p_user_id;
  END IF;

  -- Record the swap as a single transaction (from-side, with metadata for full picture)
  INSERT INTO public.transactions (
    user_id, type, amount, currency, status, note, metadata
  ) VALUES (
    p_user_id,
    'swap'::transaction_type,
    p_from_amount,
    p_from_currency::currency_type,
    'confirmed'::transaction_status,
    'Swapped ' || p_from_amount || ' ' || p_from_currency || ' → ' || p_to_amount || ' ' || p_to_currency,
    jsonb_build_object(
      'from_currency', p_from_currency,
      'to_currency',   p_to_currency,
      'from_amount',   p_from_amount,
      'to_amount',     p_to_amount,
      'rate',          p_rate
    )
  );

END;
$$;

-- Grant execute to authenticated users (auth guard is inside the function)
GRANT EXECUTE ON FUNCTION public.process_crypto_swap(UUID, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC) TO authenticated;
