-- ================================================================
-- MASTER FIX — Run this ONE file in Supabase SQL Editor
-- Covers: user_trades table, deposit crediting, swap, realtime
-- All statements are idempotent (safe to run even if some already ran)
-- ================================================================

-- ── 1. Extra columns on users (registration fields) ─────────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS investment_experience TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS investment_goals       TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS asset_interests        TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone                  TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country                TEXT;

-- ── 2. receipt_url on transactions ──────────────────────────────
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- ── 3. swap enum value ───────────────────────────────────────────
DO $$ BEGIN
  ALTER TYPE transaction_type ADD VALUE 'swap';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 4. is_ai column on chat_messages ────────────────────────────
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS is_ai BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 5. user_trades table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_trades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  symbol          TEXT NOT NULL,
  direction       TEXT NOT NULL CHECK (direction IN ('buy', 'sell')),
  amount_usdt     NUMERIC(20,8) NOT NULL,
  entry_price     NUMERIC(20,8) NOT NULL,
  close_price     NUMERIC(20,8),
  profit_loss     NUMERIC(20,8) NOT NULL DEFAULT 0,
  profit_loss_pct NUMERIC(10,4) NOT NULL DEFAULT 0,
  leverage        INTEGER NOT NULL DEFAULT 1,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  opened_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_trades ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own trades"
    ON public.user_trades FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert own trades"
    ON public.user_trades FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update own trades"
    ON public.user_trades FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can view all trades"
    ON public.user_trades FOR SELECT
    USING (EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','super_admin')
    ));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 6. credit_wallet RPC (admin deposits) ────────────────────────
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
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;
  INSERT INTO public.wallets (user_id) VALUES (p_user_id) ON CONFLICT (user_id) DO NOTHING;
  IF    p_currency = 'USDT' THEN UPDATE public.wallets SET balance_usdt = balance_usdt + p_amount WHERE user_id = p_user_id;
  ELSIF p_currency = 'BTC'  THEN UPDATE public.wallets SET balance_btc  = balance_btc  + p_amount WHERE user_id = p_user_id;
  ELSIF p_currency = 'ETH'  THEN UPDATE public.wallets SET balance_eth  = balance_eth  + p_amount WHERE user_id = p_user_id;
  ELSE RAISE EXCEPTION 'Unsupported currency: %', p_currency;
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.credit_wallet(UUID, TEXT, NUMERIC) TO authenticated;

-- ── 7. insert_ai_chat_reply RPC ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.insert_ai_chat_reply(
  p_user_id UUID,
  p_message TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO public.chat_messages (user_id, message, is_admin, is_ai, is_read)
  VALUES (p_user_id, p_message, TRUE, TRUE, FALSE);
END;
$$;
GRANT EXECUTE ON FUNCTION public.insert_ai_chat_reply(UUID, TEXT) TO authenticated;

-- ── 8. process_crypto_swap RPC ───────────────────────────────────
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
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bal_usdt NUMERIC; v_bal_btc NUMERIC; v_bal_eth NUMERIC;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_from_currency = p_to_currency THEN RAISE EXCEPTION 'Cannot swap same currency'; END IF;
  IF p_from_amount <= 0 OR p_to_amount <= 0 THEN RAISE EXCEPTION 'Amounts must be positive'; END IF;

  INSERT INTO public.wallets (user_id) VALUES (p_user_id) ON CONFLICT (user_id) DO NOTHING;

  SELECT balance_usdt, balance_btc, balance_eth
    INTO v_bal_usdt, v_bal_btc, v_bal_eth
    FROM public.wallets WHERE user_id = p_user_id FOR UPDATE;

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
  VALUES (p_user_id, 'swap'::transaction_type, p_from_amount, p_from_currency::currency_type,
    'confirmed'::transaction_status,
    'Swapped ' || p_from_amount || ' ' || p_from_currency || ' → ' || p_to_amount || ' ' || p_to_currency,
    jsonb_build_object('from_currency',p_from_currency,'to_currency',p_to_currency,
                       'from_amount',p_from_amount,'to_amount',p_to_amount,'rate',p_rate));
END;
$$;
GRANT EXECUTE ON FUNCTION public.process_crypto_swap(UUID,TEXT,TEXT,NUMERIC,NUMERIC,NUMERIC) TO authenticated;

-- ── 9. Deposit confirmation trigger ──────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_deposit_confirmed()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.type = 'deposit' AND NEW.status = 'confirmed' AND (OLD.status IS DISTINCT FROM 'confirmed') THEN
    IF    NEW.currency = 'USDT' THEN UPDATE public.wallets SET balance_usdt = balance_usdt + NEW.amount WHERE user_id = NEW.user_id;
    ELSIF NEW.currency = 'BTC'  THEN UPDATE public.wallets SET balance_btc  = balance_btc  + NEW.amount WHERE user_id = NEW.user_id;
    ELSIF NEW.currency = 'ETH'  THEN UPDATE public.wallets SET balance_eth  = balance_eth  + NEW.amount WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_deposit_confirmed ON public.transactions;
CREATE TRIGGER on_deposit_confirmed
  AFTER UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_deposit_confirmed();

-- ── 10. Enable realtime ──────────────────────────────────────────
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN others THEN NULL; END $$;
