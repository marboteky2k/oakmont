import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  History, TrendingUp, TrendingDown, Search,
  ChevronLeft, ChevronRight, Trophy, BarChart3,
  DollarSign, Activity, Filter,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Trade {
  id: string
  symbol: string
  direction: 'buy' | 'sell'
  amount_usdt: number
  entry_price: number
  close_price: number | null
  profit_loss: number
  profit_loss_pct: number
  leverage: number
  status: 'open' | 'closed' | 'cancelled'
  opened_at: string
  closed_at: string | null
}

const PAGE_SIZE = 20
const STATUS_FILTERS = ['all', 'open', 'closed', 'cancelled']
const DIRECTION_FILTERS = ['all', 'buy', 'sell']

function fmt(n: number, symbol: string) {
  if (symbol.includes('JPY') || ['XAU/USD', 'WTI/USD'].includes(symbol))
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (n > 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (n < 0.01) return n.toFixed(6)
  return n.toFixed(4)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TradeHistory() {
  const { profile } = useAuth()
  const [trades, setTrades]       = useState<Trade[]>([])
  const [loading, setLoading]     = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [dirFilter, setDirFilter]       = useState('all')
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(1)

  useEffect(() => {
    if (!profile) return
    const fetch = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('user_trades' as any)
        .select('*')
        .eq('user_id', profile.id)
        .order('opened_at', { ascending: false })
        .limit(500)
      setTrades((data ?? []) as Trade[])
      setLoading(false)
    }
    fetch()

    // Realtime: new trade opened or closed
    const channel = supabase
      .channel(`trade-history:${profile.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_trades', filter: `user_id=eq.${profile.id}` },
        payload => setTrades(prev => [payload.new as Trade, ...prev])
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'user_trades', filter: `user_id=eq.${profile.id}` },
        payload => setTrades(prev => prev.map(t => t.id === (payload.new as Trade).id ? payload.new as Trade : t))
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile?.id])

  // ── Filtered + paginated ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let r = trades
    if (statusFilter !== 'all') r = r.filter(t => t.status === statusFilter)
    if (dirFilter !== 'all')    r = r.filter(t => t.direction === dirFilter)
    if (search) {
      const q = search.toLowerCase()
      r = r.filter(t => t.symbol.toLowerCase().includes(q))
    }
    return r
  }, [trades, statusFilter, dirFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Stats ─────────────────────────────────────────────────────────────────
  const closedTrades = trades.filter(t => t.status === 'closed')
  const openTrades   = trades.filter(t => t.status === 'open')
  const winTrades    = closedTrades.filter(t => t.profit_loss > 0)
  const winRate      = closedTrades.length > 0 ? (winTrades.length / closedTrades.length) * 100 : 0
  const totalPnl     = closedTrades.reduce((s, t) => s + Number(t.profit_loss), 0)
  const totalVolume  = trades.reduce((s, t) => s + Number(t.amount_usdt), 0)
  const bestTrade    = closedTrades.reduce((best, t) =>
    Number(t.profit_loss) > Number(best?.profit_loss ?? -Infinity) ? t : best,
    null as Trade | null
  )

  const statCards = [
    {
      label: 'Total Trades',
      value: trades.length.toString(),
      sub: `${openTrades.length} open · ${closedTrades.length} closed`,
      icon: Activity,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Win Rate',
      value: winRate > 0 ? `${winRate.toFixed(1)}%` : '—',
      sub: `${winTrades.length} winning trades`,
      icon: Trophy,
      color: winRate >= 50 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600',
    },
    {
      label: 'Total Realised P&L',
      value: closedTrades.length > 0 ? (totalPnl >= 0 ? '+' : '') + formatCurrency(totalPnl) : '—',
      sub: 'From closed positions',
      icon: totalPnl >= 0 ? TrendingUp : TrendingDown,
      color: totalPnl >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600',
    },
    {
      label: 'Total Volume',
      value: formatCurrency(totalVolume),
      sub: bestTrade ? `Best: +${formatCurrency(bestTrade.profit_loss)}` : 'No closed trades yet',
      icon: BarChart3,
      color: 'bg-purple-50 text-purple-600',
    },
  ]

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trade History</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
            {openTrades.length > 0 && (
              <span className="ml-2 text-green-600 font-medium">
                · {openTrades.length} position{openTrades.length !== 1 ? 's' : ''} live
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? [...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)
          : statCards.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
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

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <Input
          placeholder="Search by symbol (BTC/USD, EUR/USD…)"
          leftIcon={<Search className="w-4 h-4" />}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
                statusFilter === s
                  ? 'bg-[#1E40AF] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
              }`}
            >
              {s}
              {s === 'open' && openTrades.length > 0 && statusFilter !== 'open' && (
                <span className="ml-1 text-[10px] bg-green-500 text-white px-1 py-0.5 rounded-full">
                  {openTrades.length}
                </span>
              )}
            </button>
          ))}
          <span className="text-slate-300 mx-1">|</span>
          {DIRECTION_FILTERS.map(d => (
            <button
              key={d}
              onClick={() => { setDirFilter(d); setPage(1) }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                dirFilter === d
                  ? d === 'buy'
                    ? 'bg-green-500 text-white'
                    : d === 'sell'
                    ? 'bg-red-500 text-white'
                    : 'bg-[#1E40AF] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
              }`}
            >
              {d === 'buy' ? '▲ Buy' : d === 'sell' ? '▼ Sell' : 'Both'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Symbol', 'Direction', 'Stake', 'Leverage', 'Entry Price', 'Close Price', 'P&L', 'P&L %', 'Status', 'Opened', 'Closed'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(11)].map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center">
                    <History className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No trades found</p>
                    <p className="text-slate-300 text-xs mt-1">Place your first trade on the Live Trading page</p>
                  </td>
                </tr>
              ) : (
                paginated.map((trade, i) => {
                  const isOpen   = trade.status === 'open'
                  const isBuy    = trade.direction === 'buy'
                  const pnl      = Number(trade.profit_loss)
                  const pct      = Number(trade.profit_loss_pct)
                  const isProfit = pnl >= 0

                  return (
                    <motion.tr
                      key={trade.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className={`hover:bg-slate-50/60 ${isOpen ? 'bg-green-50/20' : ''}`}
                    >
                      {/* Symbol */}
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 text-sm">{trade.symbol}</span>
                      </td>

                      {/* Direction */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg ${
                          isBuy ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {isBuy ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {trade.direction.toUpperCase()}
                        </span>
                      </td>

                      {/* Stake */}
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-slate-900">{formatCurrency(trade.amount_usdt)}</span>
                      </td>

                      {/* Leverage */}
                      <td className="px-4 py-3">
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                          {trade.leverage}×
                        </span>
                      </td>

                      {/* Entry */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-slate-600">
                          {fmt(trade.entry_price, trade.symbol)}
                        </span>
                      </td>

                      {/* Close price */}
                      <td className="px-4 py-3">
                        {trade.close_price != null ? (
                          <span className="text-xs font-mono text-slate-600">
                            {fmt(trade.close_price, trade.symbol)}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300 italic">
                            {isOpen ? 'Live' : '—'}
                          </span>
                        )}
                      </td>

                      {/* P&L $ */}
                      <td className="px-4 py-3">
                        {isOpen ? (
                          <span className="text-xs text-slate-400 italic">Open</span>
                        ) : (
                          <span className={`text-sm font-bold ${isProfit ? 'text-green-600' : 'text-red-500'}`}>
                            {isProfit ? '+' : ''}{formatCurrency(pnl)}
                          </span>
                        )}
                      </td>

                      {/* P&L % */}
                      <td className="px-4 py-3">
                        {isOpen ? (
                          <span className="text-xs text-slate-400 italic">—</span>
                        ) : (
                          <span className={`text-xs font-semibold ${isProfit ? 'text-green-500' : 'text-red-400'}`}>
                            {isProfit ? '+' : ''}{pct.toFixed(2)}%
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {isOpen ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-lg w-fit">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            Open
                          </span>
                        ) : trade.status === 'closed' ? (
                          <Badge variant={isProfit ? 'success' : 'danger'} size="sm">
                            {isProfit ? '▲ Win' : '▼ Loss'}
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm">Cancelled</Badge>
                        )}
                      </td>

                      {/* Opened */}
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {format(new Date(trade.opened_at), 'MMM d, HH:mm')}
                      </td>

                      {/* Closed */}
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {trade.closed_at
                          ? format(new Date(trade.closed_at), 'MMM d, HH:mm')
                          : <span className="text-slate-300">—</span>
                        }
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(pg => (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${
                    pg === page ? 'bg-[#1E40AF] text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pg}
                </button>
              ))}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
