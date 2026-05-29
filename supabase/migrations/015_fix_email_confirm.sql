-- ================================================================
-- MIGRATION 015 — Auto-confirm new users (no auth-schema DDL needed)
-- ================================================================
-- Why the previous approach failed:
--   Supabase blocks CREATE FUNCTION / CREATE TRIGGER inside the `auth`
--   schema from the SQL editor (permission denied for schema auth).
--
-- This migration uses two approaches that DO work:
--
--   1. Back-fill: plain UPDATE on auth.users (postgres role can do DML
--      on auth.users, just not DDL in the auth schema).
--
--   2. Forward: extend the existing public.handle_new_user() trigger
--      (SECURITY DEFINER → runs as postgres) to UPDATE auth.users and
--      set email_confirmed_at on the newly created row.  Because it is
--      an UPDATE (not INSERT) it does not recurse into INSERT triggers.
-- ================================================================

-- ── 1. Back-fill existing unconfirmed accounts ────────────────────
-- Any user stuck with email_confirmed_at IS NULL can now log in.
UPDATE auth.users
SET
  email_confirmed_at = created_at,
  confirmed_at       = created_at
WHERE
  email_confirmed_at IS NULL
  AND deleted_at IS NULL;

-- ── 2. Extend handle_new_user to auto-confirm future signups ──────
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

  -- ── Auto-confirm email so user can sign in immediately ───────
  -- This UPDATE runs as postgres (SECURITY DEFINER) so it has access
  -- to auth.users.  It is an UPDATE, not INSERT, so it does not
  -- recurse into this INSERT trigger.
  UPDATE auth.users
  SET
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmed_at       = COALESCE(confirmed_at,       NOW())
  WHERE id = NEW.id;

  RETURN NEW;

-- ── EXCEPTION block — never block user creation ───────────────
EXCEPTION
  WHEN unique_violation THEN
    BEGIN
      INSERT INTO public.wallets (user_id)
      VALUES (NEW.id)
      ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    -- Best-effort confirmation even on conflict path
    BEGIN
      UPDATE auth.users
      SET
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        confirmed_at       = COALESCE(confirmed_at,       NOW())
      WHERE id = NEW.id;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    RAISE WARNING 'handle_new_user: email conflict for %, auth_id=%, err=%',
      NEW.email, NEW.id, SQLERRM;
    RETURN NEW;

  WHEN OTHERS THEN
    -- Catch-all: attempt confirmation then return — never fail sign-up
    BEGIN
      UPDATE auth.users
      SET
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        confirmed_at       = COALESCE(confirmed_at,       NOW())
      WHERE id = NEW.id;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
    RAISE WARNING 'handle_new_user: error for auth_id=%, sqlstate=%, err=%',
      NEW.id, SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$$;
