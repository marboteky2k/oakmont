import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { SiteSettingsProvider } from '@/contexts/SiteSettingsContext'
import { ProtectedRoute } from '@/components/guards/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'

// Public
import Landing from '@/pages/Landing'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import VerifyEmail from '@/pages/auth/VerifyEmail'
import VerifyWithdrawal from '@/pages/auth/VerifyWithdrawal'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'

// Investor / Trader
import Dashboard from '@/pages/dashboard/Dashboard'
import CopyTrading from '@/pages/copy-trading/CopyTrading'
import Investments from '@/pages/investments/Investments'
import Wallet from '@/pages/wallet/Wallet'
import Transactions from '@/pages/transactions/Transactions'
import KYC from '@/pages/kyc/KYC'
import Notifications from '@/pages/notifications/Notifications'
import Settings from '@/pages/settings/Settings'
import Referrals from '@/pages/referrals/Referrals'
import Support from '@/pages/support/Support'
import Markets from '@/pages/markets/Markets'
import Trading from '@/pages/trading/Trading'
import TradeHistory from '@/pages/trading/TradeHistory'
import Exchanges from '@/pages/exchanges/Exchanges'
import BotTrading from '@/pages/bot-trading/BotTrading'

// Trader
import TraderOverview from '@/pages/trader/TraderOverview'
import TraderPerformance from '@/pages/trader/TraderPerformance'
import TraderOpenTrades from '@/pages/trader/TraderOpenTrades'
import TraderFollowersEarnings from '@/pages/trader/TraderFollowersEarnings'
import TraderProfileSetup from '@/pages/trader/TraderProfileSetup'

// Admin
import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminTraders from '@/pages/admin/AdminTraders'
import AdminKYC from '@/pages/admin/AdminKYC'
import AdminTransactions from '@/pages/admin/AdminTransactions'
import AdminInvestments from '@/pages/admin/AdminInvestments'
import AdminCryptoWallets from '@/pages/admin/AdminCryptoWallets'
import AdminSiteSettings from '@/pages/admin/AdminSiteSettings'
import AdminAuditLogs from '@/pages/admin/AdminAuditLogs'
import AdminTradeSignals from '@/pages/admin/AdminTradeSignals'
import AdminNotifications from '@/pages/admin/AdminNotifications'
import AdminReports from '@/pages/admin/AdminReports'
import AdminProfitEngine from '@/pages/admin/AdminProfitEngine'
import AdminMarkets from '@/pages/admin/AdminMarkets'
import AdminBotMonitor from '@/pages/admin/AdminBotMonitor'
import AdminExchangeMonitor from '@/pages/admin/AdminExchangeMonitor'
import AdminChat from '@/pages/admin/AdminChat'
import AdminLiveTrades from '@/pages/admin/AdminLiveTrades'
import NotFound from '@/pages/NotFound'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Legal / Public pages
import PrivacyPolicy from '@/pages/legal/PrivacyPolicy'
import TermsOfService from '@/pages/legal/TermsOfService'
import CookiePolicy from '@/pages/legal/CookiePolicy'
import ContactUs from '@/pages/contact/ContactUs'
import Blog from '@/pages/blog/Blog'
import Careers from '@/pages/careers/Careers'
import About from '@/pages/about/About'
import FAQ from '@/pages/faq/FAQ'
import Plans from '@/pages/plans/Plans'
import Affiliate from '@/pages/affiliate/Affiliate'

// Admin extras
import AdminSupportTickets from '@/pages/admin/AdminSupportTickets'

// Components
import { CookieBanner } from '@/components/CookieBanner'
import { SEOHead } from '@/components/SEOHead'

/** Redirects logged-in users from the landing page straight to their dashboard */
function RootRedirect() {
  const { session, loading } = useAuth()
  if (loading) return null
  if (session) return <Navigate to="/dashboard" replace />
  return <Landing />
}

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <SiteSettingsProvider>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fff',
              color: '#1e293b',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 10px 40px -12px rgba(30,64,175,0.15)',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <SEOHead />
        <CookieBanner />
        <Routes>
          {/* Legal & public pages */}
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/careers" element={<Careers />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/plans" element={<Plans />} />
          <Route path="/affiliate" element={<Affiliate />} />

          {/* Public — root redirects logged-in users to dashboard */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-withdrawal" element={<VerifyWithdrawal />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Authenticated investor/trader routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/copy-trading" element={<CopyTrading />} />
              <Route path="/investments" element={<Investments />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/kyc" element={<KYC />} />
              <Route path="/markets" element={<Markets />} />
              <Route path="/trading" element={<Trading />} />
              <Route path="/trade-history" element={<TradeHistory />} />
              <Route path="/exchanges" element={<Exchanges />} />
              <Route path="/bot-trading" element={<BotTrading />} />
              <Route path="/referrals" element={<Referrals />} />
              <Route path="/support" element={<Support />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Copy Trader routes */}
          <Route element={<ProtectedRoute allowedRoles={['copy_trader']} />}>
            <Route element={<AppLayout />}>
              <Route path="/trader" element={<TraderOverview />} />
              <Route path="/trader/performance" element={<TraderPerformance />} />
              <Route path="/trader/trades" element={<TraderOpenTrades />} />
              <Route path="/trader/followers" element={<TraderFollowersEarnings />} />
              <Route path="/trader/profile" element={<TraderProfileSetup />} />
              <Route path="/trade-history" element={<TradeHistory />} />
            </Route>
          </Route>

          {/* Admin routes */}
          <Route element={<ProtectedRoute allowedRoles={['super_admin', 'admin']} />}>
            <Route element={<AppLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/traders" element={<AdminTraders />} />
              <Route path="/admin/kyc" element={<AdminKYC />} />
              <Route path="/admin/transactions" element={<AdminTransactions />} />
              <Route path="/admin/investments" element={<AdminInvestments />} />
              <Route path="/admin/wallets" element={<AdminCryptoWallets />} />
              <Route path="/admin/signals" element={<AdminTradeSignals />} />
              <Route path="/admin/notifications" element={<AdminNotifications />} />
              <Route path="/admin/audit" element={<AdminAuditLogs />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/settings" element={<AdminSiteSettings />} />
              <Route path="/admin/profit-engine" element={<AdminProfitEngine />} />
              <Route path="/admin/markets" element={<AdminMarkets />} />
              <Route path="/admin/bot-monitor" element={<AdminBotMonitor />} />
              <Route path="/admin/exchange-monitor" element={<AdminExchangeMonitor />} />
              <Route path="/admin/chat" element={<AdminChat />} />
              <Route path="/admin/live-trades" element={<AdminLiveTrades />} />
              <Route path="/admin/support-tickets" element={<AdminSupportTickets />} />
              <Route path="/trading" element={<Trading />} />
            </Route>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
      </SiteSettingsProvider>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
