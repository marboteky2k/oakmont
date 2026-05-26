import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Users, TrendingUp, BarChart3, Award, Activity, UserPlus, AlertCircle } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { format, subMonths, parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useTraderProfile } from '@/hooks/useTraderProfile'
import { formatCurrency, formatPercent, getStatusColor } from '@/lib/utils'
import type { TraderPerformance, CopySubscription, CopyTrader } from '@/types/database'

interface EquityPoint {
  month: string
  equity: number
}

interface RecentFollower {
  id: string
  investor_id: string
  allocated_amount: number
  status: string
  started_at: string
}

function buildEquityCurve(
  perf: TraderPerformance[],
  trader: CopyTrader,
): EquityPoint[] {
  if (perf.length >= 2) {
    // Build from real data
    const sorted = [...perf].sort((a, b) => a.month.localeCompare(b.month))
    let equity = 100
    return sorted.map((p) => {
      equity *= 1 + p.return_pct / 100
      return { month: format(parseISO(p.month + '-01'), 'MMM yy'), equity: parseFloat(equity.toFixed(2)) }
    })
  }

  // Synthetic: 12 months of monthly_return_pct applied with slight variance
  const base = trader.monthly_return_pct || 3
  let equity = 100
  return Array.from({ length: 12 }, (_, i) => {
    const variance = (((i * 7 + 3) % 5) - 2) * 0.4  // deterministic ±0.8%
    equity *= 1 + (base + variance) / 100
    const d = subMonths(new Date(2026, 4, 1), 11 - i)
    return { month: format(d, 'MMM yy'), equity: parseFloat(equity.toFixed(2)) }
  })
}

export default function TraderOverview() {
  const { trader, loading } = useTraderProfile()
  const [perf, setPerf] = useState<TraderPerformance[]>([])
  const [followers, setFollowers] = useState<RecentFollower[]>([])
  const [openCount, setOpenCount] = useState(0)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!trader) return
    const fetchData = async () => {
      setDataLoading(true)
      const [perfRes, subRes, tradesRes] = await Promise.all([
        supabase
          .from('trader_performance')
          .select('*')
          .eq('trader_id', trader.id)
          .order('month', { ascending: true })
          .limit(24),
        supabase
          .from('copy_subscriptions')
          .select('id, investor_id, allocated_amount, status, started_at')
          .eq('trader_id', trader.id)
          .order('started_at', { ascending: false })
          .limit(5),
        supabase
          .from('trade_signals')
          .select('id', { count: 'exact', head: true })
          .eq('trader_id', trader.id)
          .eq('status', 'open'),
      ])
      setPerf((perfRes.data as TraderPerformance[]) ?? [])
      setFollowers((subRes.data as RecentFollower[]) ?? [])
      setOpenCount(tradesRes.count ?? 0)
      setDataLoading(false)
    }
    fetchData()
  }, [trader])

  const equityCurve = useMemo(
    () => (trader ? buildEquityCurve(perf, trader) : []),
    [perf, trader],
  )

  const totalPerfFee = useMemo(() => {
    if (!trader) return 0
    return (trader.assets_under_management * trader.monthly_return_pct * trader.performance_fee) / 10000
  }, [trader])

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (!trader) {
    return (
      <Card>
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-blue-500" />
          </div>
          <p className="font-semibold text-slate-700 mb-2">No Trader Profile Found</p>
          <p className="text-slate-400 text-sm mb-6">Set up your trader profile to start accepting followers.</p>
          <Button onClick={() => (window.location.href = '/trader/profile')}>
            Set Up Profile
          </Button>
        </div>
      </Card>
    )
  }

  const statCards = [
    {
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      value: trader.followers_count.toString(),
      label: 'Total Followers',
      sub: `${followers.filter((f) => f.status === 'active').length} active`,
    },
    {
      icon: BarChart3,
      color: 'bg-green-100 text-green-600',
      value: formatCurrency(trader.assets_under_management),
      label: 'Assets Under Mgmt',
      sub: 'Total allocated',
    },
    {
      icon: TrendingUp,
      color: 'bg-purple-100 text-purple-600',
      value: formatPercent(trader.monthly_return_pct),
      label: 'Monthly ROI',
      sub: `${formatPercent(trader.total_return_pct)} all-time`,
    },
    {
      icon: Award,
      color: 'bg-orange-100 text-orange-600',
      value: `${trader.win_rate.toFixed(1)}%`,
      label: 'Win Rate',
      sub: `${trader.max_drawdown.toFixed(1)}% max DD`,
    },
  ]

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trader Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Welcome back, {trader.display_name}</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${trader.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {trader.is_active ? '● Live' : '○ Inactive'}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Card className="flex items-start gap-3">
              <div className={`w-11 h-11 rounded-2xl ${card.color} flex items-center justify-center flex-shrink-0`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-black text-slate-900 truncate">{card.value}</p>
                <p className="text-xs text-slate-500 truncate">{card.label}</p>
                <p className="text-xs text-slate-400 truncate">{card.sub}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Equity curve + Open positions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity curve */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-slate-900">Equity Curve</h3>
              <p className="text-xs text-slate-400 mt-0.5">Cumulative account growth</p>
            </div>
            <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
              {equityCurve.length > 0
                ? formatPercent(equityCurve[equityCurve.length - 1].equity - 100)
                : '+0.00%'}{' '}
              total
            </span>
          </div>
          {dataLoading ? (
            <div className="h-52 bg-slate-100 rounded-xl animate-pulse" />
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={equityCurve} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v.toFixed(0)}`} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 12 }}
                  formatter={(v) => [`${(+(v ?? 0)).toFixed(2)}`, 'Index']}
                />
                <Area type="monotone" dataKey="equity" stroke="#3B82F6" strokeWidth={2} fill="url(#equityGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Open positions + Est. fee */}
        <div className="space-y-4">
          <Card className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
              <Activity className="w-7 h-7 text-blue-600" />
            </div>
            <p className="text-3xl font-black text-slate-900">{openCount}</p>
            <p className="text-sm text-slate-500 mt-1">Open Positions</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-4 w-full"
              onClick={() => (window.location.href = '/trader/trades')}
            >
              Manage Trades
            </Button>
          </Card>

          <Card>
            <p className="text-xs text-slate-400 mb-1">Est. Monthly Fee Income</p>
            <p className="text-2xl font-black text-green-600">{formatCurrency(totalPerfFee)}</p>
            <p className="text-xs text-slate-400 mt-1">
              {trader.performance_fee}% of {formatCurrency(trader.assets_under_management)} AUM returns
            </p>
          </Card>
        </div>
      </div>

      {/* Recent followers */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-slate-900">Recent Follower Activity</h3>
            <p className="text-xs text-slate-400 mt-0.5">Latest 5 copy subscriptions</p>
          </div>
          <button
            onClick={() => (window.location.href = '/trader/followers')}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            View all →
          </button>
        </div>

        {dataLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : followers.length === 0 ? (
          <div className="text-center py-10">
            <UserPlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No followers yet. Share your profile to attract investors.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {followers.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                    {f.investor_id.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Investor {f.investor_id.slice(0, 8)}…
                    </p>
                    <p className="text-xs text-slate-400">
                      Joined {format(parseISO(f.started_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">{formatCurrency(f.allocated_amount)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(f.status)}`}>
                    {f.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
