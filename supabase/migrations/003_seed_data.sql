-- ============================================================
-- PHASE 8 — REALISTIC SEED DATA FOR OAKMONT RIDGE CAPITAL
-- ============================================================
-- All test accounts: password = Password123!
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Safe to re-run: all inserts use ON CONFLICT DO NOTHING
-- ============================================================

BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- STEP 1: AUTH USERS  (50 users — 1 super_admin, 2 admins,
--         16 copy_traders, 31 investors)
-- ============================================================

DO $$
DECLARE _pw TEXT;
BEGIN
  _pw := crypt('Password123!', gen_salt('bf', 8));

  INSERT INTO auth.users (
    id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, is_sso_user
  ) VALUES
  -- ===================== ADMINS (3) =====================
  ('a0000001-0000-4000-0000-000000000001','authenticated','authenticated',
   'robert.oakmont@oakmontridge.com', _pw, NOW()-'365 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Robert Oakmont"}',
   NOW()-'365 days'::interval, NOW(), false),
  ('a0000001-0000-4000-0000-000000000002','authenticated','authenticated',
   'sarah.mitchell@oakmontridge.com', _pw, NOW()-'300 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Sarah Mitchell"}',
   NOW()-'300 days'::interval, NOW(), false),
  ('a0000001-0000-4000-0000-000000000003','authenticated','authenticated',
   'james.chen@oakmontridge.com', _pw, NOW()-'280 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"James Chen"}',
   NOW()-'280 days'::interval, NOW(), false),

  -- ===================== COPY TRADERS (16) ==============
  ('a0000002-0000-4000-0000-000000000001','authenticated','authenticated',
   'alex.rivera@traders.com', _pw, NOW()-'240 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Alex Rivera"}',
   NOW()-'240 days'::interval, NOW(), false),
  ('a0000002-0000-4000-0000-000000000002','authenticated','authenticated',
   'marcus.king@traders.com', _pw, NOW()-'230 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Marcus King"}',
   NOW()-'230 days'::interval, NOW(), false),
  ('a0000002-0000-4000-0000-000000000003','authenticated','authenticated',
   'chen.wei@traders.com', _pw, NOW()-'220 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Chen Wei"}',
   NOW()-'220 days'::interval, NOW(), false),
  ('a0000002-0000-4000-0000-000000000004','authenticated','authenticated',
   'dmitri.volkov@traders.com', _pw, NOW()-'210 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Dmitri Volkov"}',
   NOW()-'210 days'::interval, NOW(), false),
  ('a0000002-0000-4000-0000-000000000005','authenticated','authenticated',
   'james.harrison@traders.com', _pw, NOW()-'200 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"James Harrison"}',
   NOW()-'200 days'::interval, NOW(), false),
  ('a0000002-0000-4000-0000-000000000006','authenticated','authenticated',
   'sofia.andreescu@traders.com', _pw, NOW()-'195 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Sofia Andreescu"}',
   NOW()-'195 days'::interval, NOW(), false),
  ('a0000002-0000-4000-0000-000000000007','authenticated','authenticated',
   'raj.patel@traders.com', _pw, NOW()-'190 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Raj Patel"}',
   NOW()-'190 days'::interval, NOW(), false),
  ('a0000002-0000-4000-0000-000000000008','authenticated','authenticated',
   'sarah.nakamura@traders.com', _pw, NOW()-'185 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Sarah Nakamura"}',
   NOW()-'185 days'::interval, NOW(), false),
  ('a0000002-0000-4000-0000-000000000009','authenticated','authenticated',
   'carlos.mendoza@traders.com', _pw, NOW()-'180 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Carlos Mendoza"}',
   NOW()-'180 days'::interval, NOW(), false),
  ('a0000002-0000-4000-0000-000000000010','authenticated','authenticated',
   'emma.laurent@traders.com', _pw, NOW()-'175 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Emma Laurent"}',
   NOW()-'175 days'::interval, NOW(), false),
  ('a0000002-0000-4000-0000-000000000011','authenticated','authenticated',
   'viktor.petrov@traders.com', _pw, NOW()-'170 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Viktor Petrov"}',
   NOW()-'170 days'::interval, NOW(), false),
  ('a0000002-0000-4000-0000-000000000012','authenticated','authenticated',
   'alice.wong@traders.com', _pw, NOW()-'165 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Alice Wong"}',
   NOW()-'165 days'::interval, NOW(), false),
  ('a0000002-0000-4000-0000-000000000013','authenticated','authenticated',
   'david.reynolds@traders.com', _pw, NOW()-'160 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"David Reynolds"}',
   NOW()-'160 days'::interval, NOW(), false),
  ('a0000002-0000-4000-0000-000000000014','authenticated','authenticated',
   'khalid.alsaud@traders.com', _pw, NOW()-'155 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Khalid Al-Saud"}',
   NOW()-'155 days'::interval, NOW(), false),
  ('a0000002-0000-4000-0000-000000000015','authenticated','authenticated',
   'margaret.henderson@traders.com', _pw, NOW()-'150 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Margaret Henderson"}',
   NOW()-'150 days'::interval, NOW(), false),
  ('a0000002-0000-4000-0000-000000000016','authenticated','authenticated',
   'omar.shaikh@traders.com', _pw, NOW()-'145 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Omar Shaikh"}',
   NOW()-'145 days'::interval, NOW(), false),

  -- ===================== INVESTORS (31) =================
  ('a0000003-0000-4000-0000-000000000001','authenticated','authenticated',
   'james.wilson@gmail.com', _pw, NOW()-'120 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"James Wilson"}',
   NOW()-'120 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000002','authenticated','authenticated',
   'emma.thompson@gmail.com', _pw, NOW()-'115 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Emma Thompson"}',
   NOW()-'115 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000003','authenticated','authenticated',
   'oliver.smith@gmail.com', _pw, NOW()-'110 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Oliver Smith"}',
   NOW()-'110 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000004','authenticated','authenticated',
   'sophia.brown@gmail.com', _pw, NOW()-'105 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Sophia Brown"}',
   NOW()-'105 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000005','authenticated','authenticated',
   'harry.davies@gmail.com', _pw, NOW()-'100 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Harry Davies"}',
   NOW()-'100 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000006','authenticated','authenticated',
   'charlotte.jones@yahoo.com', _pw, NOW()-'95 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Charlotte Jones"}',
   NOW()-'95 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000007','authenticated','authenticated',
   'jack.taylor@gmail.com', _pw, NOW()-'90 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Jack Taylor"}',
   NOW()-'90 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000008','authenticated','authenticated',
   'isabella.evans@gmail.com', _pw, NOW()-'85 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Isabella Evans"}',
   NOW()-'85 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000009','authenticated','authenticated',
   'george.harris@outlook.com', _pw, NOW()-'80 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"George Harris"}',
   NOW()-'80 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000010','authenticated','authenticated',
   'lily.williams@gmail.com', _pw, NOW()-'75 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Lily Williams"}',
   NOW()-'75 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000011','authenticated','authenticated',
   'michael.johnson@gmail.com', _pw, NOW()-'70 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Michael Johnson"}',
   NOW()-'70 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000012','authenticated','authenticated',
   'emma.davis@gmail.com', _pw, NOW()-'65 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Emma Davis"}',
   NOW()-'65 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000013','authenticated','authenticated',
   'chris.martinez@yahoo.com', _pw, NOW()-'60 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Christopher Martinez"}',
   NOW()-'60 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000014','authenticated','authenticated',
   'olivia.anderson@gmail.com', _pw, NOW()-'55 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Olivia Anderson"}',
   NOW()-'55 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000015','authenticated','authenticated',
   'matt.thompson@gmail.com', _pw, NOW()-'50 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Matthew Thompson"}',
   NOW()-'50 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000016','authenticated','authenticated',
   'ahmed.alrashid@gmail.com', _pw, NOW()-'45 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Ahmed Al-Rashid"}',
   NOW()-'45 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000017','authenticated','authenticated',
   'fatima.almansoori@gmail.com', _pw, NOW()-'42 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Fatima Al-Mansoori"}',
   NOW()-'42 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000018','authenticated','authenticated',
   'mohammed.alhamdan@gmail.com', _pw, NOW()-'38 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Mohammed Al-Hamdan"}',
   NOW()-'38 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000019','authenticated','authenticated',
   'aisha.abdullah@outlook.com', _pw, NOW()-'35 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Aisha Abdullah"}',
   NOW()-'35 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000020','authenticated','authenticated',
   'klaus.fischer@gmail.com', _pw, NOW()-'32 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Klaus Fischer"}',
   NOW()-'32 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000021','authenticated','authenticated',
   'ingrid.mueller@web.de', _pw, NOW()-'30 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Ingrid Müller"}',
   NOW()-'30 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000022','authenticated','authenticated',
   'hans.schmidt@gmx.de', _pw, NOW()-'28 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Hans Schmidt"}',
   NOW()-'28 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000023','authenticated','authenticated',
   'pierre.dubois@gmail.com', _pw, NOW()-'25 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Pierre Dubois"}',
   NOW()-'25 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000024','authenticated','authenticated',
   'luca.rossi@gmail.com', _pw, NOW()-'22 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Luca Rossi"}',
   NOW()-'22 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000025','authenticated','authenticated',
   'carlos.santos@gmail.com', _pw, NOW()-'20 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Carlos Santos"}',
   NOW()-'20 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000026','authenticated','authenticated',
   'nina.berg@gmail.com', _pw, NOW()-'18 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Nina Berg"}',
   NOW()-'18 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000027','authenticated','authenticated',
   'thomas.white@gmail.com', _pw, NOW()-'15 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Thomas White"}',
   NOW()-'15 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000028','authenticated','authenticated',
   'anna.kowalski@gmail.com', _pw, NOW()-'12 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Anna Kowalski"}',
   NOW()-'12 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000029','authenticated','authenticated',
   'ryan.murphy@gmail.com', _pw, NOW()-'9 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Ryan Murphy"}',
   NOW()-'9 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000030','authenticated','authenticated',
   'yuki.tanaka@gmail.com', _pw, NOW()-'6 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Yuki Tanaka"}',
   NOW()-'6 days'::interval, NOW(), false),
  ('a0000003-0000-4000-0000-000000000031','authenticated','authenticated',
   'amara.diallo@gmail.com', _pw, NOW()-'3 days'::interval,
   '{"provider":"email","providers":["email"]}','{"full_name":"Amara Diallo"}',
   NOW()-'3 days'::interval, NOW(), false)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ============================================================
