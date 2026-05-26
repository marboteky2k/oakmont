import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Users, DollarSign, TrendingUp, TrendingDown, Pause, StopCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useTraderProfile } from '@/hooks/useTraderProfile'
import { formatCurrency, getStatusColor } from '@/lib/utils'
import type { CopySubscription, Transaction } from '@/types/database'

interface SubRow {
  id: string
  investor_id: string
  allocated_amount: number
  current_value: number
  profit_loss: number
  status: string
  copy_ratio: number
  started_at: string
  stopped_at?: string
}

type EarningsTab = 'followers' | 'history'

export default function TraderFollowersEarnings() {
  const { trader, loading: traderLoading } = useTraderProfile()
  const [tab, setTab] = useState<EarningsTab>('followers')
  const [subs, setSubs] = useState<SubRow[]>([])
  const [earnings, setEarnings] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!trader) return
    const fetch = async () => {
      setLoading(true)
      const [subsRes, earningsRes] = await Promise.all([
        supabase
          .from('copy_subscriptions')
          .select('id, investor_id, allocated_amount, current_value, profit_loss, status, copy_ratio, started_at, stopped_at')
          .eq('trader_id', trader.id)
          .order('started_at', { ascending: false }),
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', trader.user_id)
          .eq('type', 'copy_earning')
          .order('created_at', { ascending: false })
          .limit(50),
      ])
      setSubs((subsRes.data as SubRow[]) ?? [])
      setEarnings((earningsRes.data as Transaction[]) ?? [])
      setLoading(false)
    }
    fetch()
  }, [trader])

  const totalAUM = useMemo(() => subs.filter((s) => s.status === 'active').reduce((sum, s) => sum + s.allocated_amount, 0), [subs])
  const totalPL = useMemo(() => subs.reduce((sum, s) => sum + (s.profit_loss ?? 0), 0), [subs])
  const totalFees = useMemo(
    () =>
      trader
        ? subs.reduce(
            (sum, s) =>
              sum + (s.profit_loss > 0 ? s.profit_loss * (trader.performance_fee / 100) : 0),
            0,
          )
        : 0,
    [subs, trader],
  )
  const totalEarningsHistory = useMemo(
    () => earnings.reduce((sum, e) => sum + e.amount, 0),
    [earnings],
  )

  const statCards = [
    { icon: Users, color: 'bg-blue-100 text-blue-600', value: subs.filter((s) => s.status === 'active').length.toString(), label: 'Active Followers', sub: `${subs.length} total` },
    { icon: DollarSign, color: 'bg-green-100 text-green-600', value: formatCurrency(totalAUM), label: 'Total AUM', sub: 'Active subscriptions' },
    { icon: TrendingUp, color: 'bg-purple-100 text-purple-600', value: formatCurrency(totalFees), label: 'Est. Performance Fees', sub: `${trader?.performance_fee ?? 0}% of gains` },
    { icon: DollarSign, color: 'bg-orange-100 text-orange-600', value: formatCurrency(totalEarningsHistory), label: 'Total Earned', sub: 'From copy earnings' },
  ]

  if (traderLoading) return <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />

  if (!trader) {
    return (
      <Card>
        <div className="text-center py-16">
          <p className="text-slate-500 mb-4">Set up your trader profile first.</p>
          <Button onClick={() => (window.location.href = '/trader/profile')}>Set Up Profile</Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Followers & Earnings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your copy subscribers and track performance fee income.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
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

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {(['followers', 'history'] as EarningsTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t === 'followers' ? 'Followers' : 'Earnings History'}
          </button>
        ))}
      </div>

      {/* Followers table */}
      {tab === 'followers' && (
        <Card padding="none">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : subs.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-medium text-slate-500">No followers yet</p>
              <p className="text-sm text-slate-400 mt-1">Share your profile to attract copy investors.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Investor', 'Allocated', 'Ratio', 'Current Value', 'P&L', 'Perf. Fee', 'Status', 'Since'].map((h) => (
                      <th key={h} className="text-left py-3 px-4 font-semibold text-slate-400 text-xs uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {subs.map((s, i) => {
                    const pl = s.profit_loss ?? 0
                    const fee = pl > 0 ? pl * (trader.performance_fee / 100) : 0
                    return (
                      <motion.tr
                        key={s.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="hover:bg-slate-50/60"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                              {s.investor_id.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-slate-700 font-mono text-xs">
                              {s.investor_id.slice(0, 8)}…
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{formatCurrency(s.allocated_amount)}</td>
                        <td className="py-3 px-4 text-slate-500">{s.copy_ratio}×</td>
                        <td className="py-3 px-4 text-slate-700">{formatCurrency(s.current_value ?? s.allocated_amount)}</td>
                        <td className="py-3 px-4">
                          <span className={`font-semibold ${pl >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {pl >= 0 ? '+' : ''}{formatCurrency(pl)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {fee > 0 ? (
                            <span className="text-purple-600 font-semibold">{formatCurrency(fee)}</span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(s.status)}`}>
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">
                          {format(parseISO(s.started_at), 'MMM d, yyyy')}
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Earnings history */}
      {tab === 'history' && (
        <Card padding="none">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : earnings.length === 0 ? (
            <div className="text-center py-16">
              <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-medium text-slate-500">No earnings history yet</p>
              <p className="text-sm text-slate-400 mt-1">Performance fee income will appear here once your followers generate returns.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Date', 'Amount', 'Currency', 'Status', 'Note'].map((h) => (
                      <th key={h} className="text-left py-3 px-4 font-semibold text-slate-400 text-xs uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {earnings.map((e, i) => (
                    <motion.tr
                      key={e.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-slate-50/60"
                    >
                      <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">
                        {format(parseISO(e.created_at), 'MMM d, yyyy HH:mm')}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-green-600">+{formatCurrency(e.amount)}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{e.currency}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(e.status)}`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs">{e.note ?? '—'}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Summary totals bar */}
      {tab === 'followers' && subs.length > 0 && (
        <Card>
          <div className="flex flex-wrap gap-6 items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Total P&L (all followers)</p>
              <p className={`text-xl font-black ${totalPL >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {totalPL >= 0 ? '+' : ''}{formatCurrency(totalPL)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Estimated performance fees</p>
              <p className="text-xl font-black text-purple-600">{formatCurrency(totalFees)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Performance fee rate</p>
              <p className="text-xl font-black text-slate-700">{trader.performance_fee}%</p>
            </div>
            <div className="text-xs text-slate-400 max-w-xs">
              Performance fees are charged on profitable subscribers' gains and credited to your wallet automatically.
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
