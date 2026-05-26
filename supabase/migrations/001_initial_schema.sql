-- =============================================================
-- OAKMONT RIDGE CAPITAL — Initial Database Schema
-- =============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- ENUMS
-- =============================================================
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'copy_trader', 'investor');
CREATE TYPE kyc_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE trading_style AS ENUM ('scalping', 'swing', 'day_trading', 'position');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'stopped');
CREATE TYPE investment_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'profit', 'fee', 'transfer', 'copy_earning');
CREATE TYPE transaction_status AS ENUM ('pending', 'confirmed', 'failed', 'cancelled');
CREATE TYPE currency_type AS ENUM ('USDT', 'BTC', 'ETH');
CREATE TYPE trade_direction AS ENUM ('buy', 'sell');
CREATE TYPE trade_status AS ENUM ('open', 'closed', 'cancelled');
CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'danger');
CREATE TYPE setting_type AS ENUM ('text', 'color', 'image', 'boolean', 'json');
CREATE TYPE document_type AS ENUM ('passport', 'national_id', 'drivers_license');
CREATE TYPE kyc_doc_status AS ENUM ('pending', 'approved', 'rejected');

-- =============================================================
-- TABLES
-- =============================================================

-- users (extends auth.users)
CREATE TABLE public.users (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      TEXT NOT NULL DEFAULT '',
  email          TEXT UNIQUE NOT NULL,
  phone          TEXT,
  avatar_url     TEXT,
  role           user_role NOT NULL DEFAULT 'investor',
  kyc_status     kyc_status NOT NULL DEFAULT 'pending',
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  referral_code  TEXT UNIQUE,
  referred_by    UUID REFERENCES public.users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- wallets
CREATE TABLE public.wallets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  balance_usdt    NUMERIC(20,8) NOT NULL DEFAULT 0,
  balance_btc     NUMERIC(20,8) NOT NULL DEFAULT 0,
  balance_eth     NUMERIC(20,8) NOT NULL DEFAULT 0,
  total_profit    NUMERIC(20,8) NOT NULL DEFAULT 0,
  total_invested  NUMERIC(20,8) NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- copy_traders
CREATE TABLE public.copy_traders (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID REFERENCES public.users(id),
  display_name            TEXT NOT NULL,
  bio                     TEXT,
  avatar_url              TEXT,
  trading_style           trading_style NOT NULL DEFAULT 'swing',
  risk_level              risk_level NOT NULL DEFAULT 'medium',
  performance_fee         NUMERIC(5,2) NOT NULL DEFAULT 10,
  min_copy_amount         NUMERIC(20,2) NOT NULL DEFAULT 100,
  max_drawdown            NUMERIC(5,2) NOT NULL DEFAULT 20,
  win_rate                NUMERIC(5,2) NOT NULL DEFAULT 70,
  total_return_pct        NUMERIC(10,2) NOT NULL DEFAULT 0,
  monthly_return_pct      NUMERIC(10,2) NOT NULL DEFAULT 0,
  followers_count         INTEGER NOT NULL DEFAULT 0,
  assets_under_management NUMERIC(20,2) NOT NULL DEFAULT 0,
  is_verified             BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured             BOOLEAN NOT NULL DEFAULT FALSE,
  is_active               BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- trader_performance
CREATE TABLE public.trader_performance (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trader_id    UUID NOT NULL REFERENCES public.copy_traders(id) ON DELETE CASCADE,
  month        TEXT NOT NULL,
  return_pct   NUMERIC(10,2) NOT NULL DEFAULT 0,
  trades_count INTEGER NOT NULL DEFAULT 0,
  win_count    INTEGER NOT NULL DEFAULT 0,
  loss_count   INTEGER NOT NULL DEFAULT 0,
  profit_usd   NUMERIC(20,2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(trader_id, month)
);

-- copy_subscriptions
CREATE TABLE public.copy_subscriptions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  investor_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  trader_id        UUID NOT NULL REFERENCES public.copy_traders(id) ON DELETE CASCADE,
  allocated_amount NUMERIC(20,2) NOT NULL,
  current_value    NUMERIC(20,2) NOT NULL,
  profit_loss      NUMERIC(20,2) NOT NULL DEFAULT 0,
  status           subscription_status NOT NULL DEFAULT 'active',
  copy_ratio       NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stopped_at       TIMESTAMPTZ
);

-- investment_plans
CREATE TABLE public.investment_plans (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT,
  min_amount      NUMERIC(20,2) NOT NULL,
  max_amount      NUMERIC(20,2) NOT NULL,
  roi_percentage  NUMERIC(10,2) NOT NULL,
  period_days     INTEGER NOT NULL,
  risk_level      risk_level NOT NULL DEFAULT 'medium',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- investments
CREATE TABLE public.investments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_id         UUID NOT NULL REFERENCES public.investment_plans(id),
  amount          NUMERIC(20,2) NOT NULL,
  expected_return NUMERIC(20,2) NOT NULL,
  actual_return   NUMERIC(20,2) NOT NULL DEFAULT 0,
  status          investment_status NOT NULL DEFAULT 'active',
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  maturity_at     TIMESTAMPTZ NOT NULL
);

-- transactions
CREATE TABLE public.transactions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type           transaction_type NOT NULL,
  amount         NUMERIC(20,8) NOT NULL,
  currency       currency_type NOT NULL DEFAULT 'USDT',
  status         transaction_status NOT NULL DEFAULT 'pending',
  crypto_address TEXT,
  tx_hash        TEXT,
  network        TEXT,
  note           TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- trade_signals
CREATE TABLE public.trade_signals (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trader_id    UUID NOT NULL REFERENCES public.copy_traders(id) ON DELETE CASCADE,
  pair         TEXT NOT NULL,
  direction    trade_direction NOT NULL,
  entry_price  NUMERIC(20,8) NOT NULL,
  stop_loss    NUMERIC(20,8) NOT NULL,
  take_profit  NUMERIC(20,8) NOT NULL,
  lot_size     NUMERIC(20,8) NOT NULL,
  status       trade_status NOT NULL DEFAULT 'open',
  profit_pips  NUMERIC(20,4),
  profit_usd   NUMERIC(20,2),
  opened_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at    TIMESTAMPTZ
);

-- notifications
CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  type       notification_type NOT NULL DEFAULT 'info',
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- site_settings
CREATE TABLE public.site_settings (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key        TEXT UNIQUE NOT NULL,
  value      TEXT NOT NULL DEFAULT '',
  type       setting_type NOT NULL DEFAULT 'text',
  section    TEXT NOT NULL DEFAULT 'General',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- crypto_wallets
CREATE TABLE public.crypto_wallets (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  currency   currency_type NOT NULL,
  network    TEXT NOT NULL,
  address    TEXT NOT NULL,
  label      TEXT NOT NULL DEFAULT '',
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- kyc_documents
CREATE TABLE public.kyc_documents (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  document_type    document_type NOT NULL,
  front_url        TEXT,
  back_url         TEXT,
  selfie_url       TEXT,
  status           kyc_doc_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by      UUID REFERENCES public.users(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- audit_logs
CREATE TABLE public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id    UUID NOT NULL REFERENCES public.users(id),
  action      TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   UUID,
  details     JSONB,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
CREATE INDEX idx_copy_subscriptions_investor ON public.copy_subscriptions(investor_id);
CREATE INDEX idx_copy_subscriptions_trader ON public.copy_subscriptions(trader_id);
CREATE INDEX idx_investments_user ON public.investments(user_id);
CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_trade_signals_trader ON public.trade_signals(trader_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX idx_kyc_documents_user ON public.kyc_documents(user_id);
CREATE INDEX idx_audit_logs_admin ON public.audit_logs(admin_id);

-- =============================================================
-- TRIGGERS
-- =============================================================

-- Auto-create user profile & wallet on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_referral_code TEXT;
BEGIN
  v_referral_code := upper(substring(encode(gen_random_bytes(6), 'hex'), 1, 8));

  INSERT INTO public.users (id, full_name, email, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    v_referral_code
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update wallet updated_at
CREATE OR REPLACE FUNCTION public.update_wallet_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
CREATE TRIGGER wallet_updated_at BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_wallet_timestamp();

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
ALTER TABLE public.users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copy_traders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trader_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copy_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_signals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_wallets   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs       ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin/super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

-- USERS
CREATE POLICY "users_select_own"    ON public.users FOR SELECT USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "users_update_own"    ON public.users FOR UPDATE USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "users_insert_system" ON public.users FOR INSERT WITH CHECK (id = auth.uid());

-- WALLETS
CREATE POLICY "wallets_select_own" ON public.wallets FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "wallets_update_own" ON public.wallets FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "wallets_insert"     ON public.wallets FOR INSERT WITH CHECK (user_id = auth.uid());

-- COPY TRADERS (public read)
CREATE POLICY "traders_select_all"  ON public.copy_traders FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "traders_insert_admin" ON public.copy_traders FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "traders_update_admin" ON public.copy_traders FOR UPDATE USING (public.is_admin());
CREATE POLICY "traders_delete_admin" ON public.copy_traders FOR DELETE USING (public.is_admin());

-- TRADER PERFORMANCE (public read)
CREATE POLICY "perf_select_all" ON public.trader_performance FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "perf_insert_admin" ON public.trader_performance FOR INSERT WITH CHECK (public.is_admin());

-- COPY SUBSCRIPTIONS
CREATE POLICY "subs_select_own"   ON public.copy_subscriptions FOR SELECT USING (investor_id = auth.uid() OR public.is_admin());
CREATE POLICY "subs_insert_own"   ON public.copy_subscriptions FOR INSERT WITH CHECK (investor_id = auth.uid());
CREATE POLICY "subs_update_own"   ON public.copy_subscriptions FOR UPDATE USING (investor_id = auth.uid() OR public.is_admin());

-- INVESTMENT PLANS (public read)
CREATE POLICY "plans_select_all"  ON public.investment_plans FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "plans_insert_admin" ON public.investment_plans FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "plans_update_admin" ON public.investment_plans FOR UPDATE USING (public.is_admin());

-- INVESTMENTS
CREATE POLICY "inv_select_own"  ON public.investments FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "inv_insert_own"  ON public.investments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "inv_update_own"  ON public.investments FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

-- TRANSACTIONS
CREATE POLICY "tx_select_own"  ON public.transactions FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "tx_insert_own"  ON public.transactions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "tx_update_admin" ON public.transactions FOR UPDATE USING (public.is_admin());

-- TRADE SIGNALS (public read for authenticated)
CREATE POLICY "signals_select_all" ON public.trade_signals FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY "signals_insert"     ON public.trade_signals FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.copy_traders WHERE id = trader_id AND user_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "signals_update"     ON public.trade_signals FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.copy_traders WHERE id = trader_id AND user_id = auth.uid()) OR public.is_admin()
);

-- NOTIFICATIONS
CREATE POLICY "notif_select_own"  ON public.notifications FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "notif_update_own"  ON public.notifications FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "notif_insert"      ON public.notifications FOR INSERT WITH CHECK (TRUE);

-- SITE SETTINGS (public read, admin write)
CREATE POLICY "settings_select_public" ON public.site_settings FOR SELECT USING (TRUE);
CREATE POLICY "settings_write_admin"   ON public.site_settings FOR ALL USING (public.is_admin());

-- CRYPTO WALLETS (public read, admin write)
CREATE POLICY "crypto_wallets_select" ON public.crypto_wallets FOR SELECT USING (TRUE);
CREATE POLICY "crypto_wallets_admin"  ON public.crypto_wallets FOR ALL USING (public.is_admin());

-- KYC DOCUMENTS
CREATE POLICY "kyc_select_own"   ON public.kyc_documents FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "kyc_insert_own"   ON public.kyc_documents FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "kyc_update_admin" ON public.kyc_documents FOR UPDATE USING (public.is_admin());

-- AUDIT LOGS (admin only)
CREATE POLICY "audit_select_admin" ON public.audit_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "audit_insert"       ON public.audit_logs FOR INSERT WITH CHECK (public.is_admin());

-- =============================================================
-- STORAGE BUCKETS
-- =============================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc', 'kyc', FALSE);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', TRUE);

CREATE POLICY "kyc_upload_own" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'kyc' AND (storage.foldername(name))[1] = auth.uid()::TEXT);
CREATE POLICY "kyc_read_own" ON storage.objects FOR SELECT
  USING (bucket_id = 'kyc' AND ((storage.foldername(name))[1] = auth.uid()::TEXT OR public.is_admin()));
CREATE POLICY "avatars_public" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- =============================================================
-- SEED DEFAULT DATA
-- =============================================================

-- Default site settings
INSERT INTO public.site_settings (key, value, type, section) VALUES
  ('site_name',         'Oakmont Ridge Capital',      'text',    'Branding'),
  ('site_tagline',      'Grow Your Wealth with Experts', 'text', 'Branding'),
  ('primary_color',     '#1E40AF',                    'color',   'Branding'),
  ('secondary_color',   '#3B82F6',                    'color',   'Branding'),
  ('maintenance_mode',  'false',                      'boolean', 'System'),
  ('min_deposit',       '10',                          'text',   'Finance'),
  ('min_withdrawal',    '20',                          'text',   'Finance'),
  ('withdrawal_fee',    '1',                           'text',   'Finance'),
  ('referral_bonus_pct','5',                           'text',   'Finance');

-- Default investment plans
INSERT INTO public.investment_plans (name, description, min_amount, max_amount, roi_percentage, period_days, risk_level) VALUES
  ('Starter',  'Perfect for beginners. Low risk, steady returns over 30 days.', 100, 999, 5, 30, 'low'),
  ('Growth',   'Our most popular plan. Balanced returns over 60 days.',         1000, 9999, 12, 60, 'medium'),
  ('Premium',  'High yield plan for serious investors. 90-day commitment.',     10000, 100000, 22, 90, 'high'),
  ('Elite',    'Exclusive plan with maximum returns for large portfolios.',     50000, 500000, 35, 180, 'high');

-- Demo copy traders
INSERT INTO public.copy_traders (display_name, bio, trading_style, risk_level, performance_fee, min_copy_amount, max_drawdown, win_rate, total_return_pct, monthly_return_pct, followers_count, assets_under_management, is_verified, is_featured) VALUES
  ('Marcus Chen',    'Professional forex trader with 8 years experience specializing in swing trading major pairs.',        'swing',       'medium', 15, 200, 12, 91, 127.4, 8.4, 2340, 4800000, TRUE, TRUE),
  ('Elara Voss',     'Scalping expert focusing on EUR/USD and GBP/USD. Fast execution, consistent profits.',                'scalping',    'high',   12, 100, 18, 87, 89.2,  6.1, 1890, 3200000, TRUE, TRUE),
  ('James O''Brien', 'Day trader specializing in news events and technical breakouts on USD pairs.',                        'day_trading', 'medium', 10, 500, 15, 83, 74.8,  5.7, 1450, 2100000, TRUE, FALSE),
  ('Sophia Nakamura','Position trader with low drawdown strategy. Ideal for conservative investors.',                       'position',    'low',    8,  300, 8,  79, 56.3,  4.2, 980,  1500000, TRUE, FALSE),
  ('Ahmed Hassan',   'Gold and oil CFD specialist with Middle Eastern market insights and strong technical analysis.',      'day_trading', 'high',   18, 150, 22, 85, 203.7, 11.2, 3210, 6700000, TRUE, TRUE),
  ('Lena Müller',    'Conservative EUR trader focusing on risk management and capital preservation above all.',             'swing',       'low',    7,  500, 5,  88, 43.1,  3.5, 720,  980000,  TRUE, FALSE);