-- STEP 2: UPDATE public.users — set roles, country, kyc_status
-- (The trigger already inserted basic rows; we override them)
-- ============================================================

-- Super admin
UPDATE public.users SET
  role = 'super_admin', country = 'GB', kyc_status = 'approved',
  is_active = TRUE, phone = '+44 7700 900001',
  full_name = 'Robert Oakmont', email = 'robert.oakmont@oakmontridge.com'
WHERE id = 'a0000001-0000-4000-0000-000000000001';

-- Admins
UPDATE public.users SET
  role = 'admin', country = 'GB', kyc_status = 'approved', is_active = TRUE,
  full_name = 'Sarah Mitchell', email = 'sarah.mitchell@oakmontridge.com'
WHERE id = 'a0000001-0000-4000-0000-000000000002';

UPDATE public.users SET
  role = 'admin', country = 'US', kyc_status = 'approved', is_active = TRUE,
  full_name = 'James Chen', email = 'james.chen@oakmontridge.com'
WHERE id = 'a0000001-0000-4000-0000-000000000003';

-- Copy Traders
UPDATE public.users SET role = 'copy_trader', country = 'US', kyc_status = 'approved', is_active = TRUE
WHERE id = 'a0000002-0000-4000-0000-000000000001';
UPDATE public.users SET role = 'copy_trader', country = 'GB', kyc_status = 'approved', is_active = TRUE
WHERE id = 'a0000002-0000-4000-0000-000000000002';
UPDATE public.users SET role = 'copy_trader', country = 'SG', kyc_status = 'approved', is_active = TRUE
WHERE id = 'a0000002-0000-4000-0000-000000000003';
UPDATE public.users SET role = 'copy_trader', country = 'DE', kyc_status = 'approved', is_active = TRUE
WHERE id = 'a0000002-0000-4000-0000-000000000004';
UPDATE public.users SET role = 'copy_trader', country = 'GB', kyc_status = 'approved', is_active = TRUE
WHERE id = 'a0000002-0000-4000-0000-000000000005';
UPDATE public.users SET role = 'copy_trader', country = 'RO', kyc_status = 'approved', is_active = TRUE
WHERE id = 'a0000002-0000-4000-0000-000000000006';
UPDATE public.users SET role = 'copy_trader', country = 'AE', kyc_status = 'approved', is_active = TRUE
WHERE id = 'a0000002-0000-4000-0000-000000000007';
UPDATE public.users SET role = 'copy_trader', country = 'JP', kyc_status = 'approved', is_active = TRUE
WHERE id = 'a0000002-0000-4000-0000-000000000008';
UPDATE public.users SET role = 'copy_trader', country = 'ES', kyc_status = 'approved', is_active = TRUE
WHERE id = 'a0000002-0000-4000-0000-000000000009';
UPDATE public.users SET role = 'copy_trader', country = 'FR', kyc_status = 'approved', is_active = TRUE
WHERE id = 'a0000002-0000-4000-0000-000000000010';
UPDATE public.users SET role = 'copy_trader', country = 'UA', kyc_status = 'approved', is_active = TRUE
WHERE id = 'a0000002-0000-4000-0000-000000000011';
UPDATE public.users SET role = 'copy_trader', country = 'SG', kyc_status = 'approved', is_active = TRUE
WHERE id = 'a0000002-0000-4000-0000-000000000012';
UPDATE public.users SET role = 'copy_trader', country = 'US', kyc_status = 'approved', is_active = TRUE
WHERE id = 'a0000002-0000-4000-0000-000000000013';
UPDATE public.users SET role = 'copy_trader', country = 'AE', kyc_status = 'approved', is_active = TRUE
WHERE id = 'a0000002-0000-4000-0000-000000000014';
UPDATE public.users SET role = 'copy_trader', country = 'GB', kyc_status = 'approved', is_active = TRUE
WHERE id = 'a0000002-0000-4000-0000-000000000015';
UPDATE public.users SET role = 'copy_trader', country = 'AE', kyc_status = 'approved', is_active = TRUE
WHERE id = 'a0000002-0000-4000-0000-000000000016';

