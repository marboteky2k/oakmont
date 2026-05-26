-- =============================================================
-- MIGRATION 003 — Harden handle_new_user trigger
-- =============================================================
-- Root cause of "Database error creating new user":
--   Any unhandled exception inside the trigger propagates up
--   through pg → Supabase Auth → client as that error string.
--
-- Fixes applied:
--   1. Single EXCEPTION block with multiple WHEN clauses
--      (PL/pgSQL only allows ONE exception handler per BEGIN block)
--   2. Loop-generate referral_code to avoid unique_violation
--   3. Handle email uniqueness conflict gracefully
--   4. Resolve referrer UUID from referral_code text
-- =============================================================

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
  -- ── 1. Generate a collision-safe referral code ─────────────
  LOOP
    v_referral_code := upper(substring(encode(gen_random_bytes(6), 'hex'), 1, 8));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.users WHERE referral_code = v_referral_code
    );
    v_attempt := v_attempt + 1;
    EXIT WHEN v_attempt > 10;
  END LOOP;

  -- ── 2. Extract user metadata ────────────────────────────────
  v_full_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
    split_part(NEW.email, '@', 1)
  );
  v_avatar_url := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  -- ── 3. Resolve referrer UUID from text referral code ───────
  v_ref_code_raw := trim(upper(COALESCE(NEW.raw_user_meta_data->>'referral_code', '')));
  IF v_ref_code_raw <> '' THEN
    SELECT id INTO v_referrer_id
    FROM public.users
    WHERE referral_code = v_ref_code_raw
    LIMIT 1;
  END IF;

  -- ── 4. Upsert profile row ───────────────────────────────────
  INSERT INTO public.users (
    id, full_name, email, avatar_url, referral_code, referred_by
  )
  VALUES (
    NEW.id, v_full_name, NEW.email, v_avatar_url, v_referral_code, v_referrer_id
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name  = COALESCE(EXCLUDED.full_name,  public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url),
    email      = EXCLUDED.email;

  -- ── 5. Always create wallet ─────────────────────────────────
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;

-- ── 6. Single EXCEPTION block — multiple WHEN clauses ─────────
--    PL/pgSQL allows exactly ONE exception handler per BEGIN/END.
--    Multiple conditions must be listed as separate WHEN clauses.
EXCEPTION
  WHEN unique_violation THEN
    -- Email already exists in public.users under a different UUID
    -- (e.g. Google OAuth + email/password for same address).
    -- Ensure wallet exists for the new auth UUID and continue.
    BEGIN
      INSERT INTO public.wallets (user_id) VALUES (NEW.id)
      ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- wallet insert failure is non-fatal
    END;
    RAISE WARNING
      'handle_new_user: email conflict for %, new auth id=%, sqlerrm=%',
      NEW.email, NEW.id, SQLERRM;
    RETURN NEW;  -- ← CRITICAL: always return NEW

  WHEN OTHERS THEN
    -- Catch-all: never block user creation regardless of error
    RAISE WARNING
      'handle_new_user: unexpected error for user_id=%, sqlerrm=%, sqlstate=%',
      NEW.id, SQLERRM, SQLSTATE;
    RETURN NEW;  -- ← CRITICAL: always return NEW
END;
$$;

-- Recreate trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
