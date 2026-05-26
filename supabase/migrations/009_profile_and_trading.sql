-- =============================================================
-- MIGRATION 009 — Extended Profile Fields + User Trades
-- =============================================================

-- 1. Add new profile columns to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS investment_experience TEXT,
  ADD COLUMN IF NOT EXISTS investment_goals       TEXT,
  ADD COLUMN IF NOT EXISTS asset_interests        TEXT;

-- 2. Update handle_new_user trigger to populate extra fields from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_referral_code  TEXT;
  v_referred_by    UUID;
  v_ref_code_input TEXT;
BEGIN
  v_referral_code := upper(substring(encode(gen_random_bytes(6), 'hex'), 1, 8));

  -- Resolve referral code if provided
  v_ref_code_input := NEW.raw_user_meta_data->>'referral_code';
  IF v_ref_code_input IS NOT NULL THEN
    SELECT id INTO v_referred_by FROM public.users
    WHERE referral_code = upper(trim(v_ref_code_input));
  END IF;

  INSERT INTO public.users (
    id, full_name, email, phone, country,
    investment_experience, investment_goals, asset_interests,
    referral_code, referred_by
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'investment_experience',
    NEW.raw_user_meta_data->>'investment_goals',
    NEW.raw_user_meta_data->>'asset_interests',
    v_referral_code,
    v_referred_by
  )
  ON CONFLICT (id) DO UPDATE SET
    phone                 = EXCLUDED.phone,
    country               = EXCLUDED.country,
    investment_experience = EXCLUDED.investment_experience,
    investment_goals      = EXCLUDED.investment_goals,
    asset_interests       = EXCLUDED.asset_interests,
    referred_by           = COALESCE(public.users.referred_by, EXCLUDED.referred_by);

  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 3. User trades table (simulated manual trading)
CREATE TABLE IF NOT EXISTS public.user_trades (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  symbol        TEXT NOT NULL,
  direction     TEXT NOT NULL CHECK (direction IN ('buy', 'sell')),
  amount_usdt   NUMERIC(20,8) NOT NULL,      -- USDT staked
  entry_price   NUMERIC(20,8) NOT NULL,
  close_price   NUMERIC(20,8),
  profit_loss   NUMERIC(20,8) NOT NULL DEFAULT 0,
  profit_loss_pct NUMERIC(10,4) NOT NULL DEFAULT 0,
  leverage      INTEGER NOT NULL DEFAULT 1,
  status        TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  opened_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. RLS for user_trades
ALTER TABLE public.user_trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trades"
  ON public.user_trades FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trades"
  ON public.user_trades FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trades"
  ON public.user_trades FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all trades"
  ON public.user_trades FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
