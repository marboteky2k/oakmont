-- =============================================================
-- PHASE 3 — ADDITIONS: columns, exchange keys, bot trading,
--            receipt uploads, user-auth sync fix
-- =============================================================

-- ── 1. Add missing columns to public.users ──────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS country      TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- ── 2. Exchange API keys ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.exchange_api_keys (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exchange     TEXT NOT NULL,           -- 'binance' | 'okx' | 'bybit'
  label        TEXT NOT NULL DEFAULT '',
  api_key      TEXT NOT NULL,
  api_secret   TEXT NOT NULL,           -- store as-is; encrypt at edge-function level
  passphrase   TEXT,                    -- OKX requires a passphrase
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  is_connected BOOLEAN NOT NULL DEFAULT FALSE,
  last_tested  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, exchange)
);

ALTER TABLE public.exchange_api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "keys_select_own" ON public.exchange_api_keys FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "keys_insert_own" ON public.exchange_api_keys FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "keys_update_own" ON public.exchange_api_keys FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "keys_delete_own" ON public.exchange_api_keys FOR DELETE USING (user_id = auth.uid());

-- ── 3. Receipt URL on transactions ──────────────────────────
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- ── 4. Bot trading ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bot_trades (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exchange       TEXT NOT NULL,         -- 'binance' | 'okx' | 'bybit'
  strategy       TEXT NOT NULL,         -- 'grid' | 'dca' | 'momentum' | 'scalper'
  pair           TEXT NOT NULL,         -- e.g. 'BTC/USDT'
  status         TEXT NOT NULL DEFAULT 'active',
  profit_pct     NUMERIC(10,4) NOT NULL DEFAULT 0,
  profit_usd     NUMERIC(20,2) NOT NULL DEFAULT 0,
  total_trades   INTEGER NOT NULL DEFAULT 0,
  total_invested NUMERIC(20,2) NOT NULL DEFAULT 0,
  config         JSONB,
  started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stopped_at     TIMESTAMPTZ
);

ALTER TABLE public.bot_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bot_select_own"  ON public.bot_trades FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "bot_insert_own"  ON public.bot_trades FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "bot_update_own"  ON public.bot_trades FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "bot_delete_own"  ON public.bot_trades FOR DELETE USING (user_id = auth.uid());

-- ── 5. Storage bucket for deposit receipts ──────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('receipts', 'receipts', FALSE)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "receipts_upload_own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::TEXT);
CREATE POLICY "receipts_read_own" ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts' AND ((storage.foldername(name))[1] = auth.uid()::TEXT OR public.is_admin()));

-- ── 6. Fix handle_new_user to include country + sync existing auth users ──
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_referral_code TEXT;
  v_full_name     TEXT;
  v_avatar_url    TEXT;
  v_ref_code      TEXT;
  v_referrer_id   UUID;
BEGIN
  v_referral_code := upper(substring(encode(gen_random_bytes(6), 'hex'), 1, 8));
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );
  v_ref_code := NEW.raw_user_meta_data->>'referral_code';

  -- Lookup referrer
  IF v_ref_code IS NOT NULL THEN
    SELECT id INTO v_referrer_id
    FROM public.users
    WHERE referral_code = v_ref_code
    LIMIT 1;
  END IF;

  INSERT INTO public.users (id, full_name, email, avatar_url, referral_code, referred_by)
  VALUES (NEW.id, v_full_name, NEW.email, v_avatar_url, v_referral_code, v_referrer_id)
  ON CONFLICT (id) DO UPDATE SET
    full_name  = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    email      = COALESCE(EXCLUDED.email, public.users.email);

  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Re-attach trigger (drop old first)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 7. Manual sync: backfill any auth users missing from public.users ──
-- Run once after applying this migration:
-- SELECT public.sync_missing_auth_users();
CREATE OR REPLACE FUNCTION public.sync_missing_auth_users()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_count INTEGER := 0;
  v_row   RECORD;
  v_code  TEXT;
BEGIN
  FOR v_row IN
    SELECT au.id, au.email,
           au.raw_user_meta_data->>'full_name' AS full_name,
           au.raw_user_meta_data->>'name'      AS name_alt,
           au.raw_user_meta_data->>'avatar_url' AS avatar_url,
           au.raw_user_meta_data->>'picture'   AS picture
    FROM auth.users au
    LEFT JOIN public.users pu ON pu.id = au.id
    WHERE pu.id IS NULL
  LOOP
    v_code := upper(substring(encode(gen_random_bytes(6), 'hex'), 1, 8));
    INSERT INTO public.users (id, full_name, email, avatar_url, referral_code)
    VALUES (
      v_row.id,
      COALESCE(v_row.full_name, v_row.name_alt, split_part(v_row.email, '@', 1), ''),
      v_row.email,
      COALESCE(v_row.avatar_url, v_row.picture),
      v_code
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.wallets (user_id)
    VALUES (v_row.id)
    ON CONFLICT (user_id) DO NOTHING;

    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- ── 8. Promote first super_admin (update email below) ────────
-- UPDATE public.users
--   SET role = 'super_admin', country = 'GB', kyc_status = 'approved'
--   WHERE email = 'your-admin@email.com';
