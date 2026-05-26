import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, Plus, Play, Pause, Square, TrendingUp, TrendingDown,
  Zap, BarChart3, Settings2, Link2, ChevronRight,
  Activity, CircleDot, AlertTriangle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import type { BotTrade, Exchange, BotStrategy } from '@/types/database'
import { formatCurrency } from '@/lib/utils'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

// ─── Strategy metadata ─────────────────────────────────────────────────────────
const STRATEGIES: {
  id: BotStrategy
  name: string
  description: string
  risk: string
  minCapital: number
  icon: typeof Zap
  color: string
  bg: string
}[] = [
  {
    id: 'grid',
    name: 'Grid Trading',
    description: 'Places buy/sell orders at set price intervals, profiting from sideways markets through automatic grid execution.',
    risk: 'Low–Medium',
    minCapital: 100,
    icon: BarChart3,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  {
    id: 'dca',
    name: 'DCA (Dollar-Cost Avg.)',
    description: 'Buys fixed amounts at regular intervals regardless of price, reducing the impact of market volatility.',
    risk: 'Low',
    minCapital: 50,
    icon: TrendingUp,
    color: 'text-green-600',
    bg: 'bg-green-50',
  },
  {
    id: 'momentum',
    name: 'Momentum Trader',
    description: 'Follows market trends using RSI and MACD signals to ride breakouts and capture directional moves.',
    risk: 'Medium–High',
    minCapital: 200,
    icon: Zap,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  {
    id: 'scalper',
    name: 'Scalper Bot',
    description: 'Executes rapid trades on small price movements, accumulating profits through high-frequency small wins.',
    risk: 'High',
    minCapital: 500,
    icon: Activity,
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
]

const EXCHANGES_LIST: { id: Exchange; name: string; icon: string }[] = [
  { id: 'binance', name: 'Binance', icon: '🟡' },
  { id: 'okx',     name: 'OKX',    icon: '⚫' },
  { id: 'bybit',   name: 'Bybit',  icon: '🔶' },
]

const POPULAR_PAIRS = ['BTC/USDT', 'ETH/USDT', 'BNB/USDT', 'SOL/USDT', 'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'MATIC/USDT']

const statusBadge: Record<string, { variant: 'success' | 'warning' | 'default'; label: string }> = {
  active:  { variant: 'success',  label: 'Running' },
  paused:  { variant: 'warning',  label: 'Paused'  },
  stopped: { variant: 'default',  label: 'Stopped' },
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07 } }),
}

// Demo bots shown when user has none
const DEMO_BOTS: Partial<BotTrade>[] = [
  { id: 'd1', exchange: 'binance', strategy: 'grid', pair: 'BTC/USDT', status: 'active', profit_pct: 4.8, profit_usd: 48.21, total_trades: 127, total_invested: 1000 },
  { id: 'd2', exchange: 'okx',     strategy: 'dca',  pair: 'ETH/USDT', status: 'paused', profit_pct: 2.1, profit_usd: 10.50, total_trades: 48,  total_invested: 500  },
  { id: 'd3', exchange: 'bybit',   strategy: 'momentum', pair: 'SOL/USDT', status: 'active', profit_pct: 9.3, profit_usd: 93.00, total_trades: 63, total_invested: 1000 },
]

export default function BotTrading() {
  const { profile } = useAuth()
  const [bots, setBots] = useState<BotTrade[]>([])
  const [loading, setLoading] = useState(true)
  const [hasExchangeKey, setHasExchangeKey] = useState(false)
  const [addModal, setAddModal] = useState(false)
  const [selectedStrategy, setSelectedStrategy] = useState<typeof STRATEGIES[0] | null>(null)
  const [actioningId, setActioningId] = useState<string | null>(null)

  // Form
  const [exchange, setExchange] = useState<Exchange>('binance')
  const [pair, setPair] = useState('BTC/USDT')
  const [capital, setCapital] = useState('')
  const [saving, setSaving] = useState(false)

  const loadData = async () => {
    if (!profile) return
    const [{ data: botData }, { data: keyData }] = await Promise.all([
      supabase.from('bot_trades').select('*').eq('user_id', profile.id).order('started_at', { ascending: false }),
      supabase.from('exchange_api_keys').select('id').eq('user_id', profile.id).eq('is_active', true).limit(1),
    ])
    setBots((botData ?? []) as unknown as BotTrade[])
    setHasExchangeKey((keyData ?? []).length > 0)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [profile])

  const openCreate = (strategy: typeof STRATEGIES[0]) => {
    setSelectedStrategy(strategy)
    setCapital(strategy.minCapital.toString())
    setAddModal(true)
  }

  const handleCreate = async () => {
    if (!profile || !selectedStrategy) return
    if (!capital || parseFloat(capital) < selectedStrategy.minCapital) {
      toast.error(`Minimum capital for ${selectedStrategy.name} is $${selectedStrategy.minCapital}`)
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from('bot_trades').insert({
        user_id: profile.id,
        exchange,
        strategy: selectedStrategy.id,
        pair,
        status: 'active',
        profit_pct: 0,
        profit_usd: 0,
        total_trades: 0,
        total_invested: parseFloat(capital),
        started_at: new Date().toISOString(),
      } as any)
      if (error) throw error
      toast.success(`${selectedStrategy.name} bot started on ${pair}!`)
      setAddModal(false)
      await loadData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAction = async (bot: BotTrade, action: 'active' | 'paused' | 'stopped') => {
    setActioningId(bot.id)
    await supabase.from('bot_trades').update({
      status: action,
      ...(action === 'stopped' ? { stopped_at: new Date().toISOString() } : {}),
    } as any).eq('id', bot.id)
    const labels = { active: 'resumed', paused: 'paused', stopped: 'stopped' }
    toast.success(`Bot ${labels[action]}`)
    setActioningId(null)
    await loadData()
  }

  const displayBots = bots.length > 0 ? bots : (DEMO_BOTS as BotTrade[])
  const isDemo = bots.length === 0

  const totalProfit = bots.reduce((s, b) => s + (b.profit_usd ?? 0), 0)
  const activeBots = bots.filter(b => b.status === 'active').length
  const totalTrades = bots.reduce((s, b) => s + (b.total_trades ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bot className="w-6 h-6 text-[#1E40AF]" /> Bot Trading
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automate your trading strategy on connected exchanges — 24/7, no emotion.
          </p>
        </div>
        <Button onClick={() => setAddModal(true)} disabled={!hasExchangeKey}>
          <Plus className="w-4 h-4" /> New Bot
        </Button>
      </div>

      {/* No exchange key warning */}
      {!hasExchangeKey && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4"
        >
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Connect an exchange first</p>
            <p className="text-xs text-amber-600 mt-0.5">
              You need to connect at least one exchange API key before launching a trading bot.
            </p>
            <Link to="/exchanges" className="inline-flex items-center gap-1 text-xs text-[#1E40AF] hover:underline font-medium mt-1.5">
              Go to Exchange Connections <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* Stats */}
      {!loading && bots.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Profit', value: formatCurrency(totalProfit), color: totalProfit >= 0 ? 'text-green-600' : 'text-red-500', icon: TrendingUp },
            { label: 'Active Bots', value: activeBots.toString(), color: 'text-[#1E40AF]', icon: CircleDot },
            { label: 'Total Trades', value: totalTrades.toString(), color: 'text-slate-900', icon: Activity },
          ].map(stat => (
            <Card key={stat.label}>
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Active bots */}
      {!loading && displayBots.length > 0 && (
        <div>
          {isDemo && (
            <div className="flex items-center gap-2 mb-3 text-xs text-slate-500 bg-slate-100 rounded-xl px-3 py-2 w-fit">
              <Bot className="w-3.5 h-3.5" /> Demo preview — create a real bot to see live data
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {displayBots.map((bot, i) => {
              const strategy = STRATEGIES.find(s => s.id === bot.strategy)
              const exMeta = EXCHANGES_LIST.find(e => e.id === bot.exchange)
              const up = (bot.profit_pct ?? 0) >= 0
              const sb = statusBadge[bot.status] ?? statusBadge.stopped
              const Icon = strategy?.icon ?? Activity
              return (
                <motion.div key={bot.id} custom={i} initial="hidden" animate="show" variants={fadeUp}>
                  <Card className="relative overflow-hidden h-full flex flex-col">
                    {bot.status === 'active' && (
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse" />
                    )}

                    <div className="flex items-start justify-between mb-3 mt-1">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl ${strategy?.bg ?? 'bg-slate-100'} flex items-center justify-center`}>
                          <Icon className={`w-4.5 h-4.5 ${strategy?.color ?? 'text-slate-600'}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{strategy?.name ?? bot.strategy}</p>
                          <p className="text-xs text-slate-400">
                            {exMeta?.icon} {exMeta?.name ?? bot.exchange} · {bot.pair}
                          </p>
                        </div>
                      </div>
                      <Badge variant={sb.variant} size="sm">{sb.label}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-xs text-slate-400 mb-0.5">Profit</p>
                        <p className={`text-lg font-black ${up ? 'text-green-600' : 'text-red-500'}`}>
                          {up ? '+' : ''}{formatCurrency(bot.profit_usd ?? 0)}
                        </p>
                        <p className={`text-xs font-medium ${up ? 'text-green-500' : 'text-red-400'}`}>
                          {up ? '+' : ''}{(bot.profit_pct ?? 0).toFixed(2)}%
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-xs text-slate-400 mb-0.5">Trades</p>
                        <p className="text-lg font-black text-slate-900">{bot.total_trades}</p>
                        <p className="text-xs text-slate-400">Capital: {formatCurrency(bot.total_invested ?? 0)}</p>
                      </div>
                    </div>

                    {!isDemo && (
                      <div className="flex gap-2 mt-auto">
                        {bot.status === 'active' ? (
                          <Button
                            size="sm" variant="outline" className="flex-1"
                            onClick={() => handleAction(bot, 'paused')}
                            loading={actioningId === bot.id}
                          >
                            <Pause className="w-3 h-3" /> Pause
                          </Button>
                        ) : bot.status === 'paused' ? (
                          <Button
                            size="sm" className="flex-1"
                            onClick={() => handleAction(bot, 'active')}
                            loading={actioningId === bot.id}
                          >
                            <Play className="w-3 h-3" /> Resume
                          </Button>
                        ) : null}
                        {bot.status !== 'stopped' && (
                          <Button
                            size="sm" variant="danger" className="flex-1"
                            onClick={() => handleAction(bot, 'stopped')}
                            loading={actioningId === bot.id}
                          >
                            <Square className="w-3 h-3" /> Stop
                          </Button>
                        )}
                      </div>
                    )}
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Strategy cards */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Available Strategies</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {STRATEGIES.map((s, i) => (
            <motion.div key={s.id} custom={i} initial="hidden" whileInView="show" viewport={{ once: true }} variants={fadeUp}>
              <Card hover className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-2xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 text-sm">{s.name}</h3>
                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      Risk: {s.risk}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">{s.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Min. capital: <strong className="text-slate-700">${s.minCapital}</strong></span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openCreate(s)}
                      disabled={!hasExchangeKey}
                    >
                      <Plus className="w-3 h-3" /> Launch
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Create bot modal */}
      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title={selectedStrategy ? `Launch ${selectedStrategy.name}` : 'Launch Bot'}
      >
        {selectedStrategy && (
          <div className="space-y-4">
            <div className={`flex items-center gap-3 p-4 rounded-xl ${selectedStrategy.bg} border border-slate-100`}>
              <selectedStrategy.icon className={`w-5 h-5 ${selectedStrategy.color} flex-shrink-0`} />
              <p className="text-xs text-slate-600 leading-relaxed">{selectedStrategy.description}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Exchange</label>
              <div className="grid grid-cols-3 gap-2">
                {EXCHANGES_LIST.map(ex => (
                  <button
                    key={ex.id}
                    onClick={() => setExchange(ex.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                      exchange === ex.id
                        ? 'border-[#1E40AF] bg-blue-50 text-[#1E40AF]'
                        : 'border-slate-200 text-slate-600 hover:border-[#3B82F6]'
                    }`}
                  >
                    <span>{ex.icon}</span> {ex.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Trading Pair</label>
              <div className="grid grid-cols-4 gap-1.5">
                {POPULAR_PAIRS.map(p => (
                  <button
                    key={p}
                    onClick={() => setPair(p)}
                    className={`px-2 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      pair === p
                        ? 'border-[#1E40AF] bg-blue-50 text-[#1E40AF]'
                        : 'border-slate-200 text-slate-600 hover:border-[#3B82F6]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label={`Capital (min. $${selectedStrategy.minCapital})`}
              type="number"
              placeholder={selectedStrategy.minCapital.toString()}
              value={capital}
              onChange={e => setCapital(e.target.value)}
              hint="Amount of USDT to allocate to this bot"
            />

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setAddModal(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleCreate} loading={saving} className="flex-1">
                <Play className="w-4 h-4" /> Launch Bot
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
