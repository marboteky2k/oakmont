-- =============================================================
-- MIGRATION 011 — Admin confirm deposit (atomic confirm + credit)
-- =============================================================
-- The admin "Approve" button now calls this RPC instead of a
-- plain status update. This guarantees the wallet is always
-- credited in the same transaction, with no trigger dependency.
-- =============================================================

CREATE OR REPLACE FUNCTION public.admin_confirm_deposit(p_transaction_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tx RECORD;
BEGIN
  -- Admin-only guard
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  -- Lock the transaction row so concurrent approvals are safe
  SELECT * INTO v_tx
    FROM public.transactions
    WHERE id = p_transaction_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  IF v_tx.type != 'deposit' THEN
    RAISE EXCEPTION 'Only deposits can be confirmed via this function';
  END IF;

  -- Idempotent: if already confirmed, return early without double-crediting
  IF v_tx.status = 'confirmed' THEN
    RETURN jsonb_build_object('ok', true, 'already_confirmed', true);
  END IF;

  -- 1. Mark the transaction confirmed
  UPDATE public.transactions
    SET status = 'confirmed'
    WHERE id = p_transaction_id;

  -- 2. Credit the matching wallet balance column
  IF v_tx.currency = 'USDT' THEN
    UPDATE public.wallets
      SET balance_usdt = balance_usdt + v_tx.amount
      WHERE user_id = v_tx.user_id;

  ELSIF v_tx.currency = 'BTC' THEN
    UPDATE public.wallets
      SET balance_btc = balance_btc + v_tx.amount
      WHERE user_id = v_tx.user_id;

  ELSIF v_tx.currency = 'ETH' THEN
    UPDATE public.wallets
      SET balance_eth = balance_eth + v_tx.amount
      WHERE user_id = v_tx.user_id;
  END IF;

  -- 3. Notify the user
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    v_tx.user_id,
    'Deposit Confirmed ✅',
    'Your deposit of ' || v_tx.amount || ' ' || v_tx.currency ||
    ' has been confirmed and credited to your wallet.',
    'success'
  );

  RETURN jsonb_build_object(
    'ok',       true,
    'credited', v_tx.amount,
    'currency', v_tx.currency,
    'user_id',  v_tx.user_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_confirm_deposit(UUID) TO authenticated;


-- =============================================================
-- Also add receipt_url and swap enum (safe if 010 was already run)
-- =============================================================
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS receipt_url TEXT;

ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'swap';

-- Deposit-confirmed trigger (safe to recreate)
CREATE OR REPLACE FUNCTION public.handle_deposit_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.type = 'deposit'
     AND NEW.status = 'confirmed'
     AND (OLD.status IS DISTINCT FROM 'confirmed') THEN

    IF NEW.currency = 'USDT' THEN
      UPDATE public.wallets SET balance_usdt = balance_usdt + NEW.amount WHERE user_id = NEW.user_id;
    ELSIF NEW.currency = 'BTC' THEN
      UPDATE public.wallets SET balance_btc  = balance_btc  + NEW.amount WHERE user_id = NEW.user_id;
    ELSIF NEW.currency = 'ETH' THEN
      UPDATE public.wallets SET balance_eth  = balance_eth  + NEW.amount WHERE user_id = NEW.user_id;
    END IF;

  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_deposit_confirmed ON public.transactions;
CREATE TRIGGER on_deposit_confirmed
  AFTER UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_deposit_confirmed();

-- =============================================================
-- Swap RPC (safe to recreate)
-- =============================================================
CREATE OR REPLACE FUNCTION public.process_crypto_swap(
  p_user_id      UUID,
  p_from_currency TEXT,
  p_to_currency   TEXT,
  p_from_amount   NUMERIC,
  p_to_amount     NUMERIC,
  p_rate          NUMERIC
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
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF p_from_currency = p_to_currency THEN
    RAISE EXCEPTION 'Cannot swap a currency for itself';
  END IF;
  IF p_from_currency NOT IN ('USDT','BTC','ETH') OR p_to_currency NOT IN ('USDT','BTC','ETH') THEN
    RAISE EXCEPTION 'Unsupported currency';
  END IF;
  IF p_from_amount <= 0 OR p_to_amount <= 0 THEN
    RAISE EXCEPTION 'Amounts must be positive';
  END IF;

  SELECT balance_usdt, balance_btc, balance_eth
    INTO v_bal_usdt, v_bal_btc, v_bal_eth
    FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;

  IF    p_from_currency = 'USDT' AND v_bal_usdt < p_from_amount THEN RAISE EXCEPTION 'Insufficient USDT balance';
  ELSIF p_from_currency = 'BTC'  AND v_bal_btc  < p_from_amount THEN RAISE EXCEPTION 'Insufficient BTC balance';
  ELSIF p_from_currency = 'ETH'  AND v_bal_eth  < p_from_amount THEN RAISE EXCEPTION 'Insufficient ETH balance';
  END IF;

  IF    p_from_currency = 'USDT' THEN UPDATE public.wallets SET balance_usdt = balance_usdt - p_from_amount WHERE user_id = p_user_id;
  ELSIF p_from_currency = 'BTC'  THEN UPDATE public.wallets SET balance_btc  = balance_btc  - p_from_amount WHERE user_id = p_user_id;
  ELSIF p_from_currency = 'ETH'  THEN UPDATE public.wallets SET balance_eth  = balance_eth  - p_from_amount WHERE user_id = p_user_id;
  END IF;

  IF    p_to_currency = 'USDT' THEN UPDATE public.wallets SET balance_usdt = balance_usdt + p_to_amount WHERE user_id = p_user_id;
  ELSIF p_to_currency = 'BTC'  THEN UPDATE public.wallets SET balance_btc  = balance_btc  + p_to_amount WHERE user_id = p_user_id;
  ELSIF p_to_currency = 'ETH'  THEN UPDATE public.wallets SET balance_eth  = balance_eth  + p_to_amount WHERE user_id = p_user_id;
  END IF;

  INSERT INTO public.transactions (user_id, type, amount, currency, status, note, metadata)
  VALUES (
    p_user_id, 'swap'::transaction_type, p_from_amount,
    p_from_currency::currency_type, 'confirmed'::transaction_status,
    'Swapped ' || p_from_amount || ' ' || p_from_currency || ' → ' || p_to_amount || ' ' || p_to_currency,
    jsonb_build_object('from_currency', p_from_currency, 'to_currency', p_to_currency,
                       'from_amount', p_from_amount, 'to_amount', p_to_amount, 'rate', p_rate)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_crypto_swap(UUID, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC) TO authenticated;

-- =============================================================
-- Enable Realtime for wallets and transactions
-- (required for Wallet.tsx live balance + tx updates)
-- =============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
