import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, TrendingUp, TrendingDown, Search, RefreshCw,
  Download, ChevronLeft, ChevronRight, Users, DollarSign,
  BarChart3, Zap,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminTrade {
  id: string
  user_id: string
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
  created_at: string
  users?: { full_name: string; email: string }
}

interface LivePrice {
  symbol: string
  price: number
}

// ─── Static prices for non-crypto pairs ──────────────────────────────────────

const STATIC_PRICES: Record<string, number> = {
  'EUR/USD': 1.0842, 'GBP/USD': 1.2670, 'USD/JPY': 157.43,
  'AUD/USD': 0.6521, 'USD/CHF': 0.9012,
  'XAU/USD': 2342.50, 'WTI/USD': 78.32,
}

const CRYPTO_IDS = 'bitcoin,ethereum,binancecoin,solana,ripple'
const CRYPTO_SYMBOL_MAP: Record<string, string> = {
  bitcoin: 'BTC/USD', ethereum: 'ETH/USD', binancecoin: 'BNB/USD',
  solana: 'SOL/USD', ripple: 'XRP/USD',
}

const PAGE_SIZE = 30
const STATUS_FILTERS = ['all', 'open', 'closed', 'cancelled']
const DIRECTION_FILTERS = ['all', 'buy', 'sell']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcLivePnl(trade: AdminTrade, prices: LivePrice[]) {
  if (trade.status !== 'open') {
    return { pnl: trade.profit_loss, pct: trade.profit_loss_pct, currentPrice: trade.close_price ?? trade.entry_price }
  }
  const lp = prices.find(p => p.symbol === trade.symbol)
  const currentPrice = lp?.price ?? trade.entry_price
  const diff = currentPrice - trade.entry_price
  const rawPct = (diff / trade.entry_price) * 100 * trade.leverage
  const pct = trade.direction === 'buy' ? rawPct : -rawPct
  const pnl = trade.amount_usdt * (pct / 100)
  return { pnl, pct, currentPrice }
}

