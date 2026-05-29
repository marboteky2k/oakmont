-- ================================================================
-- MIGRATION 017 — Custom email verification + SL/TP on trades
-- ================================================================
-- 1. Adds email_verified flag to public.users (default FALSE).
--    Supabase auth still auto-confirms the account (migration 015)
--    so users can sign in, but email_verified tracks our custom
--    Resend verification step.
--
-- 2. Creates email_verifications table for secure token storage.
--
-- 3. Adds stop_loss / take_profit columns to user_trades.
-- ================================================================

-- ── 1. email_verified flag ────────────────────────────────────────
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 2. email_verifications table ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_verifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email      TEXT        NOT NULL,
  token      UUID        NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast token look-up (unused tokens only)
CREATE INDEX IF NOT EXISTS email_verif_token_idx
  ON public.email_verifications (token)
  WHERE used_at IS NULL;

-- Rate-limit check
CREATE INDEX IF NOT EXISTS email_verif_user_idx
  ON public.email_verifications (user_id, created_at);

ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

-- All direct user access is blocked; Edge Functions use service_role.
CREATE POLICY "no_direct_user_access" ON public.email_verifications
  AS RESTRICTIVE FOR ALL USING (false);

-- ── 3. SL / TP on user_trades ─────────────────────────────────────
ALTER TABLE public.user_trades
  ADD COLUMN IF NOT EXISTS stop_loss   DECIMAL(20, 8),
  ADD COLUMN IF NOT EXISTS take_profit DECIMAL(20, 8);
