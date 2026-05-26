-- =============================================================
-- PHASE 2 — SECURITY ADDITIONS
-- =============================================================

-- Login attempt tracking (server-side rate limiting)
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email        TEXT NOT NULL,
  ip_address   TEXT,
  success      BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_login_attempts_email ON public.login_attempts(email, attempted_at);

-- RLS: only service role can read/write login attempts
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "login_attempts_service_only" ON public.login_attempts USING (FALSE);

-- Function: check if email is rate-limited (server-side)
CREATE OR REPLACE FUNCTION public.check_login_rate_limit(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_fail_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := NOW() - INTERVAL '15 minutes';

  SELECT COUNT(*) INTO v_fail_count
  FROM public.login_attempts
  WHERE email = p_email
    AND success = FALSE
    AND attempted_at > v_window_start;

  IF v_fail_count >= 5 THEN
    RETURN jsonb_build_object('locked', true, 'attempts', v_fail_count);
  END IF;

  RETURN jsonb_build_object('locked', false, 'attempts', v_fail_count, 'remaining', 5 - v_fail_count);
END;
$$;

-- Trigger: auto-sync Google OAuth users into public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_referral_code TEXT;
  v_full_name TEXT;
  v_avatar_url TEXT;
  v_ref_code TEXT;
  v_referrer_id UUID;
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

  -- Insert profile (idempotent)
  INSERT INTO public.users (id, full_name, email, avatar_url, referral_code)
  VALUES (NEW.id, v_full_name, NEW.email, v_avatar_url, v_referral_code)
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.users.avatar_url);

  -- Create wallet if not exists
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Ensure trigger exists (replace old one)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function: validate crypto address format (server-side)
CREATE OR REPLACE FUNCTION public.validate_crypto_address(
  p_address TEXT,
  p_currency TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql AS $$
BEGIN
  CASE upper(p_currency)
    WHEN 'BTC' THEN
      RETURN p_address ~ '^(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59})$';
    WHEN 'ETH' THEN
      RETURN p_address ~ '^0x[a-fA-F0-9]{40}$';
    WHEN 'USDT' THEN
      -- Accept both TRC-20 (T...) and ERC-20 (0x...)
      RETURN p_address ~ '^(T[a-km-zA-HJ-NP-Z1-9]{33}|0x[a-fA-F0-9]{40})$';
    ELSE
      RETURN length(p_address) >= 20;
  END CASE;
END;
$$;

-- Add address validation to withdrawal transactions
CREATE OR REPLACE FUNCTION public.validate_withdrawal_address()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.type = 'withdrawal' AND NEW.crypto_address IS NOT NULL THEN
    IF NOT public.validate_crypto_address(NEW.crypto_address, NEW.currency::TEXT) THEN
      RAISE EXCEPTION 'Invalid % wallet address', NEW.currency;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_withdrawal_address_trigger
  BEFORE INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.validate_withdrawal_address();

-- Audit log helper: called by edge functions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_id UUID,
  p_action TEXT,
  p_target_type TEXT,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.audit_logs (admin_id, action, target_type, target_id, details, ip_address)
  VALUES (p_admin_id, p_action, p_target_type, p_target_id, p_details, p_ip)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