-- Investors: mix of countries and KYC statuses
UPDATE public.users SET role='investor', country='GB', kyc_status='approved',  is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000001';
UPDATE public.users SET role='investor', country='GB', kyc_status='approved',  is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000002';
UPDATE public.users SET role='investor', country='GB', kyc_status='pending',   is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000003';
UPDATE public.users SET role='investor', country='GB', kyc_status='approved',  is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000004';
UPDATE public.users SET role='investor', country='GB', kyc_status='approved',  is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000005';
UPDATE public.users SET role='investor', country='GB', kyc_status='not_submitted', is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000006';
UPDATE public.users SET role='investor', country='GB', kyc_status='approved',  is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000007';
UPDATE public.users SET role='investor', country='GB', kyc_status='approved',  is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000008';
UPDATE public.users SET role='investor', country='GB', kyc_status='rejected',  is_active=FALSE WHERE id='a0000003-0000-4000-0000-000000000009';
UPDATE public.users SET role='investor', country='GB', kyc_status='pending',   is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000010';
UPDATE public.users SET role='investor', country='US', kyc_status='approved',  is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000011';
UPDATE public.users SET role='investor', country='US', kyc_status='approved',  is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000012';
UPDATE public.users SET role='investor', country='US', kyc_status='approved',  is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000013';
UPDATE public.users SET role='investor', country='US', kyc_status='pending',   is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000014';
UPDATE public.users SET role='investor', country='US', kyc_status='approved',  is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000015';
UPDATE public.users SET role='investor', country='AE', kyc_status='approved',  is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000016';
UPDATE public.users SET role='investor', country='AE', kyc_status='approved',  is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000017';
UPDATE public.users SET role='investor', country='AE', kyc_status='pending',   is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000018';
UPDATE public.users SET role='investor', country='AE', kyc_status='approved',  is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000019';
UPDATE public.users SET role='investor', country='DE', kyc_status='approved',  is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000020';
UPDATE public.users SET role='investor', country='DE', kyc_status='approved',  is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000021';
UPDATE public.users SET role='investor', country='DE', kyc_status='not_submitted', is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000022';
UPDATE public.users SET role='investor', country='FR', kyc_status='approved',  is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000023';
UPDATE public.users SET role='investor', country='IT', kyc_status='approved',  is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000024';
UPDATE public.users SET role='investor', country='ES', kyc_status='pending',   is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000025';
UPDATE public.users SET role='investor', country='NO', kyc_status='approved',  is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000026';
UPDATE public.users SET role='investor', country='US', kyc_status='approved',  is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000027';
UPDATE public.users SET role='investor', country='PL', kyc_status='pending',   is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000028';
UPDATE public.users SET role='investor', country='IE', kyc_status='approved',  is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000029';
UPDATE public.users SET role='investor', country='JP', kyc_status='approved',  is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000030';
UPDATE public.users SET role='investor', country='SN', kyc_status='not_submitted', is_active=TRUE WHERE id='a0000003-0000-4000-0000-000000000031';

-- ============================================================
-- STEP 3: UPDATE INVESTMENT PLANS (ensure correct values)
-- ============================================================

INSERT INTO public.investment_plans (id, name, description, min_amount, max_amount,
  roi_percent, duration_days, risk_level, is_active, features)
