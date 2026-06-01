-- 021_support_tickets.sql
-- Support ticket table: stores tickets from the Support Center and Contact Us pages

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT        NOT NULL UNIQUE,   -- e.g. ORC-482910
  user_id       UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL,
  subject       TEXT,
  topic         TEXT,
  message       TEXT        NOT NULL,
  source        TEXT        NOT NULL DEFAULT 'support',  -- 'support' | 'contact'
  status        TEXT        NOT NULL DEFAULT 'open',     -- 'open' | 'in_progress' | 'resolved' | 'closed'
  reply         TEXT,
  replied_at    TIMESTAMPTZ,
  replied_by    UUID        REFERENCES public.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.touch_support_ticket()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_support_ticket ON public.support_tickets;
CREATE TRIGGER trg_touch_support_ticket
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.touch_support_ticket();

-- RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Users can read their own tickets (matched by email or user_id)
CREATE POLICY "users_read_own_tickets" ON public.support_tickets
  FOR SELECT USING (
    auth.uid() = user_id
    OR email = (SELECT email FROM public.users WHERE id = auth.uid())
  );

-- Admins can do everything
CREATE POLICY "admins_all_tickets" ON public.support_tickets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Index for admin dashboard
CREATE INDEX IF NOT EXISTS idx_support_tickets_status   ON public.support_tickets (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_email    ON public.support_tickets (email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id  ON public.support_tickets (user_id);
