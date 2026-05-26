import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Users, TrendingUp, DollarSign, Activity, Clock, CheckCircle, AlertTriangle,
  ArrowUpRight, BarChart3, Shield,
} from 'lucide-react'
import { UserGrowthChart, RevenueChart } from '@/components/charts'
import { format, startOfDay, subDays } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, timeAgo } from '@/lib/utils'

import type { Transaction, KycDocument, User } from '@/types/database'


export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeInvestors: 0,
    totalAUM: 0,
    depositsToday: 0,
    pendingWithdrawals: 0,
    platformRevenue: 0,
  })
  const [alerts, setAlerts] = useState({
    pendingKyc: 0,
    pendingWithdrawals: 0,
    flaggedTx: 0,
    newToday: 0,
  })
  const [recentTx, setRecentTx] = useState<Transaction[]>([])
  const [pendingKycDocs, setPendingKycDocs] = useState<(KycDocument & { users?: User })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      const todayStart = startOfDay(new Date()).toISOString()

      const [
        usersRes, walletsRes, depositsRes, todayDepositsRes,
        pendingWdrRes, feesRes, kycRes, kycCountRes, newTodayRes, txRes,
      ] = await Promise.all([
        supabase.from('users').select('id, role, is_active'),
        supabase.from('wallets').select('total_invested'),
        supabase.from('transactions').select('amount').eq('type', 'deposit').eq('status', 'confirmed'),
        supabase.from('transactions').select('amount').eq('type', 'deposit').eq('status', 'confirmed').gte('created_at', todayStart),
        supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('type', 'withdrawal').eq('status', 'pending'),
        supabase.from('transactions').select('amount').eq('type', 'fee').eq('status', 'confirmed'),
        supabase.from('kyc_documents').select('*, users(id, full_name, email)').eq('status', 'pending').limit(5).order('created_at', { ascending: false }),
        supabase.from('kyc_documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('users').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
        supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(8),
      ])

      setStats({
        totalUsers: usersRes.data?.length ?? 0,
        activeInvestors: usersRes.data?.filter((u) => u.role === 'investor' && u.is_active).length ?? 0,
        totalAUM: walletsRes.data?.reduce((s, w) => s + (w.total_invested ?? 0), 0) ?? 0,
        depositsToday: todayDepositsRes.data?.reduce((s, d) => s + d.amount, 0) ?? 0,
        pendingWithdrawals: pendingWdrRes.count ?? 0,
        platformRevenue: feesRes.data?.reduce((s, f) => s + f.amount, 0) ?? 0,
      })
      setAlerts({
        pendingKyc: kycCountRes.count ?? 0,
        pendingWithdrawals: pendingWdrRes.count ?? 0,
        flaggedTx: 0,
        newToday: newTodayRes.count ?? 0,
      })
      setRecentTx(txRes.data ?? [])
      setPendingKycDocs((kycRes.data ?? []) as any)
      setLoading(false)
    }
    fetch()
  }, [])

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'bg-blue-50 text-blue-600', sub: `${stats.activeInvestors} active investors` },
    { label: 'Total AUM', value: formatCurrency(stats.totalAUM), icon: TrendingUp, color: 'bg-green-50 text-green-600', sub: 'Across all wallets' },
    { label: 'Deposits Today', value: formatCurrency(stats.depositsToday), icon: DollarSign, color: 'bg-emerald-50 text-emerald-600', sub: format(new Date(), 'MMMM d') },
    { label: 'Pending Withdrawals', value: stats.pendingWithdrawals.toString(), icon: Clock, color: 'bg-yellow-50 text-yellow-600', sub: 'Awaiting action' },
    { label: 'Platform Revenue', value: formatCurrency(stats.platformRevenue), icon: BarChart3, color: 'bg-purple-50 text-purple-600', sub: 'From fees' },
    { label: 'Active Investors', value: stats.activeInvestors.toLocaleString(), icon: Activity, color: 'bg-indigo-50 text-indigo-600', sub: 'Active accounts' },
  ]

  const txColor = (type: string) => {
    if (type === 'deposit') return 'bg-green-100 text-green-600'
    if (type === 'withdrawal') return 'bg-red-100 text-red-600'
    if (type === 'profit') return 'bg-blue-100 text-blue-600'
    return 'bg-slate-100 text-slate-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Platform performance · {format(new Date(), 'EEEE, MMMM d yyyy')}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1E40AF] rounded-xl">
          <Shield className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-white">Admin</span>
        </div>
      </div>

      {/* Alert strip */}
      {!loading && (alerts.pendingKyc > 0 || alerts.pendingWithdrawals > 0 || alerts.newToday > 0) && (
        <div className="flex flex-wrap gap-3">
          {alerts.pendingKyc > 0 && (
            <a href="/admin/kyc" className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-xl text-sm font-medium text-yellow-700 hover:bg-yellow-100 transition-colors">
              <AlertTriangle className="w-4 h-4" />
              {alerts.pendingKyc} KYC pending
            </a>
          )}
          {alerts.pendingWithdrawals > 0 && (
            <a href="/admin/transactions" className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-xl text-sm font-medium text-orange-700 hover:bg-orange-100 transition-colors">
              <Clock className="w-4 h-4" />
              {alerts.pendingWithdrawals} withdrawals pending
            </a>
          )}
          {alerts.newToday > 0 && (
            <a href="/admin/users" className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors">
              <Users className="w-4 h-4" />
              {alerts.newToday} new user{alerts.newToday > 1 ? 's' : ''} today
            </a>
          )}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading
          ? [...Array(6)].map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)
          : statCards.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card hover>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-slate-500">{s.label}</p>
                    <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center`}>
                      <s.icon className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
                </Card>
              </motion.div>
            ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RevenueChart loading={loading} height={220} />
        <UserGrowthChart loading={loading} height={220} />
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent transactions */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Recent Transactions</h3>
            <a href="/admin/transactions" className="text-xs text-blue-600 hover:text-blue-800 font-medium">View all →</a>
          </div>
          <div className="space-y-1">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${txColor(tx.type)}`}>
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-900 capitalize">{tx.type.replace('_', ' ')}</p>
                  <p className="text-xs text-slate-400">{timeAgo(tx.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-900">{tx.amount} {tx.currency}</p>
                  <Badge
                    variant={tx.status === 'confirmed' ? 'success' : tx.status === 'pending' ? 'warning' : 'danger'}
                    size="sm"
                  >
                    {tx.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Pending KYC */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Pending KYC</h3>
            <a href="/admin/kyc" className="text-xs text-blue-600 hover:text-blue-800 font-medium">Review all →</a>
          </div>
          {pendingKycDocs.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-slate-500">All KYC reviews complete</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingKycDocs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl bg-yellow-50 border border-yellow-100">
                  <div className="w-8 h-8 rounded-lg bg-yellow-200 flex items-center justify-center text-yellow-800 text-xs font-bold flex-shrink-0">
                    {(doc.users as any)?.full_name?.charAt(0) ?? 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-900 truncate">{(doc.users as any)?.full_name ?? 'Unknown User'}</p>
                    <p className="text-xs text-slate-500 capitalize">{doc.document_type?.replace('_', ' ')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="warning" size="sm">Pending</Badge>
                    <a href="/admin/kyc" className="text-xs text-blue-600 font-medium hover:text-blue-800">
                      Review <ArrowUpRight className="w-3 h-3 inline" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
