-- 023_fix_trigger.sql
-- 1. Drop the redundant BEFORE INSERT trigger on public.users
--    (handle_new_user already generates referral codes; the extra BEFORE trigger
--     was firing during that same INSERT and causing silent failures)
-- 2. Rewrite handle_new_user() — simpler, no UPDATE on auth.users (mailer_autoconfirm handles it)
-- 3. Keep assign_referral_code() for any direct inserts to public.users NOT from the trigger

DROP TRIGGER IF EXISTS trg_assign_referral_code ON public.users;

-- Rewrite the trigger function — leaner, no auth.users self-update
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral_code TEXT;
  v_full_name     TEXT;
  v_avatar_url    TEXT;
  v_referrer_id   UUID;
  v_ref_raw       TEXT;
  v_attempt       INT := 0;
BEGIN
  -- ── 1. Generate a unique referral code ──────────────────────────────────
  LOOP
    v_referral_code := upper(substring(encode(gen_random_bytes(6), 'hex'), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE referral_code = v_referral_code);
    v_attempt := v_attempt + 1;
    EXIT WHEN v_attempt > 20;  -- safety valve
  END LOOP;

  -- ── 2. Extract fields from auth metadata ────────────────────────────────
  v_full_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'name'),      ''),
    split_part(NEW.email, '@', 1)
  );
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  -- ── 3. Resolve referrer from referral_code in metadata ──────────────────
  v_ref_raw := trim(upper(COALESCE(NEW.raw_user_meta_data->>'referral_code', '')));
  IF v_ref_raw <> '' THEN
    SELECT id INTO v_referrer_id FROM public.users WHERE referral_code = v_ref_raw LIMIT 1;
  END IF;

  -- ── 4. Upsert profile into public.users ─────────────────────────────────
  INSERT INTO public.users (
    id, full_name, email, avatar_url,
    phone, country,
    investment_experience, investment_goals, asset_interests,
    email_verified,
    referral_code, referred_by
  ) VALUES (
    NEW.id,
    v_full_name,
    NEW.email,
    v_avatar_url,
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'phone',                 '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'country',               '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'investment_experience', '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'investment_goals',      '')), ''),
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data->>'asset_interests',       '')), ''),
    FALSE,
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

  -- ── 5. Ensure wallet row exists ─────────────────────────────────────────
  INSERT INTO public.wallets (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user FAILED for id=% email=% state=% err=%',
      NEW.id, NEW.email, SQLSTATE, SQLERRM;
    -- Never block auth user creation — return NEW regardless
    RETURN NEW;
END;
$$;

-- Re-attach trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Restore the BEFORE trigger only for direct public.users inserts
-- (NOT needed when going through auth — the auth trigger handles it)
-- Keep it as a safety net for admin/manual inserts
CREATE TRIGGER trg_assign_referral_code
  BEFORE INSERT ON public.users
  FOR EACH ROW
  WHEN (NEW.referral_code IS NULL OR NEW.referral_code = '')
  EXECUTE FUNCTION public.assign_referral_code();
