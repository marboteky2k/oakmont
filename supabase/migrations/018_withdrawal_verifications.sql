-- ================================================================
-- MIGRATION 018 — Withdrawal verification tokens
-- ================================================================
-- Links a one-time token to a pending withdrawal transaction.
-- Edge functions (send-withdrawal-verification / verify-withdrawal-token)
-- use service_role and are the ONLY way to interact with this table.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.withdrawal_verifications (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  withdrawal_id   UUID          NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id         UUID          NOT NULL REFERENCES public.users(id)        ON DELETE CASCADE,
  token           UUID          NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  amount          DECIMAL(20,8) NOT NULL,
  currency        TEXT          NOT NULL,
  crypto_address  TEXT          NOT NULL,
  network         TEXT,
  expires_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW() + INTERVAL '30 minutes',
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Fast token look-up for unused tokens
CREATE INDEX IF NOT EXISTS withdrawal_verif_token_idx
  ON public.withdrawal_verifications (token)
  WHERE verified_at IS NULL;

-- Rate-limit check per user
CREATE INDEX IF NOT EXISTS withdrawal_verif_user_idx
  ON public.withdrawal_verifications (user_id, created_at);

ALTER TABLE public.withdrawal_verifications ENABLE ROW LEVEL SECURITY;

-- Block all direct client access — only service_role (Edge Functions) can touch this table
CREATE POLICY "no_direct_user_access" ON public.withdrawal_verifications
  AS RESTRICTIVE FOR ALL USING (false);