VALUES
  ('c0000001-0000-4000-0000-000000000001',
   'Basic Plan', 'Perfect for beginners. Low-risk, steady returns.', 100, 999,
   5.00, 30, 'low', TRUE,
   '["Dedicated support","Daily profit updates","Withdraw anytime"]'),
  ('c0000001-0000-4000-0000-000000000002',
   'Standard Plan', 'Balanced returns with medium risk exposure.', 1000, 4999,
   15.00, 30, 'medium', TRUE,
   '["Priority support","Real-time dashboard","Compound interest option","Weekly reports"]'),
  ('c0000001-0000-4000-0000-000000000003',
   'Premium Plan', 'High-yield plan for serious investors.', 10000, 49999,
   22.00, 30, 'high', TRUE,
   '["VIP account manager","Advanced analytics","Priority withdrawals","Monthly strategy call"]'),
  ('c0000001-0000-4000-0000-000000000004',
   'VIP Plan', 'Exclusive plan for elite investors. Maximum returns.', 50000, 10000000,
   30.00, 30, 'high', TRUE,
   '["Dedicated account manager 24/7","Institutional-grade tools","Same-day withdrawals","Quarterly review","Private signals group"]')
ON CONFLICT (id) DO UPDATE SET
  name        = EXCLUDED.name,
  roi_percent = EXCLUDED.roi_percent,
  min_amount  = EXCLUDED.min_amount,
  max_amount  = EXCLUDED.max_amount,
  duration_days = EXCLUDED.duration_days,
  risk_level  = EXCLUDED.risk_level,
  features    = EXCLUDED.features;

-- ============================================================
-- STEP 4: 16 COPY TRADERS
-- ============================================================

INSERT INTO public.copy_traders (
  id, user_id, display_name, bio, trading_style, risk_level,
  win_rate, total_return_pct, monthly_return_pct, max_drawdown_pct,
  followers_count, total_trades, min_copy_amount, is_verified, is_active, joined_at
) VALUES
  -- 1
  ('b0000001-0000-4000-0000-000000000001',
   'a0000002-0000-4000-0000-000000000001',
   'AlphaFX Pro',
   'Professional forex trader with 8+ years on Tier-1 brokers. Specialising in EUR/USD and GBP/USD using proprietary trend-following algorithms.',
   'trend_following', 'low', 78.0, 148.8, 12.4, 4.2,
   324, 1840, 500.00, TRUE, TRUE, NOW()-'240 days'::interval),
  -- 2
  ('b0000001-0000-4000-0000-000000000002',
   'a0000002-0000-4000-0000-000000000002',
   'Scalp King',
   'High-frequency scalper targeting 20–50 pip moves on major pairs. Not for the faint-hearted — high risk, high reward.',
   'scalping', 'high', 65.0, 226.8, 18.9, 12.6,
   189, 4210, 250.00, TRUE, TRUE, NOW()-'230 days'::interval),
  -- 3
  ('b0000001-0000-4000-0000-000000000003',
   'a0000002-0000-4000-0000-000000000003',
   'GoldStar Trader',
   'Conservative gold and FX specialist. Focus on capital preservation. Ideal for risk-averse investors seeking steady compounding.',
   'swing', 'low', 82.0, 98.4, 8.2, 2.8,
   512, 920, 1000.00, TRUE, TRUE, NOW()-'220 days'::interval),
  -- 4
  ('b0000001-0000-4000-0000-000000000004',
   'a0000002-0000-4000-0000-000000000004',
   'CryptoForex Master',
   'Hybrid strategy across crypto and FX markets. Leveraging cross-asset correlations to capture alpha in volatile conditions.',
   'day_trading', 'medium', 71.0, 181.2, 15.1, 8.4,
   276, 2150, 500.00, TRUE, TRUE, NOW()-'210 days'::interval),
  -- 5
  ('b0000001-0000-4000-0000-000000000005',
   'a0000002-0000-4000-0000-000000000005',
   'Pip Hunter',
   'Day trader targeting clean technical setups. EUR/USD, GBP/JPY and USD/JPY. Consistent 11% monthly returns over 18 months.',
   'day_trading', 'medium', 69.0, 135.6, 11.3, 6.1,
   198, 1620, 300.00, TRUE, TRUE, NOW()-'200 days'::interval),
  -- 6
  ('b0000001-0000-4000-0000-000000000006',
   'a0000002-0000-4000-0000-000000000006',
   'SwingElite',
   'Multi-timeframe swing trader. 2–5 day hold times. Low trade frequency, high accuracy. Ideal for hands-off investors.',
   'swing', 'low', 85.0, 116.4, 9.7, 3.1,
   441, 680, 750.00, TRUE, TRUE, NOW()-'195 days'::interval),
  -- 7
  ('b0000001-0000-4000-0000-000000000007',
   'a0000002-0000-4000-0000-000000000007',
   'VolatilityKing',
   'Volatility breakout specialist. Trades news events and liquidity sweeps. Aggressive risk management. For high-risk investors only.',
   'scalping', 'high', 58.0, 270.0, 22.5, 18.2,
   143, 3890, 200.00, FALSE, TRUE, NOW()-'190 days'::interval),
  -- 8
  ('b0000001-0000-4000-0000-000000000008',
   'a0000002-0000-4000-0000-000000000008',
   'SteadyGains FX',
   'Ultra-conservative long-term swing trader. 90%+ win rate maintained over 2 years. Protecting capital is the #1 priority.',
   'swing', 'low', 90.0, 73.2, 6.1, 1.4,
   628, 540, 2000.00, TRUE, TRUE, NOW()-'185 days'::interval),
  -- 9
  ('b0000001-0000-4000-0000-000000000009',
   'a0000002-0000-4000-0000-000000000009',
   'FXNinja',
   'Asian session specialist. JPY pairs and AUD/USD. Precision entries using order flow analysis and market microstructure.',
   'day_trading', 'medium', 73.0, 170.4, 14.2, 7.3,
   215, 1750, 400.00, TRUE, TRUE, NOW()-'180 days'::interval),
  -- 10
  ('b0000001-0000-4000-0000-000000000010',
   'a0000002-0000-4000-0000-000000000010',
   'TrendMaster',
   'Pure trend follower using moving average confluence and momentum indicators. Patient trader — waits for perfect setups.',
   'trend_following', 'low', 80.0, 129.6, 10.8, 5.0,
   367, 890, 600.00, TRUE, TRUE, NOW()-'175 days'::interval),
  -- 11
  ('b0000001-0000-4000-0000-000000000011',
   'a0000002-0000-4000-0000-000000000011',
   'BlazeFX',
   'High-octane short-term trader. Targets crypto volatility and NFP releases. Maximum return potential with elevated risk.',
   'scalping', 'high', 62.0, 241.2, 20.1, 15.7,
   167, 3240, 150.00, FALSE, TRUE, NOW()-'170 days'::interval),
  -- 12
  ('b0000001-0000-4000-0000-000000000012',
   'a0000002-0000-4000-0000-000000000012',
   'PrecisionPips',
   'Institutional-level risk management. Maximum 1% risk per trade. Conservative compounding strategy trusted by 600+ followers.',
   'swing', 'low', 88.0, 88.8, 7.4, 1.9,
   604, 720, 1500.00, TRUE, TRUE, NOW()-'165 days'::interval),
  -- 13
  ('b0000001-0000-4000-0000-000000000013',
   'a0000002-0000-4000-0000-000000000013',
   'MomentumTrader',
   'Momentum-based medium-term trader. Rides strong directional moves. Consistent mid-tier returns with controlled drawdowns.',
   'trend_following', 'medium', 75.0, 162.0, 13.5, 6.8,
   251, 1280, 350.00, TRUE, TRUE, NOW()-'160 days'::interval),
  -- 14
  ('b0000001-0000-4000-0000-000000000014',
   'a0000002-0000-4000-0000-000000000014',
   'NightScalper',
   'London close and Tokyo open specialist. Low-spread pairs only. 17%+ monthly returns with a tight stop strategy.',
   'scalping', 'high', 67.0, 213.6, 17.8, 11.3,
   134, 2980, 200.00, FALSE, TRUE, NOW()-'155 days'::interval),
  -- 15
  ('b0000001-0000-4000-0000-000000000015',
   'a0000002-0000-4000-0000-000000000015',
   'ConservativeFX',
   'For investors who sleep soundly. 92% win rate. Never exceeded 2% drawdown. Ideal for pension and retirement capital.',
   'swing', 'low', 92.0, 62.4, 5.2, 1.1,
   712, 460, 5000.00, TRUE, TRUE, NOW()-'150 days'::interval),
  -- 16
  ('b0000001-0000-4000-0000-000000000016',
   'a0000002-0000-4000-0000-000000000016',
   'ForexPhoenix',
   'Comeback specialist — thrives in volatile markets. Event-driven trading around central bank decisions and major economic data.',
   'day_trading', 'medium', 76.0, 195.6, 16.3, 9.1,
   293, 1920, 400.00, TRUE, TRUE, NOW()-'145 days'::interval)
