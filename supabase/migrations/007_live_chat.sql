-- =============================================================
-- MIGRATION 007 — Live Chat / Support Messages
-- =============================================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message      TEXT NOT NULL,
  is_admin     BOOLEAN NOT NULL DEFAULT FALSE,  -- true = sent by admin/support
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  attachment_url TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast per-user queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id, created_at DESC);

-- RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can see their own messages only
CREATE POLICY "Users can see own messages"
ON public.chat_messages FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- Users can send their own messages
CREATE POLICY "Users can send messages"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND is_admin = FALSE);

-- Admins can send messages on behalf of any user (reply)
CREATE POLICY "Admins can reply"
ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (public.is_admin() AND is_admin = TRUE);

-- Admins can update (mark read)
CREATE POLICY "Admins can update messages"
ON public.chat_messages FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Users can update own messages (mark read)
CREATE POLICY "Users can mark own read"
ON public.chat_messages FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND is_admin = FALSE);

-- Enable realtime for live chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
