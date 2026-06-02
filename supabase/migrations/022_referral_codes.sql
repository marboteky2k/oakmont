-- 022_referral_codes.sql
-- 1. Add referral_earnings column to users
-- 2. Create referrals table
-- 3. Generate referral codes for all existing users
-- 4. Add trigger so new users always get a code

-- ── referral_earnings on users ─────────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS referral_earnings NUMERIC(20,8) NOT NULL DEFAULT 0;

-- ── Ensure referral_code is UNIQUE and NOT NULL (may already exist) ────────
DO $$
BEGIN
  -- Add UNIQUE constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_referral_code_key'
    AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_referral_code_key UNIQUE (referral_code);
  END IF;
END
$$;

-- ── Code generator function ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  chars  TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no O,0,I,1 (confusing chars)
  result TEXT := '';
  i      INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- ── Generate a unique code for every user who doesn't have one ──────────────
DO $$
DECLARE
  rec    RECORD;
  code   TEXT;
  tries  INT;
BEGIN
  FOR rec IN SELECT id FROM public.users WHERE referral_code IS NULL OR referral_code = '' LOOP
    tries := 0;
    LOOP
      code  := public.generate_referral_code();
      tries := tries + 1;
      EXIT WHEN tries > 100
             OR NOT EXISTS (SELECT 1 FROM public.users WHERE referral_code = code);
    END LOOP;
    UPDATE public.users SET referral_code = code WHERE id = rec.id;
  END LOOP;
END;
$$;

-- ── Trigger: auto-assign a code when a new user is inserted ────────────────
CREATE OR REPLACE FUNCTION public.assign_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  code  TEXT;
  tries INT := 0;
BEGIN
  IF NEW.referral_code IS NULL OR NEW.referral_code = '' THEN
    LOOP
      code  := public.generate_referral_code();
      tries := tries + 1;
      EXIT WHEN tries > 100
             OR NOT EXISTS (SELECT 1 FROM public.users WHERE referral_code = code);
    END LOOP;
    NEW.referral_code := code;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_referral_code ON public.users;
CREATE TRIGGER trg_assign_referral_code
  BEFORE INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_referral_code();

-- ── referrals table (tracks who referred whom + commission) ───────────────
CREATE TABLE IF NOT EXISTS public.referrals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  commission_rate NUMERIC     NOT NULL DEFAULT 0.05,  -- 5%
  commission_paid NUMERIC(20,8) NOT NULL DEFAULT 0,
  deposit_total   NUMERIC(20,8) NOT NULL DEFAULT 0,
  status          TEXT        NOT NULL DEFAULT 'active', -- active | inactive
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (referrer_id, referred_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "admins_all_referrals" ON public.referrals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','super_admin'))
  );

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals (referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals (referred_id);

-- ── Back-fill referrals table from existing referred_by links ──────────────
INSERT INTO public.referrals (referrer_id, referred_id)
SELECT
  u2.id AS referrer_id,
  u1.id AS referred_id
FROM public.users u1
JOIN public.users u2 ON u1.referred_by = u2.id
ON CONFLICT (referrer_id, referred_id) DO NOTHING;