ON CONFLICT (id) DO UPDATE SET
  display_name       = EXCLUDED.display_name,
  win_rate           = EXCLUDED.win_rate,
  monthly_return_pct = EXCLUDED.monthly_return_pct,
  total_return_pct   = EXCLUDED.total_return_pct,
  is_active          = EXCLUDED.is_active;

-- ============================================================
-- STEP 5: TRADER PERFORMANCE HISTORY (12 months each)
-- Months: 2025-06 → 2026-05
-- ============================================================

DO $$
DECLARE
  months TEXT[] := ARRAY[
    '2025-06','2025-07','2025-08','2025-09','2025-10','2025-11',
    '2026-01','2026-02','2026-03','2026-04','2026-05','2025-12'];
  -- returns[trader_idx][month_idx]
  returns NUMERIC[][] := ARRAY[
    -- AlphaFX Pro  avg~12.4
    ARRAY[11.2,13.8,10.5,14.1,12.9,11.7,13.2,12.0,14.5,11.8,13.6,12.4],
    -- Scalp King   avg~18.9
    ARRAY[20.1,16.3,22.4,17.8,19.5,21.2,16.9,18.4,20.7,17.1,21.8,19.3],
    -- GoldStar     avg~8.2
    ARRAY[7.8,9.1,7.2,9.5,8.4,7.6,8.9,8.1,9.2,7.4,8.7,8.2],
    -- CryptoForex  avg~15.1
    ARRAY[16.2,13.4,17.8,14.1,15.9,16.5,13.7,15.2,17.1,14.4,16.8,15.1],
    -- PipHunter    avg~11.3
    ARRAY[10.5,12.8,9.7,13.2,11.8,10.1,12.5,11.1,13.0,10.2,12.2,11.3],
    -- SwingElite   avg~9.7
    ARRAY[9.1,10.5,8.8,10.9,9.4,8.6,10.2,9.8,10.7,8.9,10.1,9.7],
    -- VolatilityKing avg~22.5
    ARRAY[24.1,19.8,26.2,20.4,23.8,25.1,18.9,22.1,24.8,20.1,25.6,22.5],
    -- SteadyGains  avg~6.1
    ARRAY[5.8,6.4,5.6,6.7,6.2,5.7,6.5,6.1,6.8,5.9,6.3,6.1],
    -- FXNinja      avg~14.2
    ARRAY[15.1,12.8,16.4,13.2,14.9,15.5,12.6,14.1,16.0,13.3,15.7,14.2],
    -- TrendMaster  avg~10.8
    ARRAY[10.1,11.8,9.6,12.2,10.9,9.8,11.5,10.7,12.0,10.0,11.4,10.8],
    -- BlazeFX      avg~20.1
    ARRAY[22.4,17.6,24.8,18.9,21.5,23.1,17.2,20.4,22.9,18.1,23.5,20.1],
    -- PrecisionPips avg~7.4
    ARRAY[6.9,8.1,6.5,8.6,7.5,6.8,7.9,7.2,8.3,6.7,7.8,7.4],
    -- MomentumTrader avg~13.5
    ARRAY[14.4,11.9,15.8,12.6,14.1,14.7,11.8,13.4,15.2,12.2,14.9,13.5],
    -- NightScalper avg~17.8
    ARRAY[19.4,15.2,21.6,16.4,18.9,20.1,14.8,17.6,19.9,15.8,20.8,17.8],
    -- ConservativeFX avg~5.2
    ARRAY[4.8,5.7,4.5,5.9,5.3,4.7,5.6,5.1,5.8,4.6,5.5,5.2],
    -- ForexPhoenix avg~16.3
    ARRAY[17.8,14.2,19.4,15.1,17.1,18.2,13.8,16.1,18.5,14.6,18.9,16.3]
  ];
  trader_ids UUID[] := ARRAY[
    'b0000001-0000-4000-0000-000000000001'::UUID,
    'b0000001-0000-4000-0000-000000000002'::UUID,
    'b0000001-0000-4000-0000-000000000003'::UUID,
    'b0000001-0000-4000-0000-000000000004'::UUID,
    'b0000001-0000-4000-0000-000000000005'::UUID,
    'b0000001-0000-4000-0000-000000000006'::UUID,
    'b0000001-0000-4000-0000-000000000007'::UUID,
    'b0000001-0000-4000-0000-000000000008'::UUID,
    'b0000001-0000-4000-0000-000000000009'::UUID,
    'b0000001-0000-4000-0000-000000000010'::UUID,
    'b0000001-0000-4000-0000-000000000011'::UUID,
    'b0000001-0000-4000-0000-000000000012'::UUID,
    'b0000001-0000-4000-0000-000000000013'::UUID,
    'b0000001-0000-4000-0000-000000000014'::UUID,
    'b0000001-0000-4000-0000-000000000015'::UUID,
    'b0000001-0000-4000-0000-000000000016'::UUID
  ];
  win_rates NUMERIC[] := ARRAY[78,65,82,71,69,85,58,90,73,80,62,88,75,67,92,76];
  t INT; m INT;
  tc INT; wc INT; lc INT; rp NUMERIC; pu NUMERIC;
