-- ================================================================
-- MIGRATION 014 — Fix "Database error saving new user"
-- ================================================================
-- Root cause: migration 009 rewrote handle_new_user to insert into
-- a `country` column that was never added to the table in that
-- migration (only in 013). It also removed the EXCEPTION block from
-- 003, so any column error propagates straight to the client.
--
-- This migration:
--   1. Ensures every column the trigger touches actually exists.
--   2. Rewrites handle_new_user with full EXCEPTION safety (never
--      blocks user creation regardless of any internal error).
--   3. Re-attaches the trigger idempotently.
-- ================================================================

-- ── 1. Guarantee all profile columns exist ────────────────────────
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone                 TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS country               TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS investment_experience TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS investment_goals      TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS asset_interests       TEXT;

-- ── 2. Definitive handle_new_user ────────────────────────────────
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
  -- ── Generate a collision-safe referral code ──────────────────
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

  -- ── Upsert profile row ───────────────────────────────────────
  INSERT INTO public.users (
    id, full_name, email, avatar_url,
    phone, country,
    investment_experience, investment_goals, asset_interests,
    referral_code, referred_by
  )
  VALUES (
    NEW.id,
    v_full_name,
    NEW.email,
    v_avatar_url,
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'phone', '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'country', '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'investment_experience', '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'investment_goals', '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'asset_interests', '')), ''),
    v_referral_code,
    v_referrer_id
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name             = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url            = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    email                 = EXCLUDED.email,
    phone                 = COALESCE(EXCLUDED.phone, public.users.phone),
    country               = COALESCE(EXCLUDED.country, public.users.country),
    investment_experience = COALESCE(EXCLUDED.investment_experience, public.users.investment_experience),
    investment_goals      = COALESCE(EXCLUDED.investment_goals, public.users.investment_goals),
    asset_interests       = COALESCE(EXCLUDED.asset_interests, public.users.asset_interests),
    referred_by           = COALESCE(public.users.referred_by, EXCLUDED.referred_by);

  -- ── Always create wallet ─────────────────────────────────────
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;

-- ── EXCEPTION block — never block user creation ───────────────
EXCEPTION
  WHEN unique_violation THEN
    -- Duplicate email in public.users (e.g. Google + email/password).
    -- Make sure the wallet exists for the new auth UUID.
    BEGIN
      INSERT INTO public.wallets (user_id)
      VALUES (NEW.id)
      ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    RAISE WARNING 'handle_new_user: email conflict for %, auth_id=%, err=%',
      NEW.email, NEW.id, SQLERRM;
    RETURN NEW;

  WHEN OTHERS THEN
    -- Catch-all: log the error but never fail user creation
    RAISE WARNING 'handle_new_user: error for auth_id=%, sqlstate=%, err=%',
      NEW.id, SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$$;

-- ── 3. Re-attach trigger (idempotent) ────────────────────────────
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
