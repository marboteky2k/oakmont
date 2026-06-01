-- ================================================================
-- MIGRATION 019 — Definitive registration & public.users fix
-- ================================================================
-- Fixes new user registrations not appearing in public.users.
--
-- Root causes addressed:
--   1. email_verified column may not exist → added with safe default
--   2. email_verifications table may not exist → created if missing
--   3. withdrawal_verifications table may not exist → created if missing
--   4. Trigger function updated to explicitly set email_verified=FALSE
--   5. Trigger re-attached idempotently
--   6. RLS policy added so users can INSERT their own row as fallback
-- ================================================================

-- ── 1. Ensure email_verified column ──────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 2. Ensure email_verifications table ──────────────────────────
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email      TEXT        NOT NULL,
  token      UUID        NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_verif_token_idx
  ON public.email_verifications (token)
  WHERE used_at IS NULL;

CREATE INDEX IF NOT EXISTS email_verif_user_idx
  ON public.email_verifications (user_id, created_at);

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'email_verifications' AND policyname = 'no_direct_user_access'
  ) THEN
    CREATE POLICY "no_direct_user_access" ON public.email_verifications
      AS RESTRICTIVE FOR ALL USING (false);
  END IF;
END;
$$;

-- ── 3. Ensure withdrawal_verifications table ──────────────────────
CREATE TABLE IF NOT EXISTS public.withdrawal_verifications (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id   UUID        NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token           UUID        NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  amount          DECIMAL(20,8) NOT NULL,
  currency        TEXT        NOT NULL,
  crypto_address  TEXT        NOT NULL,
  network         TEXT,
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 minutes',
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wd_verif_token_idx
  ON public.withdrawal_verifications (token)
  WHERE verified_at IS NULL;

CREATE INDEX IF NOT EXISTS wd_verif_user_idx
  ON public.withdrawal_verifications (user_id, created_at);

ALTER TABLE public.withdrawal_verifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'withdrawal_verifications' AND policyname = 'no_direct_user_access'
  ) THEN
    CREATE POLICY "no_direct_user_access" ON public.withdrawal_verifications
      AS RESTRICTIVE FOR ALL USING (false);
  END IF;
END;
$$;

-- ── 4. Add 'pending_verification' to transaction status (if not exists)
DO $$
BEGIN
  -- transactions.status is TEXT in most setups; if it's an ENUM alter it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'transactions'
      AND column_name  = 'status'
      AND data_type    = 'USER-DEFINED'
  ) THEN
    BEGIN
      ALTER TYPE transaction_status ADD VALUE IF NOT EXISTS 'pending_verification';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;
END;
$$;

-- ── 5. Definitive handle_new_user function ───────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_referral_code TEXT;
  v_full_name     TEXT;
  v_avatar_url    TEXT;
  v_ref_code_raw  TEXT;
  v_referrer_id   UUID;
  v_attempt       INT := 0;
BEGIN
  -- ── Generate collision-safe referral code ────────────────────
  LOOP
    v_referral_code := upper(substring(encode(gen_random_bytes(6), 'hex'), 1, 8));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.users WHERE referral_code = v_referral_code
    );
    v_attempt := v_attempt + 1;
    EXIT WHEN v_attempt > 10;
  END LOOP;

  -- ── Extract metadata ─────────────────────────────────────────
  v_full_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
    split_part(NEW.email, '@', 1)
  );
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  -- ── Resolve referrer ─────────────────────────────────────────
  v_ref_code_raw := trim(upper(COALESCE(NEW.raw_user_meta_data->>'referral_code', '')));
  IF v_ref_code_raw <> '' THEN
    SELECT id INTO v_referrer_id
    FROM public.users
    WHERE referral_code = v_ref_code_raw
    LIMIT 1;
  END IF;

  -- ── Upsert profile row (includes email_verified = FALSE) ─────
  INSERT INTO public.users (
    id, full_name, email, avatar_url,
    phone, country,
    investment_experience, investment_goals, asset_interests,
    email_verified,
    referral_code, referred_by
  )
  VALUES (
    NEW.id,
    v_full_name,
    NEW.email,
    v_avatar_url,
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'phone',                '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'country',              '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'investment_experience', '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'investment_goals',     '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'asset_interests',      '')), ''),
    FALSE,  -- email_verified starts false; set to true by verify-email-token
    v_referral_code,
    v_referrer_id
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name             = COALESCE(EXCLUDED.full_name,             public.users.full_name),
    avatar_url            = COALESCE(EXCLUDED.avatar_url,            public.users.avatar_url),
    email                 = EXCLUDED.email,
    phone                 = COALESCE(EXCLUDED.phone,                 public.users.phone),
    country               = COALESCE(EXCLUDED.country,               public.users.country),
    investment_experience = COALESCE(EXCLUDED.investment_experience, public.users.investment_experience),
    investment_goals      = COALESCE(EXCLUDED.investment_goals,      public.users.investment_goals),
    asset_interests       = COALESCE(EXCLUDED.asset_interests,       public.users.asset_interests),
    referred_by           = COALESCE(public.users.referred_by,       EXCLUDED.referred_by);

  -- ── Always create wallet ─────────────────────────────────────
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  -- ── Auto-confirm email in auth.users ────────────────────────
  -- Allows Supabase-level sign-in; our custom email_verified field
  -- controls app-level access until the Resend link is clicked.
  UPDATE auth.users
  SET
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmed_at       = COALESCE(confirmed_at,       NOW())
  WHERE id = NEW.id;

  RETURN NEW;

-- ── EXCEPTION block — NEVER block user creation ───────────────
EXCEPTION
  WHEN unique_violation THEN
    -- Duplicate email (e.g. Google + email/password same address)
    BEGIN
      INSERT INTO public.wallets (user_id)
      VALUES (NEW.id)
      ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      UPDATE auth.users
      SET
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        confirmed_at       = COALESCE(confirmed_at,       NOW())
      WHERE id = NEW.id;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    RAISE WARNING 'handle_new_user: unique_violation for email=%, auth_id=%: %',
      NEW.email, NEW.id, SQLERRM;
    RETURN NEW;

  WHEN OTHERS THEN
    -- Catch-all: log but never fail the auth insert
    BEGIN
      UPDATE auth.users
      SET
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        confirmed_at       = COALESCE(confirmed_at,       NOW())
      WHERE id = NEW.id;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    RAISE WARNING 'handle_new_user: error for auth_id=%, sqlstate=%, err=%',
      NEW.id, SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$$;

-- ── 6. Re-attach trigger (idempotent) ────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 7. RLS: allow authenticated users to INSERT their own row ────
-- This is the frontend fallback if the trigger ever misses.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON public.users
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END;
$$;

-- ── 8. Back-fill any existing auth users who have no profile ────
INSERT INTO public.users (id, email, full_name, email_verified, referral_code)
SELECT
  au.id,
  au.email,
  COALESCE(
    NULLIF(trim(au.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(au.raw_user_meta_data->>'name'), ''),
    split_part(au.email, '@', 1)
  ),
  FALSE,
  upper(substring(encode(gen_random_bytes(6), 'hex'), 1, 8))
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE pu.id IS NULL
  AND au.deleted_at IS NULL
ON CONFLICT (id) DO NOTHING;

-- Also back-fill wallets for any user who has a profile but no wallet
INSERT INTO public.wallets (user_id)
SELECT id FROM public.users
ON CONFLICT (user_id) DO NOTHING;