BEGIN
  FOR t IN 1..16 LOOP
    FOR m IN 1..12 LOOP
      rp := returns[t][m];
      tc := 18 + ((t + m) % 7) * 3;
      wc := ROUND(tc * win_rates[t] / 100.0)::INT;
      lc := tc - wc;
      pu := ROUND((rp * 1200.0)::NUMERIC, 2);
      INSERT INTO public.trader_performance
        (trader_id, month, return_pct, trades_count, win_count, loss_count, profit_usd)
      VALUES
        (trader_ids[t], months[m], rp, tc, wc, lc, pu)
      ON CONFLICT (trader_id, month) DO UPDATE SET
        return_pct   = EXCLUDED.return_pct,
        trades_count = EXCLUDED.trades_count,
        win_count    = EXCLUDED.win_count,
        loss_count   = EXCLUDED.loss_count,
        profit_usd   = EXCLUDED.profit_usd;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================
-- STEP 6: UPDATE WALLET BALANCES (realistic amounts)
-- ============================================================

-- Super admin & admins (large balances for demo)
UPDATE public.wallets SET balance_usdt=250000, total_invested=180000, total_profit=42000
WHERE user_id='a0000001-0000-4000-0000-000000000001';
UPDATE public.wallets SET balance_usdt=45000, total_invested=30000, total_profit=8400
WHERE user_id='a0000001-0000-4000-0000-000000000002';
UPDATE public.wallets SET balance_usdt=38000, total_invested=25000, total_profit=6200
WHERE user_id='a0000001-0000-4000-0000-000000000003';

-- Trader wallets (earnings from followers)
UPDATE public.wallets SET balance_usdt=28500, total_profit=18200 WHERE user_id='a0000002-0000-4000-0000-000000000001';
UPDATE public.wallets SET balance_usdt=19200, total_profit=14100 WHERE user_id='a0000002-0000-4000-0000-000000000002';
UPDATE public.wallets SET balance_usdt=42100, total_profit=22400 WHERE user_id='a0000002-0000-4000-0000-000000000003';
UPDATE public.wallets SET balance_usdt=15800, total_profit=9800  WHERE user_id='a0000002-0000-4000-0000-000000000004';
UPDATE public.wallets SET balance_usdt=22400, total_profit=13200 WHERE user_id='a0000002-0000-4000-0000-000000000005';
UPDATE public.wallets SET balance_usdt=31600, total_profit=19400 WHERE user_id='a0000002-0000-4000-0000-000000000006';
UPDATE public.wallets SET balance_usdt=9800,  total_profit=7600  WHERE user_id='a0000002-0000-4000-0000-000000000007';
UPDATE public.wallets SET balance_usdt=68400, total_profit=34100 WHERE user_id='a0000002-0000-4000-0000-000000000008';

-- Investor wallets (varying balances)
DO $$
DECLARE
  inv_ids UUID[] := ARRAY[
    'a0000003-0000-4000-0000-000000000001'::UUID,'a0000003-0000-4000-0000-000000000002'::UUID,
    'a0000003-0000-4000-0000-000000000003'::UUID,'a0000003-0000-4000-0000-000000000004'::UUID,
    'a0000003-0000-4000-0000-000000000005'::UUID,'a0000003-0000-4000-0000-000000000006'::UUID,
    'a0000003-0000-4000-0000-000000000007'::UUID,'a0000003-0000-4000-0000-000000000008'::UUID,
    'a0000003-0000-4000-0000-000000000009'::UUID,'a0000003-0000-4000-0000-000000000010'::UUID,
    'a0000003-0000-4000-0000-000000000011'::UUID,'a0000003-0000-4000-0000-000000000012'::UUID,
    'a0000003-0000-4000-0000-000000000013'::UUID,'a0000003-0000-4000-0000-000000000014'::UUID,
    'a0000003-0000-4000-0000-000000000015'::UUID,'a0000003-0000-4000-0000-000000000016'::UUID,
    'a0000003-0000-4000-0000-000000000017'::UUID,'a0000003-0000-4000-0000-000000000018'::UUID,
    'a0000003-0000-4000-0000-000000000019'::UUID,'a0000003-0000-4000-0000-000000000020'::UUID,
    'a0000003-0000-4000-0000-000000000021'::UUID,'a0000003-0000-4000-0000-000000000022'::UUID,
    'a0000003-0000-4000-0000-000000000023'::UUID,'a0000003-0000-4000-0000-000000000024'::UUID,
    'a0000003-0000-4000-0000-000000000025'::UUID,'a0000003-0000-4000-0000-000000000026'::UUID,
    'a0000003-0000-4000-0000-000000000027'::UUID,'a0000003-0000-4000-0000-000000000028'::UUID,
    'a0000003-0000-4000-0000-000000000029'::UUID,'a0000003-0000-4000-0000-000000000030'::UUID,
    'a0000003-0000-4000-0000-000000000031'::UUID
  ];
  balances NUMERIC[] := ARRAY[
    18450,8200,3400,52000,1200,680,24600,11200,400,9800,
    35400,6700,47200,2100,18900,88500,15600,3200,41000,7400,
    5800,1400,29400,12800,800,21500,44200,3900,16700,2400,950
  ];
  profits NUMERIC[] := ARRAY[
    2840,1180,420,8200,85,0,3890,1640,0,1420,
    5120,890,7300,180,2840,14200,2240,340,6100,980,
    720,0,4180,1820,0,3200,6840,490,2410,280,0
  ];
  i INT;
