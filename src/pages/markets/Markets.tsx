import { useEffect, useState, useCallback, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, RefreshCw, Activity,
  ArrowUpRight, ArrowDownRight, BarChart3, Star, X,
  ChevronDown, ExternalLink, CandlestickChart,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import { formatCurrency } from '@/lib/utils'

const TradingViewChart = lazy(() => import('@/components/ui/TradingViewChart'))

// ─── Static forex & commodity pairs ───────────────────────────────────────────
const STATIC_PAIRS = [
  { symbol: 'EUR/USD', price: 1.0842, change: 0.0012, changePct: 0.11,  category: 'Forex',       icon: '€/$' },
  { symbol: 'GBP/USD', price: 1.2670, change: -0.0034, changePct: -0.27, category: 'Forex',       icon: '£/$' },
  { symbol: 'USD/JPY', price: 157.43, change: 0.52,    changePct: 0.33,  category: 'Forex',       icon: '$/¥' },
  { symbol: 'AUD/USD', price: 0.6521, change: -0.0008, changePct: -0.12, category: 'Forex',       icon: 'A/$' },
  { symbol: 'USD/CAD', price: 1.3642, change: 0.0021,  changePct: 0.15,  category: 'Forex',       icon: '$/C$' },
  { symbol: 'EUR/GBP', price: 0.8558, change: 0.0009,  changePct: 0.11,  category: 'Forex',       icon: '€/£' },
  { symbol: 'USD/CHF', price: 0.9012, change: -0.0015, changePct: -0.17, category: 'Forex',       icon: '$/₣' },
  { symbol: 'NZD/USD', price: 0.6082, change: 0.0007,  changePct: 0.12,  category: 'Forex',       icon: 'NZ/$' },
  { symbol: 'XAU/USD', price: 2342.50, change: 8.40,   changePct: 0.36,  category: 'Commodities', icon: '🥇' },
  { symbol: 'XAG/USD', price: 29.84,  change: -0.32,   changePct: -1.06, category: 'Commodities', icon: '🥈' },
  { symbol: 'WTI/USD', price: 78.32,  change: 1.24,    changePct: 1.61,  category: 'Commodities', icon: '🛢' },
  { symbol: 'BRN/USD', price: 82.15,  change: 0.87,    changePct: 1.07,  category: 'Commodities', icon: '⛽' },
]

const CRYPTO_IDS = 'bitcoin,ethereum,tether,binancecoin,solana,ripple,cardano,dogecoin'
const CRYPTO_MAP: Record<string, { symbol: string; icon: string }> = {
  bitcoin:     { symbol: 'BTC/USD', icon: '₿'  },
  ethereum:    { symbol: 'ETH/USD', icon: 'Ξ'  },
  tether:      { symbol: 'USDT',    icon: '💵' },
  binancecoin: { symbol: 'BNB/USD', icon: '🔶' },
  solana:      { symbol: 'SOL/USD', icon: '◎'  },
  ripple:      { symbol: 'XRP/USD', icon: '✕'  },
  cardano:     { symbol: 'ADA/USD', icon: '🔵' },
  dogecoin:    { symbol: 'DOGE/USD', icon: '🐕' },
}

// Interval options for the chart toolbar
const INTERVALS: { label: string; value: string }[] = [
  { label: '1m',  value: '1'   },
  { label: '5m',  value: '5'   },
  { label: '15m', value: '15'  },
  { label: '1H',  value: '60'  },
  { label: '4H',  value: '240' },
  { label: '1D',  value: 'D'   },
  { label: '1W',  value: 'W'   },
]

interface Ticker {
  symbol: string
  icon: string
  price: number
  change: number
  changePct: number
  category: string
  volume?: string
  high24h?: number
  low24h?: number
  sparkline?: number[]
}

function generateSparkline(basePrice: number, changePct: number): number[] {
  const points: number[] = []
  let p = basePrice * (1 - changePct / 100)
  for (let i = 0; i < 24; i++) {
    p = p * (1 + (Math.random() - 0.49) * 0.004)
    points.push(Number(p.toFixed(6)))
  }
  points.push(basePrice)
  return points
}

function SparkLine({ data, up }: { data: number[]; up: boolean }) {
  const chartData = data.map((v, i) => ({ i, v }))
  return (
    <ResponsiveContainer width="100%" height={40}>
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="v" stroke={up ? '#22c55e' : '#ef4444'} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        <Tooltip contentStyle={{ display: 'none' }} wrapperStyle={{ display: 'none' }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

const CATEGORIES = ['All', 'Crypto', 'Forex', 'Commodities']

function fmt(n: number, symbol: string) {
  if (symbol.includes('JPY') || ['XAU/USD','WTI/USD','BRN/USD','XAG/USD'].includes(symbol))
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (n > 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (n < 0.01) return n.toFixed(6)
  return n.toFixed(4)
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04 } }),
}

export default function Markets() {
  const [tickers,    setTickers]    = useState<Ticker[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [category,   setCategory]   = useState('All')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Chart panel state
  const [chartSymbol,   setChartSymbol]   = useState<string | null>(null)
  const [chartInterval, setChartInterval] = useState('60')

  const fetchCrypto = useCallback(async () => {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${CRYPTO_IDS}&order=market_cap_desc&per_page=8&page=1&sparkline=true&price_change_percentage=24h`
      )
      if (!res.ok) throw new Error('API error')
      const data: any[] = await res.json()
      return data.map(coin => {
        const meta = CRYPTO_MAP[coin.id] ?? { symbol: coin.symbol.toUpperCase() + '/USD', icon: '🪙' }
        return {
          symbol: meta.symbol, icon: meta.icon,
          price: coin.current_price,
          change: coin.price_change_24h,
          changePct: coin.price_change_percentage_24h,
          category: 'Crypto',
          volume: coin.total_volume ? (coin.total_volume / 1e9).toFixed(2) + 'B' : undefined,
          high24h: coin.high_24h, low24h: coin.low_24h,
          sparkline: coin.sparkline_in_7d?.price?.slice(-24) ?? generateSparkline(coin.current_price, coin.price_change_percentage_24h ?? 0),
        } as Ticker
      })
    } catch {
      return [
        { symbol: 'BTC/USD', icon: '₿',  price: 65320, change: 840,  changePct: 1.30,  category: 'Crypto' },
        { symbol: 'ETH/USD', icon: 'Ξ',  price: 3480,  change: -42,  changePct: -1.19, category: 'Crypto' },
        { symbol: 'BNB/USD', icon: '🔶', price: 582,   change: 8.2,  changePct: 1.43,  category: 'Crypto' },
        { symbol: 'SOL/USD', icon: '◎',  price: 168,   change: 3.1,  changePct: 1.88,  category: 'Crypto' },
      ].map(t => ({ ...t, sparkline: generateSparkline(t.price, t.changePct) }))
    }
  }, [])

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    const cryptoTickers = await fetchCrypto()
    const staticTickers: Ticker[] = STATIC_PAIRS.map(p => ({ ...p, sparkline: generateSparkline(p.price, p.changePct) }))
    const all = [...cryptoTickers, ...staticTickers]
    setTickers(all)
    setLastUpdated(new Date())
    setLoading(false)
    setRefreshing(false)
    // Auto-select BTC/USD for chart on first load
    if (!chartSymbol) setChartSymbol('BTC/USD')
  }, [fetchCrypto, chartSymbol])

  useEffect(() => {
    loadData()
    const interval = setInterval(() => loadData(true), 30000)
    return () => clearInterval(interval)
  }, [loadData])

  // Simulate live price ticks
  useEffect(() => {
    const id = setInterval(() => {
      setTickers(prev => prev.map(t => {
        const drift = (Math.random() - 0.499) * t.price * 0.0003
        const newPrice = Math.max(0, t.price + drift)
        const newSparkline = [...(t.sparkline ?? []).slice(1), newPrice]
        return { ...t, price: newPrice, sparkline: newSparkline }
      }))
    }, 3000)
    return () => clearInterval(id)
  }, [])

  const filtered      = tickers.filter(t => category === 'All' || t.category === category)
  const cryptoPrices  = tickers.filter(t => t.category === 'Crypto').slice(0, 4)
  const selectedTicker = tickers.find(t => t.symbol === chartSymbol)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Markets</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading live prices…'}
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          className={`flex items-center gap-2 text-sm text-slate-600 hover:text-[#1E40AF] transition-colors px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:border-[#3B82F6] ${refreshing ? 'opacity-60 pointer-events-none' : ''}`}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Top crypto cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(loading ? Array(4).fill(null) : cryptoPrices).map((t, i) => (
          <motion.div
            key={t?.symbol ?? i}
            custom={i}
            initial="hidden"
            animate="show"
            variants={fadeUp}
            onClick={() => t && setChartSymbol(t.symbol)}
            className={t ? 'cursor-pointer' : ''}
          >
            {!t ? (
              <div className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
            ) : (
              <Card hover className={`relative overflow-hidden transition-all ${chartSymbol === t.symbol ? 'ring-2 ring-[#1E40AF] ring-offset-1' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg">{t.icon}</span>
                  <span className={`text-xs font-semibold flex items-center gap-0.5 ${t.changePct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {t.changePct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {Math.abs(t.changePct).toFixed(2)}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-0.5">{t.symbol}</p>
                <p className="text-lg font-black text-slate-900">{formatCurrency(t.price)}</p>
                <div className="mt-2">
                  <SparkLine data={t.sparkline ?? []} up={t.changePct >= 0} />
                </div>
                {chartSymbol === t.symbol && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-[#1E40AF] rounded-full animate-pulse" />
                )}
              </Card>
            )}
          </motion.div>
        ))}
      </div>

      {/* ── TradingView Chart Panel ─────────────────────────────── */}
      <AnimatePresence mode="wait">
        {chartSymbol && (
          <motion.div
            key={chartSymbol}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <Card padding="none" className="overflow-hidden">
              {/* Chart header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {selectedTicker?.icon ?? '📊'}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{chartSymbol}</p>
                    {selectedTicker && (
                      <p className={`text-xs font-semibold flex items-center gap-0.5 ${selectedTicker.changePct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {selectedTicker.changePct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {selectedTicker.price > 100 ? formatCurrency(selectedTicker.price) : fmt(selectedTicker.price, selectedTicker.symbol)}
                        &nbsp;({selectedTicker.changePct >= 0 ? '+' : ''}{selectedTicker.changePct.toFixed(2)}%)
                      </p>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium ml-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    LIVE
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Interval selector */}
                  <div className="hidden sm:flex gap-0.5 bg-slate-100 rounded-lg p-0.5">
                    {INTERVALS.map(iv => (
                      <button
                        key={iv.value}
                        onClick={() => setChartInterval(iv.value)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${chartInterval === iv.value ? 'bg-white text-[#1E40AF] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        {iv.label}
                      </button>
                    ))}
                  </div>
                  {/* Mobile interval dropdown */}
                  <div className="sm:hidden relative">
                    <select
                      value={chartInterval}
                      onChange={e => setChartInterval(e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-[#1E40AF]"
                    >
                      {INTERVALS.map(iv => <option key={iv.value} value={iv.value}>{iv.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  </div>
                  <a
                    href={`https://www.tradingview.com/chart/?symbol=${chartSymbol.replace('/', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-[#1E40AF] transition-colors rounded-lg hover:bg-slate-100"
                    title="Open in TradingView"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setChartSymbol(null)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                    title="Close chart"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* TradingView Chart */}
              <Suspense fallback={
                <div className="flex items-center justify-center bg-slate-50" style={{ height: 520 }}>
                  <div className="text-center">
                    <div className="w-10 h-10 border-2 border-[#1E40AF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Loading chart…</p>
                  </div>
                </div>
              }>
                <TradingViewChart
                  key={`${chartSymbol}-${chartInterval}`}
                  symbol={chartSymbol}
                  interval={chartInterval as any}
                  theme="light"
                  height={660}
                  allowSymbolChange={true}
                />
              </Suspense>

              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 flex items-center gap-1">
                <span>Chart powered by</span>
                <a href="https://www.tradingview.com" target="_blank" rel="noopener noreferrer" className="text-[#1E40AF] font-medium hover:underline">TradingView</a>
                <span>· Click any row below to switch pair</span>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full ticker table */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#1E40AF]" />
            <h3 className="font-bold text-slate-900">Live Prices</h3>
            <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              LIVE
            </span>
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${category === cat ? 'bg-white text-[#1E40AF] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Pair', 'Category', 'Price (USD)', '24h Change', '24h Range', 'Trend', 'Chart', 'Trade'].map((h, idx) => (
                    <th key={idx} className={`pb-3 text-xs font-semibold text-slate-400 uppercase tracking-wide pr-4 ${idx === 0 ? 'text-left pl-1' : 'text-right'} ${idx === 6 ? 'w-8' : ''}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((t, i) => {
                  const up = t.changePct >= 0
                  const isSelected = chartSymbol === t.symbol
                  return (
                    <motion.tr
                      key={t.symbol}
                      custom={i}
                      initial="hidden"
                      animate="show"
                      variants={fadeUp}
                      onClick={() => setChartSymbol(t.symbol)}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/70 hover:bg-blue-50' : 'hover:bg-slate-50/70'}`}
                    >
                      <td className="py-3 pr-4 pl-1">
                        <div className="flex items-center gap-2.5">
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#1E40AF] flex-shrink-0" />}
                          <span className="text-lg w-7 text-center">{t.icon}</span>
                          <div>
                            <p className={`font-semibold ${isSelected ? 'text-[#1E40AF]' : 'text-slate-900'}`}>{t.symbol}</p>
                            {t.volume && <p className="text-xs text-slate-400">Vol: ${t.volume}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{t.category}</span>
                      </td>
                      <td className="py-3 pr-4 text-right font-mono font-semibold text-slate-900">
                        {t.price > 100 ? formatCurrency(t.price) : fmt(t.price, t.symbol)}
                      </td>
                      <td className={`py-3 pr-4 text-right font-semibold ${up ? 'text-green-600' : 'text-red-500'}`}>
                        <span className="flex items-center justify-end gap-0.5">
                          {up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          {up ? '+' : ''}{t.changePct.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right text-xs text-slate-400">
                        {t.high24h ? (
                          <span>H: {fmt(t.high24h, t.symbol)}<br />L: {fmt(t.low24h ?? 0, t.symbol)}</span>
                        ) : '—'}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <div className="w-24 ml-auto">
                          <SparkLine data={t.sparkline ?? []} up={up} />
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <BarChart3 className={`w-3.5 h-3.5 ml-auto ${isSelected ? 'text-[#1E40AF]' : 'text-slate-200'}`} />
                      </td>
                      <td className="py-3 pl-2 text-right">
                        <Link
                          to="/trading"
                          onClick={e => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-[#1E40AF] hover:bg-[#1E3A8A] px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap"
                          title={`Trade ${t.symbol}`}
                        >
                          <CandlestickChart className="w-3 h-3" /> Trade
                        </Link>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100">
          ⚠️ Prices are indicative only. Forex & commodity rates are simulated. Crypto prices from CoinGecko. Live charts powered by TradingView. Not financial advice.
        </p>
      </Card>

      {/* Market summary row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Market Sentiment', value: 'Greed', score: 72, color: 'text-green-600', bg: 'bg-green-50', icon: TrendingUp },
          { label: 'BTC Dominance', value: '52.4%', score: 52, color: 'text-[#1E40AF]', bg: 'bg-blue-50', icon: BarChart3 },
          { label: 'Active Pairs', value: filtered.length.toString(), score: 100, color: 'text-purple-600', bg: 'bg-purple-50', icon: Star },
        ].map(stat => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-500">{stat.label}</p>
                <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
