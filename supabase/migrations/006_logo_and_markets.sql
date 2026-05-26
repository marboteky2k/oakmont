-- =============================================================
-- MIGRATION 006 — Logo storage + markets_config site_setting
-- =============================================================

-- ── 1. Ensure avatars bucket exists (for logo uploads) ───────
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', TRUE)
ON CONFLICT (id) DO NOTHING;

-- ── 2. Allow super_admin to upload to logos/ path in avatars bucket ─
-- Drop and recreate to ensure idempotency
DROP POLICY IF EXISTS "Admins can upload logos" ON storage.objects;
CREATE POLICY "Admins can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND name LIKE 'logos/%'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  )
);

DROP POLICY IF EXISTS "Public can read logos" ON storage.objects;
CREATE POLICY "Public can read logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars' AND name LIKE 'logos/%');

DROP POLICY IF EXISTS "Admins can update logos" ON storage.objects;
CREATE POLICY "Admins can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND name LIKE 'logos/%'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
  )
);

-- ── 3. Seed markets_config into site_settings ────────────────
-- (admin panel will upsert this on first save; seed provides a default)
INSERT INTO public.site_settings (key, value, type, section)
VALUES (
  'markets_config',
  '[
    {"id":"c-btc","category":"crypto","symbol":"BTC/USDT","name":"Bitcoin","coingecko_id":"bitcoin","enabled":true,"sort_order":0},
    {"id":"c-eth","category":"crypto","symbol":"ETH/USDT","name":"Ethereum","coingecko_id":"ethereum","enabled":true,"sort_order":1},
    {"id":"c-bnb","category":"crypto","symbol":"BNB/USDT","name":"BNB","coingecko_id":"binancecoin","enabled":true,"sort_order":2},
    {"id":"c-sol","category":"crypto","symbol":"SOL/USDT","name":"Solana","coingecko_id":"solana","enabled":true,"sort_order":3},
    {"id":"c-xrp","category":"crypto","symbol":"XRP/USDT","name":"Ripple","coingecko_id":"ripple","enabled":true,"sort_order":4},
    {"id":"c-ada","category":"crypto","symbol":"ADA/USDT","name":"Cardano","coingecko_id":"cardano","enabled":true,"sort_order":5},
    {"id":"c-avax","category":"crypto","symbol":"AVAX/USDT","name":"Avalanche","coingecko_id":"avalanche-2","enabled":true,"sort_order":6},
    {"id":"c-doge","category":"crypto","symbol":"DOGE/USDT","name":"Dogecoin","coingecko_id":"dogecoin","enabled":false,"sort_order":7},
    {"id":"f-eurusd","category":"forex","symbol":"EUR/USD","name":"Euro / US Dollar","enabled":true,"sort_order":0},
    {"id":"f-gbpusd","category":"forex","symbol":"GBP/USD","name":"British Pound / US Dollar","enabled":true,"sort_order":1},
    {"id":"f-usdjpy","category":"forex","symbol":"USD/JPY","name":"US Dollar / Japanese Yen","enabled":true,"sort_order":2},
    {"id":"f-usdchf","category":"forex","symbol":"USD/CHF","name":"US Dollar / Swiss Franc","enabled":true,"sort_order":3},
    {"id":"co-xauusd","category":"commodity","symbol":"XAU/USD","name":"Gold / US Dollar","enabled":true,"sort_order":0},
    {"id":"co-wti","category":"commodity","symbol":"WTI/USD","name":"Crude Oil WTI","enabled":true,"sort_order":1}
  ]',
  'json',
  'trading'
)
ON CONFLICT (key) DO NOTHING;
