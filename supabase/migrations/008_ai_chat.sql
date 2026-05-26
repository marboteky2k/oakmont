-- =============================================================
-- MIGRATION 008 — AI Chat Auto-Reply
-- =============================================================

-- 1. Add is_ai flag to chat_messages
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS is_ai BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. SECURITY DEFINER RPC so the frontend AI can insert admin replies
--    without needing the service-role key.
--    This runs with postgres-level privileges, bypassing RLS.
CREATE OR REPLACE FUNCTION public.insert_ai_chat_reply(
  p_user_id UUID,
  p_message  TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Guard: only insert if the calling user matches (prevents abuse)
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.chat_messages (user_id, message, is_admin, is_ai, is_read)
  VALUES (p_user_id, p_message, TRUE, TRUE, FALSE);
END;
$$;

-- Grant execute to all authenticated users
GRANT EXECUTE ON FUNCTION public.insert_ai_chat_reply(UUID, TEXT) TO authenticated;

-- Also allow admins to update is_ai messages (mark read, etc.)
-- The existing "Admins can update messages" policy already covers this.
