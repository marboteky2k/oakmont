-- 024_fix_trigger_searchpath.sql
-- handle_new_user() used SET search_path = public which hid the extensions schema.
-- gen_random_bytes() lives in extensions, so every signup silently failed.
-- Fix: include extensions in the search path.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_referral_code TEXT;
  v_full_name     TEXT;
  v_avatar_url    TEXT;
  v_referrer_id   UUID;
  v_ref_raw       TEXT;
  v_attempt       INT := 0;
BEGIN
  -- 1. Generate a unique referral code
  LOOP
    v_referral_code := upper(substring(encode(gen_random_bytes(6), 'hex'), 1, 8));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE referral_code = v_referral_code);
    v_attempt := v_attempt + 1;
    EXIT WHEN v_attempt > 20;
  END LOOP;

  -- 2. Extract metadata
  v_full_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'name'),      ''),
    split_part(NEW.email, '@', 1)
  );
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  -- 3. Resolve referrer
  v_ref_raw := trim(upper(COALESCE(NEW.raw_user_meta_data->>'referral_code', '')));
  IF v_ref_raw <> '' THEN
    SELECT id INTO v_referrer_id FROM public.users WHERE referral_code = v_ref_raw LIMIT 1;
  END IF;

  -- 4. Upsert into public.users
  INSERT INTO public.users (
    id, full_name, email, avatar_url,
    phone, country,
    investment_experience, investment_goals, asset_interests,
    email_verified, referral_code, referred_by
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

  -- 5. Ensure wallet
  INSERT INTO public.wallets (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user FAILED id=% email=% state=% err=%',
      NEW.id, NEW.email, SQLSTATE, SQLERRM;
    RETURN NEW;
END;
$$;