BEGIN
  FOR i IN 1..31 LOOP
    UPDATE public.wallets
    SET balance_usdt = balances[i],
        total_invested = ROUND(balances[i] * 0.65),
        total_profit = profits[i]
    WHERE user_id = inv_ids[i];
  END LOOP;
END $$;

-- ============================================================
-- STEP 7: INVESTMENTS (active investments for investors)
-- ============================================================

INSERT INTO public.investments (id, user_id, plan_id, amount, expected_return,
  status, started_at, matures_at)
SELECT
  gen_random_uuid(),
  u.id,
  CASE
    WHEN w.balance_usdt >= 50000 THEN 'c0000001-0000-4000-0000-000000000004'::UUID
    WHEN w.balance_usdt >= 10000 THEN 'c0000001-0000-4000-0000-000000000003'::UUID
    WHEN w.balance_usdt >= 1000  THEN 'c0000001-0000-4000-0000-000000000002'::UUID
    ELSE 'c0000001-0000-4000-0000-000000000001'::UUID
  END,
  ROUND(w.balance_usdt * 0.55),
  ROUND(w.balance_usdt * 0.55 *
    CASE WHEN w.balance_usdt >= 50000 THEN 0.30
         WHEN w.balance_usdt >= 10000 THEN 0.22
         WHEN w.balance_usdt >= 1000  THEN 0.15
         ELSE 0.05 END),
  CASE WHEN w.total_profit > 0 THEN 'active' ELSE 'pending' END,
  NOW() - (((ROW_NUMBER() OVER (ORDER BY u.id)) % 25) || ' days')::interval,
  NOW() + ((30 - ((ROW_NUMBER() OVER (ORDER BY u.id)) % 25)) || ' days')::interval
FROM public.users u
JOIN public.wallets w ON w.user_id = u.id
WHERE u.role = 'investor' AND w.balance_usdt >= 100
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 8: TRANSACTIONS (200 realistic transactions)
-- ============================================================

DO $$
DECLARE
  user_ids UUID[];
  n INT;
  uid UUID;
  tx_type TEXT;
  amt NUMERIC;
  ccy TEXT;
  stat TEXT;
  days_ago INT;
  types TEXT[] := ARRAY['deposit','deposit','deposit','withdrawal','profit','profit','copy_profit','fee','referral'];
  currencies TEXT[] := ARRAY['USDT','USDT','USDT','BTC','ETH','USDT'];
  statuses TEXT[] := ARRAY['confirmed','confirmed','confirmed','pending','failed'];
  addrs TEXT[] := ARRAY[
    'TRC4hBxfBzKh1x9LZiGGvWEKGRqHMQnB9a',
    '0x742d35Cc6634C0532925a3b8D4C9F2b1e6A7bE9',
    'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    'TJFb8VPGvJqxe7BPbYqTcmLqWGfpVBgT4R',
    '0x1234567890abcdef1234567890abcdef12345678'
  ];
BEGIN
  SELECT ARRAY(
    SELECT id FROM public.users WHERE role IN ('investor','copy_trader') ORDER BY created_at
  ) INTO user_ids;

  FOR n IN 1..200 LOOP
    uid     := user_ids[1 + (n % array_length(user_ids,1))];
    tx_type := types[1 + (n % array_length(types,1))];
    ccy     := currencies[1 + (n % array_length(currencies,1))];
    days_ago := (n % 120) + 1;

    amt := CASE tx_type
      WHEN 'deposit'     THEN ROUND((200 + (n * 137 % 9800))::NUMERIC, 2)
      WHEN 'withdrawal'  THEN ROUND((100 + (n * 89  % 4900))::NUMERIC, 2)
      WHEN 'profit'      THEN ROUND((50  + (n * 43  % 2400))::NUMERIC, 2)
      WHEN 'copy_profit' THEN ROUND((30  + (n * 61  % 1800))::NUMERIC, 2)
      WHEN 'fee'         THEN ROUND((5   + (n * 7   % 120 ))::NUMERIC, 2)
      ELSE ROUND((25 + (n * 31 % 400))::NUMERIC, 2)
    END;

    stat := CASE tx_type
      WHEN 'withdrawal' THEN statuses[1 + (n % 2)]
      WHEN 'fee'        THEN 'confirmed'
      ELSE statuses[1 + (n % 3)]
    END;

    INSERT INTO public.transactions (
      id, user_id, type, amount, currency, status,
      crypto_address, notes, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), uid, tx_type, amt, ccy::public.currency_enum, stat,
      CASE WHEN tx_type IN ('deposit','withdrawal') THEN addrs[1 + (n % array_length(addrs,1))] ELSE NULL END,
      CASE tx_type
        WHEN 'deposit'     THEN 'USDT deposit confirmed'
        WHEN 'withdrawal'  THEN 'Withdrawal to external wallet'
        WHEN 'profit'      THEN 'Investment plan profit distribution'
        WHEN 'copy_profit' THEN 'Copy trading P&L'
        WHEN 'fee'         THEN 'Platform management fee'
        ELSE 'Referral commission'
      END,
      NOW() - (days_ago || ' days')::interval,
      NOW() - (days_ago || ' days')::interval
    );
  END LOOP;
END $$;

-- ============================================================
-- STEP 9: TRADE SIGNALS (500 signals across 16 traders)
-- ============================================================

