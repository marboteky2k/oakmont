import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Bot, RefreshCw, Square, Pause, Play, Search,
  TrendingUp, TrendingDown, Activity, AlertTriangle,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface BotRow {
  id: string
  user_id: string
  exchange: string
  strategy: string
  pair: string
  status: 'active' | 'paused' | 'stopped'
  profit_pct: number
  profit_usd: number
  total_trades: number
  total_invested: number
  started_at: string
  stopped_at: string | null
  config: Record<string, unknown> | null
  user: { full_name: string; email: string } | null
}

const STRATEGY_META: Record<string, { label: string; color: string; icon: string }> = {
  grid:     { label: 'Grid',     color: 'bg-blue-100 text-blue-700',    icon: '⊞' },
  dca:      { label: 'DCA',      color: 'bg-emerald-100 text-emerald-700', icon: '↓' },
  momentum: { label: 'Momentum', color: 'bg-purple-100 text-purple-700', icon: '⚡' },
  scalper:  { label: 'Scalper',  color: 'bg-orange-100 text-orange-700', icon: '⚡⚡' },
}

const STATUS_META = {
  active:  { label: 'Active',  color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
  paused:  { label: 'Paused',  color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
  stopped: { label: 'Stopped', color: 'bg-red-100 text-red-500',       dot: 'bg-red-500' },
}

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04 } }),
}

