-- =============================================================
-- MIGRATION 004 — Trader RLS policies & copy_trader self-management
-- =============================================================
-- Allows copy_trader role users to:
--   • Read their own subscriber copy_subscriptions
--   • Update and insert their own copy_traders profile row
-- =============================================================

-- copy_subscriptions: traders can see their own subscribers
DROP POLICY IF EXISTS "subs_select_own" ON public.copy_subscriptions;
CREATE POLICY "subs_select_own" ON public.copy_subscriptions
  FOR SELECT USING (
    investor_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.copy_traders ct
      WHERE ct.id = copy_subscriptions.trader_id
        AND ct.user_id = auth.uid()
    )
  );

-- copy_traders: traders can insert their own profile
DROP POLICY IF EXISTS "traders_insert_admin" ON public.copy_traders;
CREATE POLICY "traders_insert_admin" ON public.copy_traders
  FOR INSERT WITH CHECK (
    public.is_admin() OR user_id = auth.uid()
  );

-- copy_traders: traders can update their own profile
DROP POLICY IF EXISTS "traders_update_admin" ON public.copy_traders;
CREATE POLICY "traders_update_admin" ON public.copy_traders
  FOR UPDATE USING (
    public.is_admin() OR user_id = auth.uid()
  );

-- trader_performance: traders can insert/update their own records
DROP POLICY IF EXISTS "perf_insert_admin" ON public.trader_performance;
CREATE POLICY "perf_insert_admin" ON public.trader_performance
  FOR INSERT WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.copy_traders ct
      WHERE ct.id = trader_performance.trader_id
        AND ct.user_id = auth.uid()
    )
  );