function exportCSV(trades: AdminTrade[], prices: LivePrice[]) {
  const header = 'User,Email,Symbol,Direction,Stake (USDT),Leverage,Entry Price,Current Price,P&L ($),P&L (%),Status,Opened At,Closed At'
  const rows = trades.map(t => {
    const { pnl, pct, currentPrice } = calcLivePnl(t, prices)
    return [
      t.users?.full_name ?? 'Unknown',
      t.users?.email ?? '',
      t.symbol,
      t.direction,
      t.amount_usdt,
      `${t.leverage}x`,
      t.entry_price,
      currentPrice.toFixed(4),
      pnl.toFixed(2),
      pct.toFixed(2) + '%',
      t.status,
      format(new Date(t.opened_at), 'yyyy-MM-dd HH:mm'),
      t.closed_at ? format(new Date(t.closed_at), 'yyyy-MM-dd HH:mm') : '',
    ].join(',')
  })
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `live_trades_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function fmt(n: number, symbol: string) {
  if (symbol.includes('JPY') || ['XAU/USD', 'WTI/USD'].includes(symbol))
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (n > 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (n < 0.01) return n.toFixed(6)
  return n.toFixed(4)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminLiveTrades() {
  const [trades, setTrades]       = useState<AdminTrade[]>([])
  const [loading, setLoading]     = useState(true)
  const [prices, setPrices]       = useState<LivePrice[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState('all')
  const [dirFilter, setDirFilter]         = useState('all')
  const [page, setPage]                   = useState(1)

  // ── Fetch all trades (admin sees everything) ───────────────────────────────
  const fetchTrades = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    const { data, error } = await supabase
      .from('user_trades' as any)
      .select('*, users(full_name, email)')
      .order('opened_at', { ascending: false })
      .limit(1000)

    if (!error) {
      setTrades((data ?? []) as AdminTrade[])
      setLastRefreshed(new Date())
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  // ── Fetch live crypto prices ───────────────────────────────────────────────
  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${CRYPTO_IDS}&order=market_cap_desc&per_page=5&page=1&sparkline=false`
      )
      if (!res.ok) return
      const data: any[] = await res.json()
      const cryptoPrices: LivePrice[] = data.map(coin => ({
        symbol: CRYPTO_SYMBOL_MAP[coin.id] ?? coin.symbol.toUpperCase() + '/USD',
        price: coin.current_price,
      }))
      const staticPrices: LivePrice[] = Object.entries(STATIC_PRICES).map(([symbol, price]) => ({
        symbol,
        price: price * (1 + (Math.random() - 0.5) * 0.001), // tiny drift
      }))
      setPrices([...cryptoPrices, ...staticPrices])
    } catch {
      // Keep existing prices on error
    }
  }, [])

  // ── Mount: fetch data + start live price ticks ─────────────────────────────
  useEffect(() => {
    fetchTrades()
    fetchPrices()

    // Auto-refresh trades every 30 seconds
    const tradeInterval = window.setInterval(() => fetchTrades(true), 30_000)
    // Refresh prices every 15 seconds
    const priceInterval = window.setInterval(fetchPrices, 15_000)
    // Simulate micro price ticks every 2 seconds for open trades
    const tickInterval = window.setInterval(() => {
      setPrices(prev => prev.map(p => ({
        ...p,
        price: Math.max(0, p.price * (1 + (Math.random() - 0.499) * 0.0003)),
      })))
    }, 2_000)

    // Realtime: new or updated trades
    const channel = supabase
      .channel('admin-trades-monitor')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_trades' },
        () => fetchTrades(true))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_trades' },
        () => fetchTrades(true))
      .subscribe()

    return () => {
      window.clearInterval(tradeInterval)
      window.clearInterval(priceInterval)
      window.clearInterval(tickInterval)
      supabase.removeChannel(channel)
    }
  }, [fetchTrades, fetchPrices])

  // ── Filter + search ───────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = trades
    if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter)
    if (dirFilter !== 'all')    result = result.filter(t => t.direction === dirFilter)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(t =>
        t.symbol.toLowerCase().includes(q) ||
        t.users?.full_name?.toLowerCase().includes(q) ||
        t.users?.email?.toLowerCase().includes(q)
      )
    }
    return result
  }, [trades, statusFilter, dirFilter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // ── Summary stats ─────────────────────────────────────────────────────────
  const openTrades    = trades.filter(t => t.status === 'open')
  const closedTrades  = trades.filter(t => t.status === 'closed')
  const uniqueTraders = new Set(trades.map(t => t.user_id)).size

  const totalOpenPnl = openTrades.reduce((sum, t) => {
    const { pnl } = calcLivePnl(t, prices)
    return sum + pnl
  }, 0)

  const totalClosedPnl = closedTrades.reduce((sum, t) => sum + t.profit_loss, 0)
  const totalVolume    = trades.reduce((sum, t) => sum + Number(t.amount_usdt), 0)

  const statCards = [
    {
      label: 'Open Positions',
      value: openTrades.length.toString(),
      sub: `${uniqueTraders} trader${uniqueTraders !== 1 ? 's' : ''}`,
      icon: Activity,
      color: 'bg-blue-50 text-blue-600',
      pulse: openTrades.length > 0,
    },
    {
      label: 'Live Unrealised P&L',
      value: (totalOpenPnl >= 0 ? '+' : '') + formatCurrency(totalOpenPnl),
      sub: 'Across all open positions',
      icon: totalOpenPnl >= 0 ? TrendingUp : TrendingDown,
      color: totalOpenPnl >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600',
    },
    {
      label: 'Realised P&L',
      value: (totalClosedPnl >= 0 ? '+' : '') + formatCurrency(totalClosedPnl),
      sub: `${closedTrades.length} closed trades`,
      icon: BarChart3,
      color: totalClosedPnl >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600',
    },
    {
      label: 'Total Volume',
      value: formatCurrency(totalVolume),
      sub: `${trades.length} total trades`,
      icon: DollarSign,
      color: 'bg-purple-50 text-purple-600',
    },
  ]

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Live Trade Monitor</h1>
            {openTrades.length > 0 && (
              <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                {openTrades.length} LIVE
              </span>
            )}
          </div>
          <p className="text-slate-500 text-sm mt-0.5">
            {filtered.length} trades · last synced {format(lastRefreshed, 'HH:mm:ss')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { fetchTrades(true); fetchPrices() }}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => exportCSV(filtered, prices)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading
          ? [...Array(4)].map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />)
          : statCards.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card hover>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-slate-500">{s.label}</p>
                    <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center relative`}>
                      <s.icon className="w-4 h-4" />
                      {s.pulse && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      )}
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
                </Card>
              </motion.div>
            ))}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <Input
          placeholder="Search by user name, email or symbol…"
          leftIcon={<Search className="w-4 h-4" />}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-medium text-slate-400 self-center">Status:</span>
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
              {s === 'open' && openTrades.length > 0 && (
                <span className="ml-1.5 bg-white/20 text-white text-[10px] px-1 py-0.5 rounded-full">
                  {statusFilter === 'open' ? '' : openTrades.length}
                </span>
              )}
            </button>
          ))}
          <span className="text-xs font-medium text-slate-400 self-center ml-3">Direction:</span>
          {DIRECTION_FILTERS.map(d => (
            <button
              key={d}
              onClick={() => { setDirFilter(d); setPage(1) }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
                dirFilter === d
                  ? d === 'buy'
                    ? 'bg-green-500 text-white'
                    : d === 'sell'
                    ? 'bg-red-500 text-white'
                    : 'bg-[#1E40AF] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
              }`}
            >
              {d === 'buy' ? '▲ Buy' : d === 'sell' ? '▼ Sell' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Trader', 'Symbol', 'Dir', 'Stake', 'Lev', 'Entry', 'Current', 'P&L ($)', 'P&L (%)', 'Status', 'Opened', 'Closed'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(12)].map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-16">
                    <Activity className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">No trades match these filters.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((trade, i) => {
                  const { pnl, pct, currentPrice } = calcLivePnl(trade, prices)
                  const isProfit = pnl >= 0
                  const isBuy    = trade.direction === 'buy'
                  const isOpen   = trade.status === 'open'

                  return (
                    <motion.tr
                      key={trade.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.01 }}
                      className={`hover:bg-slate-50/60 ${isOpen ? 'bg-blue-50/20' : ''}`}
                    >
                      {/* Trader */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {trade.users?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-slate-800 truncate max-w-[110px]">
                              {trade.users?.full_name ?? 'Unknown'}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[110px]">
                              {trade.users?.email ?? ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Symbol */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-slate-900">{trade.symbol}</span>
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
                        <span className="text-xs font-semibold text-slate-900">{formatCurrency(trade.amount_usdt)}</span>
                      </td>

                      {/* Leverage */}
                      <td className="px-4 py-3">
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                          {trade.leverage}×
                        </span>
                      </td>

                      {/* Entry */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono text-slate-600">{fmt(trade.entry_price, trade.symbol)}</span>
                      </td>

                      {/* Current / Close price */}
                      <td className="px-4 py-3">
                        <span className={`text-xs font-mono font-semibold ${isOpen ? 'text-[#1E40AF]' : 'text-slate-600'}`}>
                          {fmt(currentPrice, trade.symbol)}
                          {isOpen && (
                            <span className="ml-1 text-[9px] text-blue-400 font-normal">LIVE</span>
                          )}
                        </span>
                      </td>

                      {/* P&L $ */}
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold ${isProfit ? 'text-green-600' : 'text-red-500'}`}>
                          {isProfit ? '+' : ''}{formatCurrency(pnl)}
                        </span>
                      </td>

                      {/* P&L % */}
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${isProfit ? 'text-green-500' : 'text-red-400'}`}>
                          {isProfit ? '+' : ''}{pct.toFixed(2)}%
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {trade.status === 'open' ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-lg w-fit">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            Open
                          </span>
                        ) : trade.status === 'closed' ? (
                          <Badge variant="default" size="sm">Closed</Badge>
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
        {!loading && filtered.length > 0 && (
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