DO $$
DECLARE
  trader_ids UUID[] := ARRAY[
    'b0000001-0000-4000-0000-000000000001'::UUID,'b0000001-0000-4000-0000-000000000002'::UUID,
    'b0000001-0000-4000-0000-000000000003'::UUID,'b0000001-0000-4000-0000-000000000004'::UUID,
    'b0000001-0000-4000-0000-000000000005'::UUID,'b0000001-0000-4000-0000-000000000006'::UUID,
    'b0000001-0000-4000-0000-000000000007'::UUID,'b0000001-0000-4000-0000-000000000008'::UUID,
    'b0000001-0000-4000-0000-000000000009'::UUID,'b0000001-0000-4000-0000-000000000010'::UUID,
    'b0000001-0000-4000-0000-000000000011'::UUID,'b0000001-0000-4000-0000-000000000012'::UUID,
    'b0000001-0000-4000-0000-000000000013'::UUID,'b0000001-0000-4000-0000-000000000014'::UUID,
    'b0000001-0000-4000-0000-000000000015'::UUID,'b0000001-0000-4000-0000-000000000016'::UUID
  ];
  pairs TEXT[] := ARRAY['EUR/USD','GBP/USD','USD/JPY','XAU/USD','BTC/USD','GBP/JPY','EUR/GBP','AUD/USD'];
  -- Base open prices for each pair
  base_prices NUMERIC[] := ARRAY[1.0842,1.2641,149.82,2312.4,65480.0,189.42,0.8561,0.6524];
  n INT; tid UUID; pair_idx INT; dir TEXT; op NUMERIC; cp NUMERIC;
  pips NUMERIC; stat TEXT; hours_ago INT;
BEGIN
  FOR n IN 1..500 LOOP
    tid      := trader_ids[1 + (n % 16)];
    pair_idx := 1 + (n % 8);
    dir      := CASE WHEN n % 2 = 0 THEN 'buy' ELSE 'sell' END;
    op       := base_prices[pair_idx] * (1 + ((n * 0.0003) - 0.15) * 0.01);
    pips     := ROUND((((n * 17) % 120) - 30)::NUMERIC, 1); -- -30 to +90 pips
    stat     := CASE WHEN n % 3 = 0 THEN 'open' ELSE 'closed' END;
    hours_ago := (n % 720) + 1;

    cp := CASE WHEN stat = 'closed'
          THEN op + (CASE WHEN dir='buy' THEN 1 ELSE -1 END) * pips * 0.0001
          ELSE NULL END;

    INSERT INTO public.trade_signals (
      id, trader_id, pair, direction, open_price, close_price,
      stop_loss, take_profit, pips_gained, status, notes,
      opened_at, closed_at
    ) VALUES (
      gen_random_uuid(), tid, pairs[pair_idx], dir, ROUND(op::NUMERIC,5),
      CASE WHEN cp IS NOT NULL THEN ROUND(cp::NUMERIC,5) END,
      ROUND((op - (CASE WHEN dir='buy' THEN 1 ELSE -1 END) * 0.0020)::NUMERIC,5),
      ROUND((op + (CASE WHEN dir='buy' THEN 1 ELSE -1 END) * 0.0060)::NUMERIC,5),
      CASE WHEN stat='closed' THEN pips END,
      stat,
      CASE WHEN pips > 50 THEN 'Strong momentum — target hit'
           WHEN pips > 0  THEN 'Clean setup — TP reached'
           WHEN pips < 0  THEN 'SL triggered — risk contained'
           ELSE 'Position open' END,
      NOW() - (hours_ago || ' hours')::interval,
      CASE WHEN stat='closed' THEN NOW() - ((hours_ago - (1 + n % 8)) || ' hours')::interval END
    );
  END LOOP;
END $$;

-- ============================================================
-- STEP 10: COPY SUBSCRIPTIONS (investors copying traders)
-- ============================================================

INSERT INTO public.copy_subscriptions (
  id, investor_id, trader_id, allocated_amount,
  current_value, profit_loss, status, copy_ratio, started_at
)
SELECT
  gen_random_uuid(),
  u.id,
  (ARRAY[
    'b0000001-0000-4000-0000-000000000001'::UUID,
    'b0000001-0000-4000-0000-000000000003'::UUID,
    'b0000001-0000-4000-0000-000000000006'::UUID,
    'b0000001-0000-4000-0000-000000000008'::UUID,
    'b0000001-0000-4000-0000-000000000010'::UUID
  ])[1 + (ROW_NUMBER() OVER (ORDER BY u.id) % 5)],
  ROUND(w.balance_usdt * 0.30),
  ROUND(w.balance_usdt * 0.30 * 1.124),
  ROUND(w.balance_usdt * 0.30 * 0.124),
  'active',
  1.0,
  NOW() - ((ROW_NUMBER() OVER (ORDER BY u.id) % 60 + 10) || ' days')::interval
FROM public.users u
JOIN public.wallets w ON w.user_id = u.id
WHERE u.role = 'investor' AND w.balance_usdt >= 500 AND u.is_active = TRUE
LIMIT 20
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 11: SITE SETTINGS (ensure key settings exist)
-- ============================================================

INSERT INTO public.site_settings (key, value, description) VALUES
  ('referral_commission_pct', '5',    'Referral bonus percentage of first deposit'),
  ('min_deposit_usdt',        '50',   'Minimum deposit in USDT'),
  ('min_withdrawal_usdt',     '20',   'Minimum withdrawal in USDT'),
  ('withdrawal_fee_pct',      '1.5',  'Withdrawal fee percentage'),
  ('platform_name',           'Oakmont Ridge Capital', 'Platform display name'),
  ('support_email',           'support@oakmontridge.com', 'Support contact email'),
  ('max_copy_ratio',          '2',    'Maximum copy trade ratio multiplier'),
  ('platform_fee_pct',        '10',   'Platform fee on copy trading profits'),
  ('maintenance_mode',        'false','Disable platform for maintenance'),
  ('kyc_required_for_withdrawal', 'true', 'Require KYC before allowing withdrawals')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

COMMIT;