export default function AdminBotMonitor() {
  const [bots, setBots] = useState<BotRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'stopped'>('all')
  const [filterStrategy, setFilterStrategy] = useState<string>('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bot_trades')
      .select(`
        id, user_id, exchange, strategy, pair, status,
        profit_pct, profit_usd, total_trades, total_invested,
        started_at, stopped_at, config,
        user:users(full_name, email)
      `)
      .order('started_at', { ascending: false })

    if (error) {
      toast.error(error.message)
    } else {
      setBots((data ?? []) as unknown as BotRow[])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const updateStatus = async (id: string, status: BotRow['status']) => {
    setUpdating(id)
    const { error } = await supabase
      .from('bot_trades')
      .update({ status, ...(status === 'stopped' ? { stopped_at: new Date().toISOString() } : {}) })
      .eq('id', id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(`Bot ${status === 'active' ? 'resumed' : status}`)
      setBots(prev => prev.map(b => b.id === id ? { ...b, status } : b))
    }
    setUpdating(null)
  }

  const filtered = bots.filter(b => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      b.user?.full_name?.toLowerCase().includes(q) ||
      b.user?.email?.toLowerCase().includes(q) ||
      b.pair.toLowerCase().includes(q) ||
      b.strategy.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'all' || b.status === filterStatus
    const matchStrategy = filterStrategy === 'all' || b.strategy === filterStrategy
    return matchSearch && matchStatus && matchStrategy
  })

  const stats = {
    total: bots.length,
    active: bots.filter(b => b.status === 'active').length,
    paused: bots.filter(b => b.status === 'paused').length,
    stopped: bots.filter(b => b.status === 'stopped').length,
    totalProfit: bots.reduce((s, b) => s + (b.profit_usd ?? 0), 0),
    totalInvested: bots.reduce((s, b) => s + (b.total_invested ?? 0), 0),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#1E40AF] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bot Trading Monitor</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor and control all active trading bots across the platform.
          </p>
        </div>
        <Button variant="outline" onClick={load}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Bots', value: stats.total, color: 'text-slate-700 bg-slate-100' },
          { label: 'Active', value: stats.active, color: 'text-green-700 bg-green-100' },
          { label: 'Paused', value: stats.paused, color: 'text-yellow-700 bg-yellow-100' },
          { label: 'Stopped', value: stats.stopped, color: 'text-red-600 bg-red-100' },
          { label: 'Total Profit', value: `$${stats.totalProfit.toFixed(0)}`, color: stats.totalProfit >= 0 ? 'text-green-700 bg-green-100' : 'text-red-600 bg-red-100' },
          { label: 'Total Invested', value: `$${stats.totalInvested.toFixed(0)}`, color: 'text-blue-700 bg-blue-100' },
        ].map(({ label, value, color }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <p className={`text-xl font-bold rounded-lg px-2 py-1 inline-block mb-1 ${color}`}>{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Warning for abnormal bots */}
      {bots.some(b => b.status === 'active' && (b.profit_pct ?? 0) < -15) && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Attention: Bots with significant drawdown</p>
            <p className="text-xs text-red-600 mt-0.5">
              Some active bots are showing losses exceeding 15%. Consider pausing them for review.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user, pair, strategy…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF]"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF] bg-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="stopped">Stopped</option>
        </select>
        <select
          value={filterStrategy}
          onChange={e => setFilterStrategy(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF] bg-white"
        >
          <option value="all">All Strategies</option>
          <option value="grid">Grid</option>
          <option value="dca">DCA</option>
          <option value="momentum">Momentum</option>
          <option value="scalper">Scalper</option>
        </select>
        <span className="text-xs text-slate-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Bot list */}
      <Card>
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No bots found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((bot, i) => {
              const strat = STRATEGY_META[bot.strategy] ?? { label: bot.strategy, color: 'bg-slate-100 text-slate-700', icon: '⊡' }
              const statusMeta = STATUS_META[bot.status]
              const isPos = (bot.profit_usd ?? 0) >= 0
              const isExpanded = expanded === bot.id
              return (
                <motion.div
                  key={bot.id}
                  custom={i}
                  initial="hidden"
                  animate="show"
                  variants={fadeUp}
                  className="border border-slate-100 rounded-xl overflow-hidden"
                >
                  <div className="flex items-center gap-4 p-4 bg-white">
                    {/* Strategy badge */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 font-bold ${strat.color}`}>
                      {strat.icon}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900 text-sm">{bot.user?.full_name ?? '—'}</p>
                        <span className="text-xs text-slate-400">{bot.user?.email}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${strat.color}`}>{strat.label}</span>
                        <span className="text-xs font-semibold text-slate-700">{bot.pair}</span>
                        <span className="text-xs text-slate-400">{bot.exchange}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">${bot.total_invested?.toFixed(0)} invested</span>
                      </div>
                    </div>
                    {/* P&L */}
                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <p className={`text-sm font-bold flex items-center gap-1 justify-end ${isPos ? 'text-green-600' : 'text-red-500'}`}>
                        {isPos ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {isPos ? '+' : ''}{(bot.profit_usd ?? 0).toFixed(2)}
                      </p>
                      <p className={`text-xs ${isPos ? 'text-green-500' : 'text-red-400'}`}>
                        {isPos ? '+' : ''}{(bot.profit_pct ?? 0).toFixed(2)}%
                      </p>
                    </div>
                    {/* Status */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full ${statusMeta.dot} ${bot.status === 'active' ? 'animate-pulse' : ''}`} />
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusMeta.color}`}>
                        {statusMeta.label}
                      </span>
                    </div>
                    {/* Admin controls */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {bot.status === 'active' && (
                        <button
                          onClick={() => updateStatus(bot.id, 'paused')}
                          disabled={updating === bot.id}
                          className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Pause bot"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {bot.status === 'paused' && (
                        <button
                          onClick={() => updateStatus(bot.id, 'active')}
                          disabled={updating === bot.id}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Resume bot"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {bot.status !== 'stopped' && (
                        <button
                          onClick={() => {
                            if (confirm('Stop this bot? This cannot be undone.')) updateStatus(bot.id, 'stopped')
                          }}
                          disabled={updating === bot.id}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Stop bot"
                        >
                          <Square className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setExpanded(isExpanded ? null : bot.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {/* Expanded */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400 font-medium mb-0.5">Bot ID</p>
                        <p className="font-mono text-slate-600">{bot.id.slice(0, 16)}…</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium mb-0.5">Total Trades</p>
                        <p className="text-slate-600 font-semibold">{bot.total_trades}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium mb-0.5">Started</p>
                        <p className="text-slate-600">{new Date(bot.started_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium mb-0.5">Stopped</p>
                        <p className="text-slate-600">{bot.stopped_at ? new Date(bot.stopped_at).toLocaleDateString() : '—'}</p>
                      </div>
                      {bot.config && (
                        <div className="col-span-full">
                          <p className="text-slate-400 font-medium mb-0.5">Config</p>
                          <pre className="text-slate-600 bg-white rounded-lg p-2 border border-slate-100 overflow-auto text-xs">
                            {JSON.stringify(bot.config, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Overview summary */}
      {bots.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(STRATEGY_META).map(([key, meta]) => {
            const stratBots = bots.filter(b => b.strategy === key)
            const profit = stratBots.reduce((s, b) => s + (b.profit_usd ?? 0), 0)
            return (
              <Card key={key}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-sm px-2 py-0.5 rounded-full ${meta.color}`}>{meta.label}</span>
                </div>
                <p className="text-lg font-bold text-slate-900">{stratBots.length} bots</p>
                <p className={`text-xs mt-0.5 flex items-center gap-1 ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  <Activity className="w-3 h-3" />
                  {profit >= 0 ? '+' : ''}{profit.toFixed(2)} total P&L
                </p>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
