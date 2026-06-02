import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Wallet, BarChart3, Users,
  ArrowUpRight, ArrowDownRight, Plus, Eye, Activity, Gift,
  Shield, AlertTriangle, Clock, Mail, RefreshCw,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatCardSkeleton } from '@/components/ui/Skeleton'
import { formatCurrency, getStatusColor, timeAgo } from '@/lib/utils'
import type { Wallet as WalletType, CopySubscription, Investment, Transaction, KycDocument } from '@/types/database'
import { PortfolioGrowthChart, AssetAllocationChart } from '@/components/charts'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08 } }),
}

const txCfg: Record<string, { icon: typeof TrendingUp; bg: string; color: string; sign: string }> = {
  deposit:     { icon: ArrowDownRight, bg: 'bg-green-100',  color: 'text-green-600',  sign: '+' },
  withdrawal:  { icon: ArrowUpRight,   bg: 'bg-red-100',    color: 'text-red-600',    sign: '-' },
  profit:      { icon: TrendingUp,     bg: 'bg-blue-100',   color: 'text-blue-600',   sign: '+' },
  copy_profit: { icon: TrendingUp,     bg: 'bg-blue-100',   color: 'text-blue-600',   sign: '+' },
  fee:         { icon: TrendingDown,   bg: 'bg-slate-100',  color: 'text-slate-600',  sign: '-' },
  referral:    { icon: Gift,           bg: 'bg-purple-100', color: 'text-purple-600', sign: '+' },
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [wallet, setWallet] = useState<WalletType | null>(null)
  const [subscriptions, setSubscriptions] = useState<CopySubscription[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [kycDoc, setKycDoc] = useState<KycDocument | null | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [resendingVerify, setResendingVerify] = useState(false)
  const [resentVerify, setResentVerify] = useState(false)

  useEffect(() => {
    if (!profile) return
    const fetch = async () => {
      const results = await Promise.all([
        supabase.from('wallets').select('*').eq('user_id', profile.id).single(),
        supabase.from('copy_subscriptions').select('*, copy_traders(*)').eq('investor_id', profile.id).eq('status', 'active').limit(6),
        supabase.from('investments').select('*, investment_plans(*)').eq('user_id', profile.id).eq('status', 'active').limit(5),
        supabase.from('transactions').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('kyc_documents').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ] as const)
      const [w, s, inv, tx, kyc] = results as [any, any, any, any, any]
      if (w.data) setWallet(w.data)
      if (s.data) setSubscriptions(s.data)
      if (inv.data) setInvestments(inv.data)
      if (tx.data) setTransactions(tx.data)
      setKycDoc(kyc.data ?? null)
      setLoading(false)
    }
    fetch()
  }, [profile])

  const BTC = 65000, ETH = 3500
  const totalBalance = wallet ? wallet.balance_usdt + wallet.balance_btc * BTC + wallet.balance_eth * ETH : 0
  const copyTotal = subscriptions.reduce((s, sub) => s + (sub.current_value ?? sub.allocated_amount), 0)
  const investedTotal = investments.reduce((s, inv) => s + inv.amount, 0)
  const idleCash = Math.max(0, totalBalance - copyTotal - investedTotal)

  const donutData = [
    { name: 'Copy Trading', value: copyTotal,     color: '#1E40AF' },
    { name: 'Investments',  value: investedTotal, color: '#3B82F6' },
    { name: 'Idle Cash',    value: idleCash,      color: '#93C5FD' },
  ].filter(d => d.value > 0)

  const stats = [
    { label: 'Total Balance',        value: formatCurrency(totalBalance), change: '+8.4% all-time',    up: true,  icon: Wallet,   color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Profit Earned',  value: formatCurrency(wallet?.total_profit ?? 0), change: '+12.3% this month', up: true, icon: TrendingUp, color: 'bg-green-50 text-green-600' },
    { label: 'Active Copies Running', value: subscriptions.length.toString(), change: `${subscriptions.length} trader${subscriptions.length !== 1 ? 's' : ''} running`, up: true, icon: Users, color: 'bg-purple-50 text-purple-600' },
    { label: 'Active Investments',   value: investments.length.toString(), change: formatCurrency(investedTotal) + ' total',   up: true, icon: BarChart3, color: 'bg-amber-50 text-amber-600' },
  ]

  // ── KYC banner config ─────────────────────────────────────────
  const showKycBanner = profile && profile.kyc_status !== 'verified' && kycDoc !== undefined
  const kycBanner = (() => {
    if (!showKycBanner) return null
    if (profile!.kyc_status === 'rejected') {
      return {
        icon: AlertTriangle,
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        wrapperClass: 'bg-red-50 border border-red-200',
        titleClass: 'text-red-800',
        textClass: 'text-red-600',
        title: 'KYC Verification Rejected',
        message: 'Your identity documents were rejected. Please review the reason on the KYC page and re-submit.',
        btnClass: 'bg-red-600 hover:bg-red-700 text-white',
        btnLabel: 'Re-submit KYC',
      }
    }
    if (kycDoc && kycDoc.status === 'pending') {
      return {
        icon: Clock,
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        wrapperClass: 'bg-yellow-50 border border-yellow-200',
        titleClass: 'text-yellow-800',
        textClass: 'text-yellow-600',
        title: 'KYC Under Review',
        message: 'Your documents have been submitted and are being reviewed by our compliance team. This typically takes 24–48 hours.',
        btnClass: 'bg-yellow-500 hover:bg-yellow-600 text-white',
        btnLabel: 'View Status',
      }
    }
    // Not started
    return {
      icon: Shield,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      wrapperClass: 'bg-amber-50 border border-amber-200',
      titleClass: 'text-amber-800',
      textClass: 'text-amber-600',
      title: 'Complete Your KYC Verification',
      message: 'Verify your identity to unlock withdrawals, full investment access, referral payouts, and higher trading limits.',
      btnClass: 'bg-amber-500 hover:bg-amber-600 text-white',
      btnLabel: 'Verify Now →',
    }
  })()
  const KycBannerIcon = kycBanner?.icon ?? null

  const resendVerificationEmail = async () => {
    if (!profile?.email || resendingVerify) return
    setResendingVerify(true)
    try {
      const { data } = await supabase.functions.invoke('send-verification', {
        body: { email: profile.email },
      })
      if (data?.already_verified) { setResentVerify(false); return }
      // email_failed = true means email couldn't send but token saved — still show "sent"
      setResentVerify(true)
    } catch {
      // silently fail — user can go to /verify-email
    } finally {
      setResendingVerify(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Email verification banner ── */}
      {profile && !profile.email_verified && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-blue-50 border border-blue-200"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-blue-800">Verify your email address</p>
            <p className="text-xs mt-0.5 leading-relaxed text-blue-600">
              {resentVerify
                ? `Verification email resent to ${profile.email}. Check your inbox.`
                : `A verification link was sent to ${profile.email}. Click it to unlock all features.`}
            </p>
          </div>
          <button
            onClick={resendVerificationEmail}
            disabled={resendingVerify || resentVerify}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resendingVerify ? 'animate-spin' : ''}`} />
            {resentVerify ? 'Sent!' : resendingVerify ? 'Sending…' : 'Resend Link'}
          </button>
        </motion.div>
      )}
      {/* ── KYC verification banner ── */}
      {kycBanner && KycBannerIcon && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 ${kycBanner.wrapperClass}`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${kycBanner.iconBg}`}>
            <KycBannerIcon className={`w-5 h-5 ${kycBanner.iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm ${kycBanner.titleClass}`}>{kycBanner.title}</p>
            <p className={`text-xs mt-0.5 leading-relaxed ${kycBanner.textClass}`}>{kycBanner.message}</p>
          </div>
          <Link to="/kyc" className="flex-shrink-0">
            <button className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${kycBanner.btnClass}`}>
              {kycBanner.btnLabel}
            </button>
          </Link>
        </motion.div>
      )}

      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#1E40AF] to-[#2563eb] rounded-2xl p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/2 pointer-events-none" />
        <div className="relative">
          <p className="text-blue-200 text-sm">{getGreeting()},</p>
          <h2 className="text-2xl font-bold mt-0.5">{profile?.full_name ?? 'Investor'}</h2>
          <p className="text-blue-100 text-sm mt-1">Your portfolio is growing. Here's your latest overview.</p>
        </div>
        <div className="flex gap-3 relative flex-shrink-0">
          <Link to="/wallet">
            <Button size="sm" className="bg-white text-[#1E40AF] hover:bg-blue-50 shadow-md">
              <Plus className="w-4 h-4" /> Deposit
            </Button>
          </Link>
          <Link to="/copy-trading">
            <Button size="sm" variant="outline" className="border-white/60 text-white hover:bg-white/15">
              <Eye className="w-4 h-4" /> Browse Traders
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          stats.map((stat, i) => (
            <motion.div key={stat.label} custom={i} initial="hidden" animate="show" variants={fadeUp}>
              <Card hover className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <div className="flex items-center gap-1 text-xs">
                  {stat.up
                    ? <ArrowUpRight className="w-3.5 h-3.5 text-green-500" />
                    : <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />}
                  <span className={stat.up ? 'text-green-600' : 'text-red-600'}>{stat.change}</span>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="xl:col-span-3"
        >
          <PortfolioGrowthChart loading={loading} height={230} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="xl:col-span-2"
        >
          <AssetAllocationChart
            loading={loading}
            allocations={donutData.length ? donutData : undefined}
          />
        </motion.div>
      </div>

      {/* Active copies table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-900">Active Copy Trades</h3>
            <Link to="/copy-trading" className="text-xs text-[#3B82F6] hover:underline">View All</Link>
          </div>
          {subscriptions.length === 0 ? (
            <div className="text-center py-10">
              <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No active copy trades</p>
              <Link to="/copy-trading">
                <Button size="sm" className="mt-3">Browse Traders</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full min-w-[580px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Trader', 'Allocated', 'Current Value', 'P&L', 'P&L %', 'Status'].map(h => (
                      <th key={h} className={`py-2 pb-3 text-xs font-medium text-slate-400 ${h === 'Trader' ? 'text-left' : 'text-right last:text-center'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {subscriptions.map(sub => {
                    const pnl = sub.profit_loss ?? 0
                    const pnlPct = sub.allocated_amount > 0 ? (pnl / sub.allocated_amount) * 100 : 0
                    const curr = sub.current_value ?? sub.allocated_amount
                    return (
                      <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {sub.copy_traders?.display_name?.charAt(0) ?? 'T'}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{sub.copy_traders?.display_name ?? 'Trader'}</p>
                              <p className="text-xs text-slate-400 capitalize">{sub.copy_traders?.trading_style?.replace('_', ' ') ?? ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-right font-medium text-slate-700">{formatCurrency(sub.allocated_amount)}</td>
                        <td className="py-3 text-right font-medium text-slate-900">{formatCurrency(curr)}</td>
                        <td className={`py-3 text-right font-semibold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                        </td>
                        <td className={`py-3 text-right font-semibold ${pnlPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                        </td>
                        <td className="py-3 text-center">
                          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                            {sub.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Recent transactions */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <Card>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-900">Recent Transactions</h3>
            <Link to="/transactions" className="text-xs text-[#3B82F6] hover:underline">View All</Link>
          </div>
          {transactions.length === 0 ? (
            <div className="text-center py-10">
              <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {transactions.map(tx => {
                const cfg = txCfg[tx.type] ?? txCfg.deposit
                const Icon = cfg.icon
                return (
                  <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 capitalize">{tx.type.replace('_', ' ')}</p>
                      <p className="text-xs text-slate-400">{timeAgo(tx.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${cfg.sign === '-' ? 'text-red-600' : 'text-green-600'}`}>
                        {cfg.sign}{tx.amount} {tx.currency}
                      </p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
