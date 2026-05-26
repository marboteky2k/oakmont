import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import type { TradeSignal, CopyTrader } from '@/types/database'

type SignalWithTrader = TradeSignal & { copy_traders?: CopyTrader }

const STATUS_FILTERS = ['all', 'open', 'closed', 'cancelled']
const DIR_FILTERS = ['all', 'buy', 'sell']

export default function AdminTradeSignals() {
  const [signals, setSignals] = useState<SignalWithTrader[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dirFilter, setDirFilter] = useState('all')

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      let query = supabase
        .from('trade_signals')
        .select('*, copy_traders(display_name, win_rate, monthly_return_pct)')
        .order('opened_at', { ascending: false })
        .limit(200)
      if (statusFilter !== 'all') query = query.eq('status', statusFilter)
      if (dirFilter !== 'all') query = query.eq('direction', dirFilter)
      const { data } = await query
      setSignals((data ?? []) as SignalWithTrader[])
      setLoading(false)
    }
    fetch()
  }, [statusFilter, dirFilter])

  const filtered = useMemo(() => {
    if (!search) return signals
    const q = search.toLowerCase()
    return signals.filter(
      (s) =>
        s.pair.toLowerCase().includes(q) ||
        s.copy_traders?.display_name?.toLowerCase().includes(q),
    )
  }, [signals, search])

  const stats = useMemo(() => ({
    open: signals.filter((s) => s.status === 'open').length,
    closed: signals.filter((s) => s.status === 'closed').length,
    profitable: signals.filter((s) => (s.profit_usd ?? 0) > 0).length,
    totalPnL: signals.reduce((sum, s) => sum + (s.profit_usd ?? 0), 0),
  }), [signals])

  const statusIcon = (status: string) => {
    if (status === 'open') return <Clock className="w-3.5 h-3.5 text-blue-500" />
    if (status === 'closed') return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
    return <XCircle className="w-3.5 h-3.5 text-red-500" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Trade Signals</h1>
        <p className="text-slate-500 text-sm mt-1">All signals across all copy traders.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Open Positions', value: stats.open.toString(), color: 'bg-blue-50 text-blue-600' },
          { label: 'Closed Trades', value: stats.closed.toString(), color: 'bg-green-50 text-green-600' },
          { label: 'Profitable Closes', value: stats.profitable.toString(), color: 'bg-purple-50 text-purple-600' },
          { label: 'Total P&L', value: `${stats.totalPnL >= 0 ? '+' : ''}$${stats.totalPnL.toFixed(2)}`, color: stats.totalPnL >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600' },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card>
              <p className="text-xs text-slate-500 mb-1">{c.label}</p>
              <p className={`text-2xl font-bold ${c.color.split(' ')[1]}`}>{c.value}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-48">
          <Input
            placeholder="Search pair or trader…"
            leftIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${statusFilter === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {DIR_FILTERS.map((d) => (
            <button
              key={d}
              onClick={() => setDirFilter(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${dirFilter === d ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Trader', 'Pair', 'Dir', 'Entry', 'SL', 'TP', 'Lots', 'P&L', 'Status', 'Opened'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(10)].map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16">
                    <TrendingUp className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">No signals found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-slate-800">
                        {s.copy_traders?.display_name ?? 'Unknown Trader'}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">{s.pair}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-0.5 w-fit ${s.direction === 'buy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {s.direction === 'buy' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {s.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 text-xs">{s.entry_price.toFixed(4)}</td>
                    <td className="px-4 py-3 font-mono text-red-500 text-xs">{s.stop_loss.toFixed(4)}</td>
                    <td className="px-4 py-3 font-mono text-green-600 text-xs">{s.take_profit.toFixed(4)}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs">{s.lot_size.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      {s.profit_usd != null ? (
                        <span className={`font-semibold text-xs ${s.profit_usd >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {s.profit_usd >= 0 ? '+' : ''}${s.profit_usd.toFixed(2)}
                        </span>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {statusIcon(s.status)}
                        <span className="text-xs text-slate-500 capitalize">{s.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {format(parseISO(s.opened_at), 'MMM d, HH:mm')}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && (
          <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
            Showing {filtered.length} of {signals.length} signals
          </div>
        )}
      </Card>
    </div>
  )
}
