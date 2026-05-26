import { useEffect, useState, useCallback, lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, TrendingDown, RefreshCw, ArrowUpRight, ArrowDownRight,
  ChevronDown, Activity, Wallet, Clock,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

const TradingViewChart = lazy(() => import('@/components/ui/TradingViewChart'))

// ─── Static pairs ─────────────────────────────────────────────
const STATIC_PAIRS = [
  { symbol: 'EUR/USD', price: 1.0842, changePct: 0.11,  category: 'Forex',       icon: '€/$' },
  { symbol: 'GBP/USD', price: 1.2670, changePct: -0.27, category: 'Forex',       icon: '£/$' },
  { symbol: 'USD/JPY', price: 157.43, changePct: 0.33,  category: 'Forex',       icon: '$/¥' },
  { symbol: 'AUD/USD', price: 0.6521, changePct: -0.12, category: 'Forex',       icon: 'A/$' },
  { symbol: 'USD/CHF', price: 0.9012, changePct: -0.17, category: 'Forex',       icon: '$/₣' },
  { symbol: 'XAU/USD', price: 2342.50, changePct: 0.36, category: 'Commodities', icon: '🥇' },
  { symbol: 'WTI/USD', price: 78.32, changePct: 1.61,   category: 'Commodities', icon: '🛢' },
]

const CRYPTO_IDS = 'bitcoin,ethereum,binancecoin,solana,ripple'
const CRYPTO_MAP: Record<string, { symbol: string; icon: string }> = {
  bitcoin:     { symbol: 'BTC/USD', icon: '₿' },
  ethereum:    { symbol: 'ETH/USD', icon: 'Ξ' },
  binancecoin: { symbol: 'BNB/USD', icon: '🔶' },
  solana:      { symbol: 'SOL/USD', icon: '◎' },
  ripple:      { symbol: 'XRP/USD', icon: '✕' },
}

const INTERVALS = [
  { label: '1m', value: '1' }, { label: '5m', value: '5' },
  { label: '15m', value: '15' }, { label: '1H', value: '60' },
  { label: '4H', value: '240' }, { label: '1D', value: 'D' },
]

const LEVERAGE_OPTIONS = [1, 2, 5, 10, 20]

interface Ticker {
  symbol: string; icon: string; price: number
  changePct: number; category: string
}

interface UserTrade {
  id: string; symbol: string; direction: 'buy' | 'sell'
  amount_usdt: number; entry_price: number
  leverage: number; status: string
  opened_at: string; profit_loss: number; profit_loss_pct: number
}

function fmt(n: number, symbol: string) {
  if (symbol.includes('JPY') || ['XAU/USD', 'WTI/USD', 'XAG/USD'].includes(symbol))
    return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (n > 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (n < 0.01) return n.toFixed(6)
  return n.toFixed(4)
}

export default function Trading() {
  const { profile } = useAuth()

  const [tickers, setTickers] = useState<Ticker[]>([])
  const [loadingTickers, setLoadingTickers] = useState(true)
  const [activeSymbol, setActiveSymbol] = useState('BTC/USD')
  const [interval, setInterval] = useState('60')
  const [category, setCategory] = useState('All')
  const [walletBalance, setWalletBalance] = useState(0)
  const [trades, setTrades] = useState<UserTrade[]>([])
  const [tradesLoading, setTradesLoading] = useState(true)

  // Order form state
  const [direction, setDirection] = useState<'buy' | 'sell'>('buy')
  const [orderAmount, setOrderAmount] = useState('')
  const [leverage, setLeverage] = useState(1)
  const [placing, setPlacing] = useState(false)
  const [closingId, setClosingId] = useState<string | null>(null)

  const selectedTicker = tickers.find(t => t.symbol === activeSymbol)

  // ── Fetch tickers ─────────────────────────────────────────
  const loadTickers = useCallback(async () => {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${CRYPTO_IDS}&order=market_cap_desc&per_page=5&page=1&sparkline=false&price_change_percentage=24h`
      )
      const data: any[] = res.ok ? await res.json() : []
      const cryptoTickers: Ticker[] = data.map(coin => {
        const meta = CRYPTO_MAP[coin.id] ?? { symbol: coin.symbol.toUpperCase() + '/USD', icon: '🪙' }
        return { symbol: meta.symbol, icon: meta.icon, price: coin.current_price, changePct: coin.price_change_percentage_24h ?? 0, category: 'Crypto' }
      })
      const staticTickers: Ticker[] = STATIC_PAIRS.map(p => {
        const drift = (Math.random() - 0.5) * 0.002
        return { ...p, price: p.price * (1 + drift) }
      })
      setTickers([...cryptoTickers, ...staticTickers])
    } catch {
      setTickers(STATIC_PAIRS)
    }
    setLoadingTickers(false)
  }, [])

  useEffect(() => {
    loadTickers()
    const id = window.setInterval(loadTickers, 30000)
    return () => window.clearInterval(id)
  }, [loadTickers])

  // Simulate live price ticks
  useEffect(() => {
    const id = window.setInterval(() => {
      setTickers(prev => prev.map(t => ({
        ...t,
        price: Math.max(0, t.price * (1 + (Math.random() - 0.499) * 0.0004)),
      })))
    }, 2000)
    return () => window.clearInterval(id)
  }, [])

  // ── Wallet + trades ───────────────────────────────────────
  const refreshBalance = async () => {
    if (!profile) return
    const { data } = await supabase
      .from('wallets')
      .select('balance_usdt')
      .eq('user_id', profile.id)
      .maybeSingle()
    if (data) setWalletBalance(data.balance_usdt ?? 0)
  }

  useEffect(() => {
    if (!profile) return
    refreshBalance()
    loadTrades()
  }, [profile])

  const loadTrades = async () => {
    if (!profile) return
    setTradesLoading(true)
    const { data } = await supabase
      .from('user_trades' as any)
      .select('*')
      .eq('user_id', profile.id)
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
    setTrades((data as UserTrade[]) ?? [])
    setTradesLoading(false)
  }

  // ── Place order ───────────────────────────────────────────
  const placeOrder = async () => {
    const amount = parseFloat(orderAmount)
    if (!amount || isNaN(amount) || amount < 10) { toast.error('Minimum trade size is $10'); return }
    if (amount > walletBalance) { toast.error('Insufficient wallet balance'); return }
    if (!profile || !selectedTicker) return
    setPlacing(true)
    try {
      // 1. Insert the trade record
      const { error: tradeErr } = await supabase.from('user_trades' as any).insert({
        user_id:        profile.id,
        symbol:         activeSymbol,
        direction,
        amount_usdt:    amount,
        entry_price:    selectedTicker.price,
        leverage,
        status:         'open',
        profit_loss:    0,
        profit_loss_pct: 0,
        opened_at:      new Date().toISOString(),
      })
      if (tradeErr) throw tradeErr

      // 2. Deduct the staked amount from the DB wallet balance
      const newBalance = walletBalance - amount
      const { error: walletErr } = await supabase
        .from('wallets')
        .update({ balance_usdt: newBalance })
        .eq('user_id', profile.id)
      if (walletErr) console.error('Wallet deduction error:', walletErr)

      // 3. Update local state immediately (no wait)
      setWalletBalance(newBalance)
      setOrderAmount('')
      loadTrades()
      toast.success(`${direction === 'buy' ? '🟢 Buy' : '🔴 Sell'} order placed — $${amount} staked`)
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to place order')
    } finally {
      setPlacing(false)
    }
  }

  // ── Close position ────────────────────────────────────────
  const closeTrade = async (trade: UserTrade) => {
    const currentPrice = tickers.find(t => t.symbol === trade.symbol)?.price ?? trade.entry_price
    const priceDiff = currentPrice - trade.entry_price
    const pct       = (priceDiff / trade.entry_price) * 100 * trade.leverage
    const pnlPct    = trade.direction === 'buy' ? pct : -pct
    const pnl       = trade.amount_usdt * (pnlPct / 100)
    const returned  = trade.amount_usdt + pnl      // margin back + profit (or - loss)
    const newBalance = walletBalance + returned

    setClosingId(trade.id)
    try {
      // 1. Close the trade record
      const { error: tradeErr } = await supabase
        .from('user_trades' as any)
        .update({
          status:         'closed',
          close_price:    currentPrice,
          profit_loss:    pnl,
          profit_loss_pct: pnlPct,
          closed_at:      new Date().toISOString(),
        })
        .eq('id', trade.id)
      if (tradeErr) throw tradeErr

      // 2. Return margin + P&L to the DB wallet balance
      const walletUpdate: Record<string, number> = { balance_usdt: newBalance }
      // Also increment total_profit if this trade was profitable
      if (pnl > 0) {
        const { data: wData } = await supabase
          .from('wallets')
          .select('total_profit')
          .eq('user_id', profile!.id)
          .maybeSingle()
        walletUpdate.total_profit = Number(wData?.total_profit ?? 0) + pnl
      }

      const { error: walletErr } = await supabase
        .from('wallets')
        .update(walletUpdate)
        .eq('user_id', profile!.id)
      if (walletErr) console.error('Wallet return error:', walletErr)

      // 3. Update local state immediately
      setWalletBalance(newBalance)
      setTrades(prev => prev.filter(t => t.id !== trade.id))

      const sign = pnl >= 0 ? '+' : ''
      toast.success(`Position closed: ${sign}${formatCurrency(pnl)} (${sign}${pnlPct.toFixed(2)}%)`)
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to close position')
    } finally {
      setClosingId(null)
    }
  }

  const filtered = category === 'All' ? tickers : tickers.filter(t => t.category === category)
  const categories = ['All', 'Crypto', 'Forex', 'Commodities']

  const totalPnL = trades.reduce((sum, t) => {
    const cp = tickers.find(tk => tk.symbol === t.symbol)?.price ?? t.entry_price
    const diff = cp - t.entry_price
    const pct = (diff / t.entry_price) * 100 * t.leverage
    const pnlPct = t.direction === 'buy' ? pct : -pct
    return sum + (t.amount_usdt * pnlPct / 100)
  }, 0)

  return (
    <div className="flex flex-col gap-0 h-full -m-6">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedTicker?.icon ?? '📊'}</span>
              <span className="font-bold text-slate-900">{activeSymbol}</span>
              {selectedTicker && (
                <span className={`text-sm font-semibold flex items-center gap-0.5 ${selectedTicker.changePct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {selectedTicker.changePct >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {selectedTicker.price > 100 ? formatCurrency(selectedTicker.price) : fmt(selectedTicker.price, activeSymbol)}
                  &nbsp;({selectedTicker.changePct >= 0 ? '+' : ''}{selectedTicker.changePct.toFixed(2)}%)
                </span>
              )}
              <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                LIVE
              </span>
            </div>
          </div>
        </div>

        {/* Interval bar */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex gap-0.5 bg-slate-100 rounded-lg p-0.5">
            {INTERVALS.map(iv => (
              <button
                key={iv.value}
                onClick={() => setInterval(iv.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${interval === iv.value ? 'bg-white text-[#1E40AF] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {iv.label}
              </button>
            ))}
          </div>
          <div className="sm:hidden relative">
            <select
              value={interval}
              onChange={e => setInterval(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none"
            >
              {INTERVALS.map(iv => <option key={iv.value} value={iv.value}>{iv.label}</option>)}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
          <button
            onClick={loadTickers}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-[#1E40AF] hover:border-[#3B82F6] transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Main layout: chart + side panel ─────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── LEFT: Pair selector ─────────────────────────────── */}
        <div className="w-52 flex-shrink-0 bg-slate-50 border-r border-slate-100 flex flex-col overflow-hidden hidden lg:flex">
          {/* Category tabs */}
          <div className="flex gap-0.5 p-2 border-b border-slate-100 flex-shrink-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-medium transition-all ${category === cat ? 'bg-white text-[#1E40AF] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Pair list */}
          <div className="flex-1 overflow-y-auto">
            {loadingTickers ? (
              <div className="p-3 space-y-2">
                {[...Array(8)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-slate-200 animate-pulse" />)}
              </div>
            ) : (
              filtered.map(t => {
                const up = t.changePct >= 0
                return (
                  <button
                    key={t.symbol}
                    onClick={() => setActiveSymbol(t.symbol)}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-all border-b border-slate-100 ${
                      activeSymbol === t.symbol ? 'bg-[#1E40AF] text-white' : 'hover:bg-white text-slate-700'
                    }`}
                  >
                    <span className="text-base flex-shrink-0">{t.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold truncate ${activeSymbol === t.symbol ? 'text-white' : 'text-slate-900'}`}>
                        {t.symbol}
                      </p>
                      <p className={`text-[10px] font-medium ${
                        activeSymbol === t.symbol ? 'text-blue-200' : up ? 'text-green-600' : 'text-red-500'
                      }`}>
                        {up ? '+' : ''}{t.changePct.toFixed(2)}%
                      </p>
                    </div>
                    <p className={`text-[10px] font-mono text-right flex-shrink-0 ${activeSymbol === t.symbol ? 'text-blue-100' : 'text-slate-500'}`}>
                      {t.price > 100
                        ? t.price.toLocaleString('en-US', { maximumFractionDigits: 2 })
                        : t.price.toFixed(4)
                      }
                    </p>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ── CENTER: TradingView Chart ────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <Suspense fallback={
            <div className="flex-1 flex items-center justify-center bg-slate-50">
              <div className="text-center">
                <div className="w-10 h-10 border-2 border-[#1E40AF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-500">Loading chart…</p>
              </div>
            </div>
          }>
            <TradingViewChart
              key={`${activeSymbol}-${interval}`}
              symbol={activeSymbol}
              interval={interval as any}
              theme="light"
              height={0}
              allowSymbolChange={true}
              className="flex-1"
              style={{ flex: 1 }}
            />
          </Suspense>
        </div>

        {/* ── RIGHT: Order panel ───────────────────────────────── */}
        <div className="w-72 flex-shrink-0 border-l border-slate-100 bg-white flex flex-col overflow-hidden">
          {/* Wallet balance */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Wallet className="w-3.5 h-3.5" /> Available
              </span>
              <span className="font-bold text-slate-900 text-sm">{formatCurrency(walletBalance)}</span>
            </div>
            {trades.length > 0 && (
              <div className="flex items-center justify-between mt-1">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Activity className="w-3.5 h-3.5" /> Unrealised P&amp;L
                </span>
                <span className={`font-bold text-sm ${totalPnL >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
                </span>
              </div>
            )}
          </div>

          {/* Buy / Sell toggle */}
          <div className="px-4 py-3 border-b border-slate-100 flex-shrink-0">
            <div className="flex rounded-xl overflow-hidden border border-slate-200">
              <button
                onClick={() => setDirection('buy')}
                className={`flex-1 py-2.5 text-sm font-bold transition-all ${direction === 'buy' ? 'bg-green-500 text-white' : 'bg-white text-slate-500 hover:bg-green-50'}`}
              >
                BUY / LONG
              </button>
              <button
                onClick={() => setDirection('sell')}
                className={`flex-1 py-2.5 text-sm font-bold transition-all ${direction === 'sell' ? 'bg-red-500 text-white' : 'bg-white text-slate-500 hover:bg-red-50'}`}
              >
                SELL / SHORT
              </button>
            </div>
          </div>

          {/* Order form */}
          <div className="px-4 py-4 space-y-4 flex-shrink-0">
            {/* Amount */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                Amount (USDT)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">$</span>
                <input
                  type="number"
                  value={orderAmount}
                  onChange={e => setOrderAmount(e.target.value)}
                  placeholder="0.00"
                  min="10"
                  max={walletBalance}
                  className="w-full pl-7 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                />
              </div>
              {/* Quick fill buttons */}
              <div className="flex gap-1.5 mt-2">
                {[25, 50, 75, 100].map(pct => (
                  <button
                    key={pct}
                    onClick={() => setOrderAmount((walletBalance * pct / 100).toFixed(2))}
                    className="flex-1 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Leverage */}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">
                Leverage: {leverage}×
              </label>
              <div className="flex gap-1.5">
                {LEVERAGE_OPTIONS.map(lev => (
                  <button
                    key={lev}
                    onClick={() => setLeverage(lev)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      leverage === lev
                        ? 'bg-[#1E40AF] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lev}×
                  </button>
                ))}
              </div>
            </div>

            {/* Order summary */}
            {parseFloat(orderAmount || '0') > 0 && selectedTicker && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-xs border border-slate-100"
              >
                <div className="flex justify-between">
                  <span className="text-slate-500">Entry Price</span>
                  <span className="font-mono font-semibold">{fmt(selectedTicker.price, activeSymbol)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Position Size</span>
                  <span className="font-semibold">{formatCurrency(parseFloat(orderAmount) * leverage)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Your Stake</span>
                  <span className="font-semibold">{formatCurrency(parseFloat(orderAmount))}</span>
                </div>
              </motion.div>
            )}

            {/* Place order button */}
            <Button
              onClick={placeOrder}
              loading={placing}
              disabled={!orderAmount || parseFloat(orderAmount) < 10 || parseFloat(orderAmount) > walletBalance}
              className={`w-full !rounded-xl font-bold ${direction === 'sell' ? '!bg-red-500 hover:!bg-red-600' : '!bg-green-500 hover:!bg-green-600'}`}
            >
              {direction === 'buy' ? '▲ Place Buy Order' : '▼ Place Sell Order'}
            </Button>

            {parseFloat(orderAmount || '0') > walletBalance && (
              <p className="text-xs text-red-500 text-center">Insufficient balance</p>
            )}
          </div>

          {/* Open positions */}
          <div className="flex-1 overflow-y-auto border-t border-slate-100">
            <div className="px-4 py-2.5 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                Open Positions
              </span>
              {trades.length > 0 && (
                <span className="text-xs bg-[#1E40AF] text-white px-1.5 py-0.5 rounded-full">{trades.length}</span>
              )}
            </div>

            {tradesLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(2)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}
              </div>
            ) : trades.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Activity className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No open positions</p>
                <p className="text-xs text-slate-300 mt-0.5">Place a trade to get started</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                <AnimatePresence>
                  {trades.map(trade => {
                    const cp = tickers.find(t => t.symbol === trade.symbol)?.price ?? trade.entry_price
                    const diff = cp - trade.entry_price
                    const pct = (diff / trade.entry_price) * 100 * trade.leverage
                    const pnlPct = trade.direction === 'buy' ? pct : -pct
                    const pnl = trade.amount_usdt * (pnlPct / 100)
                    const isUp = pnl >= 0
                    return (
                      <motion.div
                        key={trade.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="px-4 py-3"
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                trade.direction === 'buy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {trade.direction}
                              </span>
                              <span className="text-xs font-bold text-slate-900">{trade.symbol}</span>
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-semibold">
                                {trade.leverage}×
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span className="text-[10px] text-slate-400">
                                {new Date(trade.opened_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${isUp ? 'text-green-600' : 'text-red-500'}`}>
                              {isUp ? '+' : ''}{formatCurrency(pnl)}
                            </p>
                            <p className={`text-[10px] font-semibold ${isUp ? 'text-green-500' : 'text-red-400'}`}>
                              {isUp ? '+' : ''}{pnlPct.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                          <span>Stake: {formatCurrency(trade.amount_usdt)}</span>
                          <span>Entry: {fmt(trade.entry_price, trade.symbol)}</span>
                        </div>
                        <button
                          onClick={() => closeTrade(trade)}
                          disabled={closingId === trade.id}
                          className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                            isUp
                              ? 'border-green-200 text-green-600 hover:bg-green-50'
                              : 'border-red-200 text-red-600 hover:bg-red-50'
                          } disabled:opacity-50`}
                        >
                          {closingId === trade.id ? 'Closing…' : 'Close Position'}
                        </button>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
