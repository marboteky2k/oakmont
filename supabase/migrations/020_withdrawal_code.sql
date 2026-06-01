-- ================================================================
-- MIGRATION 020 — Add 6-digit verification code to withdrawals
-- ================================================================
-- The withdrawal_verifications table previously only stored a UUID
-- token for link-based confirmation.  This migration adds a short
-- numeric code so users can confirm by typing the code in-app
-- rather than clicking a link.  Both methods remain valid.
-- ================================================================

ALTER TABLE public.withdrawal_verifications
  ADD COLUMN IF NOT EXISTS code TEXT;

-- Index for fast code look-up (per user, unused codes only)
CREATE INDEX IF NOT EXISTS wd_verif_code_idx
  ON public.withdrawal_verifications (user_id, code)
  WHERE verified_at IS NULL;
