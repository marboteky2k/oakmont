-- =============================================================
-- MIGRATION 005 — Idempotent type guards + site_settings seed
-- =============================================================
-- Purpose:
--   1. Re-run safe: wrap every CREATE TYPE from migration 001
--      in a DO block so it silently skips if the type exists.
--   2. Seed site_settings with default JSON values for all
--      landing page sections (hero, stats_bar, testimonials,
--      faq, brand). Uses ON CONFLICT DO NOTHING so production
--      data is never overwritten.
-- =============================================================

-- ── 1. Idempotent ENUM guards ────────────────────────────────

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'copy_trader', 'investor');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE kyc_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE trading_style AS ENUM ('scalping', 'swing', 'day_trading', 'position');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'paused', 'stopped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE investment_status AS ENUM ('active', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal', 'profit', 'fee', 'transfer', 'copy_earning');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE transaction_status AS ENUM ('pending', 'confirmed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE currency_type AS ENUM ('USDT', 'BTC', 'ETH');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE trade_direction AS ENUM ('buy', 'sell');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE trade_status AS ENUM ('open', 'closed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('info', 'success', 'warning', 'danger');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE setting_type AS ENUM ('text', 'color', 'image', 'boolean', 'json');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE document_type AS ENUM ('passport', 'national_id', 'drivers_license');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE kyc_doc_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. Seed site_settings (landing page sections) ────────────

INSERT INTO public.site_settings (key, value, type, section) VALUES

-- ── Hero section ─────────────────────────────────────────────
('hero', $json${
  "headline": "Copy Expert Traders. Grow Your Wealth Automatically.",
  "subheadline": "Oakmont Ridge Capital connects you to verified top-performing forex traders. Mirror their strategies automatically and earn consistent returns — no experience needed.",
  "cta_primary": "Start Investing",
  "cta_secondary": "Explore Traders",
  "badge_text": "Live trading — 350+ expert traders active now",
  "trust_points": ["No experience needed", "Start from $100", "Withdraw anytime"],
  "stats": [
    {"label": "Total Users",        "value": 12500, "suffix": "+",  "prefix": ""},
    {"label": "Total Profit Paid",  "value": 50,    "suffix": "M+", "prefix": "$"},
    {"label": "Active Traders",     "value": 350,   "suffix": "+",  "prefix": ""},
    {"label": "Countries Supported","value": 80,    "suffix": "+",  "prefix": ""}
  ]
}$json$, 'json', 'landing'),

-- ── Stats bar section ─────────────────────────────────────────
('stats_bar', $json${
  "headline": "Trusted by thousands worldwide",
  "subheadline": "Our platform numbers reflect a growing community of investors who trust us with their financial future.",
  "stats": [
    {"label": "Total Volume Traded",  "value": 50,    "suffix": "M+", "prefix": "$"},
    {"label": "Active Investors",     "value": 12000, "suffix": "+",  "prefix": ""},
    {"label": "Satisfaction Rate",    "value": 98,    "suffix": "%",  "prefix": ""},
    {"label": "Support Availability", "value": 24,    "suffix": "/7", "prefix": ""}
  ]
}$json$, 'json', 'landing'),

-- ── Testimonials section ──────────────────────────────────────
('testimonials', $json${
  "items": [
    {"name": "Sarah Mitchell", "country": "United States", "flag": "🇺🇸", "initials": "SM", "color": "bg-blue-500",   "stars": 5, "quote": "I've been using Oakmont Ridge for 6 months and my portfolio has grown 43%. The copy trading feature is incredible — I barely do anything and the profits keep rolling in every single day."},
    {"name": "James Kamau",    "country": "United Kingdom","flag": "🇬🇧", "initials": "JK", "color": "bg-emerald-600","stars": 5, "quote": "Finally a platform I can trust. The KYC verification and 2FA security give me complete peace of mind. Customer support is always available and genuinely helpful. Highly recommended."},
    {"name": "Amara Diallo",   "country": "Nigeria",        "flag": "🇳🇬", "initials": "AD", "color": "bg-orange-500", "stars": 5, "quote": "The investment plans are transparent and returns are consistent month after month. I started with the Basic plan and already upgraded to Premium. Best investment decision I ever made."},
    {"name": "Carlos Reyes",   "country": "Mexico",         "flag": "🇲🇽", "initials": "CR", "color": "bg-red-500",    "stars": 5, "quote": "Excellent customer support. I had a question about a withdrawal and it was fully resolved within hours. The dashboard is intuitive and the performance metrics are crystal clear."},
    {"name": "Priya Nair",     "country": "India",          "flag": "🇮🇳", "initials": "PN", "color": "bg-purple-600", "stars": 5, "quote": "The UI is beautiful and easy to use. Even as a total beginner I felt confident from day one. Marcus Chen's signals have been outstanding — 91% win rate that actually delivers consistent results."},
    {"name": "David Laurent",  "country": "Canada",         "flag": "🇨🇦", "initials": "DL", "color": "bg-indigo-600", "stars": 5, "quote": "My copy trader has a 91% win rate and I'm genuinely earning while I sleep. Started with $1,000, now sitting at $1,380 after just 3 months. No other platform has come close to this."},
    {"name": "Anna Hoffmann",  "country": "Germany",        "flag": "🇩🇪", "initials": "AH", "color": "bg-teal-600",   "stars": 5, "quote": "The referral program is very generous. I've already earned commissions from referring 3 colleagues. The platform is professional, secure, and delivers on every promise it makes."},
    {"name": "Marcus Foster",  "country": "Australia",      "flag": "🇦🇺", "initials": "MF", "color": "bg-amber-600",  "stars": 5, "quote": "Best forex copy trading platform I've tried. Transparent performance history, verified track records, and complete transaction visibility. I recommend it to every investor I know."}
  ]
}$json$, 'json', 'landing'),

-- ── FAQ section ───────────────────────────────────────────────
('faq', $json${
  "headline": "Frequently asked questions",
  "subheadline": "Everything you need to know about Oakmont Ridge Capital.",
  "items": [
    {"q": "How do I deposit funds?",                          "a": "We accept USDT (TRC-20 and ERC-20), Bitcoin (BTC), and Ethereum (ETH). Navigate to your Wallet, select Deposit, choose your preferred crypto, and send to the generated address. Deposits are credited automatically after blockchain confirmation — typically 1–30 minutes."},
    {"q": "How long do withdrawals take?",                    "a": "Withdrawal requests are reviewed and processed within 24 hours on business days. Once approved, on-chain transaction time depends on network congestion — typically 10–60 minutes for BTC and 5–15 minutes for ETH/USDT."},
    {"q": "What is copy trading and how does it work?",       "a": "Copy trading automatically mirrors the trades of verified expert traders in your account. When a trader opens or closes a position, the same action is executed proportionally in your account based on your allocated balance. You profit when they profit."},
    {"q": "How much can I realistically earn?",               "a": "Returns vary by trader and plan. Our copy traders historically generate 10–25% monthly returns. Fixed investment plans offer guaranteed APY from 5% to 25%. Past performance is indicative but not guaranteed — all trading involves risk."},
    {"q": "Is KYC (identity verification) mandatory?",        "a": "KYC is required before making your first withdrawal. You submit a government-issued ID and a proof of address document. Verification is typically completed within 24 hours. Registration and depositing do not require KYC."},
    {"q": "How are my funds protected?",                      "a": "We use cold wallet storage for 95% of assets, multi-signature wallets requiring multiple approvals, 2FA on all accounts, 256-bit SSL encryption, and continuous security monitoring. User funds are held in segregated accounts completely separate from company funds."},
    {"q": "Can I copy multiple traders at once?",             "a": "Yes. You can copy multiple verified traders simultaneously and allocate different amounts to each. This diversification can help balance risk across different trading styles, instruments, and market conditions."},
    {"q": "What fees does Oakmont Ridge charge?",             "a": "We charge a 20% performance fee on profits generated through copy trading — you only pay when you profit. There are no deposit fees, subscription fees, or charges on fixed investment plans."},
    {"q": "How do I enable two-factor authentication (2FA)?", "a": "Go to Settings → Security → Two-Factor Authentication. Click \"Enable 2FA\", scan the QR code with Google Authenticator or Authy, then enter the 6-digit code to confirm. 2FA is required for all withdrawals and sensitive account actions."},
    {"q": "Which cryptocurrencies do you accept?",            "a": "We accept USDT on TRC-20 (Tron) and ERC-20 (Ethereum) networks, Bitcoin (BTC) on the native Bitcoin network, and Ethereum (ETH) on the Ethereum mainnet. More assets may be added in the future."},
    {"q": "How does the referral program work?",              "a": "Your unique referral link is in Settings → Referral Program. When someone registers with your link and makes their first deposit, you automatically receive a 5% commission credited directly to your wallet — no minimum threshold."},
    {"q": "What happens if a copy trader has losing trades?", "a": "Losses are proportionally reflected in your portfolio. This is precisely why we display complete performance history, max drawdown statistics, and risk ratings for every trader — so you can make fully informed decisions before copying anyone."}
  ]
}$json$, 'json', 'landing'),

-- ── Brand & contact ───────────────────────────────────────────
('brand', $json${
  "company_name":  "Oakmont Ridge Capital",
  "tagline":       "Professional forex copy trading and crypto investment platform. Grow your wealth with the world's best-verified traders.",
  "primary_color": "#1E40AF",
  "accent_color":  "#3B82F6",
  "support_email": "support@oakmontridge.com",
  "telegram_url":  "https://t.me/oakmontridge",
  "whatsapp_url":  "https://wa.me/1234567890"
}$json$, 'json', 'landing')

ON CONFLICT (key) DO NOTHING;
