import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Star, Users, TrendingUp, TrendingDown, Shield, CheckCircle,
  ChevronDown, Pause, Square, Play, AlertTriangle, Wallet
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency, formatPercent, getRiskColor } from '@/lib/utils'
import type { CopyTrader } from '@/types/database'
import { TraderSparkline } from '@/components/charts'
import toast from 'react-hot-toast'

const SPARKLINE_SETS = [
  [2, 5, 3, 8, 6, 10, 12, 9, 15, 13, 18, 16],
  [1, 3, 2, 5, 4, 7, 6, 9, 8, 11, 10, 13],
  [3, 6, 4, 9, 7, 12, 10, 15, 12, 18, 15, 20],
  [0, 2, 4, 3, 6, 5, 8, 7, 10, 9, 13, 12],
  [4, 7, 5, 10, 8, 13, 11, 16, 14, 19, 17, 22],
]

const RATIOS = [0.25, 0.5, 1, 2]
const STYLES = ['all', 'scalping', 'swing', 'trend_following', 'day_trading']
const SORTS = [
  { value: 'return', label: 'Total Return' },
  { value: 'winrate', label: 'Win Rate' },
  { value: 'followers', label: 'Followers' },
]

interface ActiveCopy {
  id: string
  investor_id: string
  trader_id: string
  allocated_amount: number
  current_value: number
  profit_loss: number
  status: string
  copy_ratio: number
  started_at: string
  copy_traders?: { display_name: string; risk_level: string; win_rate: number }
}

export default function CopyTrading() {
  const { profile } = useAuth()
  const [traders, setTraders] = useState<CopyTrader[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('all')
  const [styleFilter, setStyleFilter] = useState('all')
  const [sortBy, setSortBy] = useState('return')
  const [selected, setSelected] = useState<CopyTrader | null>(null)
  const [amount, setAmount] = useState('')
  const [ratio, setRatio] = useState(1)
  const [agreedToRisk, setAgreedToRisk] = useState(false)
  const [copying, setCopying] = useState(false)
  const [activeCopies, setActiveCopies] = useState<ActiveCopy[]>([])
  const [copiesLoading, setCopiesLoading] = useState(true)
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState<number>(0)

  useEffect(() => {
    supabase.from('copy_traders')
      .select('*')
      .eq('is_active', true)
      .then(({ data }) => {
        setTraders(data ?? [])
        setLoading(false)
      })
  }, [])

  const loadActiveCopies = () => {
    if (!profile) return
    supabase.from('copy_subscriptions' as any)
      .select('*, copy_traders(display_name, risk_level, win_rate)')
      .eq('investor_id', profile.id)
      .in('status', ['active', 'paused'])
      .order('started_at', { ascending: false })
      .then(({ data }: { data: any }) => {
        setActiveCopies(data ?? [])
        setCopiesLoading(false)
      })
  }

  useEffect(() => {
    if (!profile) return
    loadActiveCopies()
    supabase.from('wallets').select('balance_usdt').eq('user_id', profile.id).maybeSingle()
      .then(({ data }) => { if (data) setWalletBalance(data.balance_usdt ?? 0) })
  }, [profile])

  const filtered = useMemo(() => {
    let result = traders.filter(t => {
      const matchSearch = t.display_name.toLowerCase().includes(search.toLowerCase())
      const matchRisk = riskFilter === 'all' || t.risk_level === riskFilter
      const matchStyle = styleFilter === 'all' || t.trading_style === styleFilter
      return matchSearch && matchRisk && matchStyle
    })
    return [...result].sort((a, b) => {
      if (sortBy === 'return') return (b.total_return_pct ?? 0) - (a.total_return_pct ?? 0)
      if (sortBy === 'winrate') return (b.win_rate ?? 0) - (a.win_rate ?? 0)
      if (sortBy === 'followers') return (b.followers_count ?? 0) - (a.followers_count ?? 0)
      return 0
    })
  }, [traders, search, riskFilter, styleFilter, sortBy])

  const estimatedMonthlyReturn = useMemo(() => {
    const amt = parseFloat(amount || '0')
    if (!amt || !selected) return 0
    const monthlyPct = selected.monthly_return_pct ?? Math.min((selected.total_return_pct ?? 120) / 6, 25)
    return amt * ratio * (monthlyPct / 100)
  }, [amount, ratio, selected])

  const copyAmt = parseFloat(amount || '0')
  const insufficientBalance = copyAmt > 0 && copyAmt > walletBalance

  const handleCopy = async () => {
    if (!selected || !profile || !amount) return
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt < (selected.min_copy_amount ?? 100)) {
      toast.error(`Minimum copy amount is ${formatCurrency(selected.min_copy_amount)}`)
      return
    }
    if (amt > walletBalance) {
      toast.error(`Insufficient balance. You have ${formatCurrency(walletBalance)} available.`)
      return
    }
    if (!agreedToRisk) {
      toast.error('Please acknowledge the risk disclaimer')
      return
    }
    setCopying(true)
    try {
      const { error } = await supabase.from('copy_subscriptions').insert({
        investor_id: profile.id,
        trader_id: selected.id,
        allocated_amount: amt,
        current_value: amt,
        profit_loss: 0,
        status: 'active',
        copy_ratio: ratio,
        started_at: new Date().toISOString(),
      })
      if (error) throw error
      toast.success(`Now copying ${selected.display_name} at ${ratio}x ratio!`)
      setSelected(null)
      setAmount('')
      setRatio(1)
      setAgreedToRisk(false)
      loadActiveCopies()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCopying(false)
    }
  }

  const handleTogglePause = async (copy: ActiveCopy) => {
    setActioningId(copy.id)
    const newStatus = copy.status === 'active' ? 'paused' : 'active'
    try {
      const { error } = await supabase.from('copy_subscriptions' as any).update({ status: newStatus }).eq('id', copy.id)
      if (error) throw error
      setActiveCopies(prev => prev.map(c => c.id === copy.id ? { ...c, status: newStatus } : c))
      toast.success(newStatus === 'paused' ? 'Copy paused' : 'Copy resumed')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setActioningId(null)
    }
  }

  const handleStop = async (id: string) => {
    setActioningId(id)
    try {
      const { error } = await supabase.from('copy_subscriptions' as any).update({ status: 'stopped' }).eq('id', id)
      if (error) throw error
      setActiveCopies(prev => prev.filter(c => c.id !== id))
      toast.success('Copy stopped')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setActioningId(null)
    }
  }

  const riskBtns = ['all', 'low', 'medium', 'high']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Copy Trading</h1>
        <p className="text-slate-500 text-sm mt-1">Follow expert traders and mirror their trades automatically.</p>
      </div>

      {/* Filter row */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search traders by name..."
              leftIcon={<Search className="w-4 h-4" />}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 pr-8 focus:outline-none focus:border-[#3B82F6] transition-colors cursor-pointer"
            >
              {SORTS.map(s => <option key={s.value} value={s.value}>Sort: {s.label}</option>)}
            </select>
            <ChevronDown className="absolute right-2.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Risk filters */}
          <div className="flex gap-1.5">
            {riskBtns.map(r => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                  riskFilter === r ? 'bg-[#1E40AF] text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-[#3B82F6]'
                }`}
              >
                {r} risk
              </button>
            ))}
          </div>
          <div className="w-px bg-slate-200 self-stretch" />
          {/* Style filters */}
          <div className="flex gap-1.5">
            {STYLES.map(s => (
              <button
                key={s}
                onClick={() => setStyleFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                  styleFilter === s ? 'bg-slate-800 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
                }`}
              >
                {s === 'all' ? 'All styles' : s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Traders grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-14">
          <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-medium text-slate-700">No traders match your filters</p>
          <p className="text-slate-400 text-sm mt-1">Try adjusting your search or filter options.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((trader, i) => (
            <motion.div
              key={trader.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.3) }}
            >
              <Card hover className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] flex items-center justify-center text-white font-bold text-lg">
                      {trader.display_name?.charAt(0)}
                    </div>
                    {trader.is_verified && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center ring-2 ring-white">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900 truncate">{trader.display_name}</p>
                      {trader.is_featured && <Badge variant="info" size="sm">Featured</Badge>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${getRiskColor(trader.risk_level)}`}>
                        {trader.risk_level}
                      </span>
                      <span className="text-xs text-slate-400 capitalize">{trader.trading_style?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[...Array(5)].map((_, j) => (
                        <Star key={j} className={`w-3 h-3 ${j < 4 ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mini sparkline */}
                <div className="h-14 w-full">
                  <TraderSparkline
                    data={SPARKLINE_SETS[i % 5]}
                    positive={(trader.total_return_pct ?? 0) >= 0}
                    height={56}
                  />
                </div>
                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2.5 rounded-xl bg-green-50">
                    <p className="text-green-600 font-bold text-sm">{formatPercent(trader.total_return_pct)}</p>
                    <p className="text-xs text-slate-500">Total Return</p>
                  </div>
                  <div className="text-center p-2.5 rounded-xl bg-blue-50">
                    <p className="text-[#1E40AF] font-bold text-sm">{trader.win_rate}%</p>
                    <p className="text-xs text-slate-500">Win Rate</p>
                  </div>
                  <div className="text-center p-2.5 rounded-xl bg-red-50">
                    <p className="text-red-500 font-bold text-sm">-{trader.max_drawdown}%</p>
                    <p className="text-xs text-slate-500">Max DD</p>
                  </div>
                  <div className="text-center p-2.5 rounded-xl bg-slate-50">
                    <p className="text-slate-700 font-bold text-sm">{trader.followers_count.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">Followers</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    AUM: {formatCurrency(trader.assets_under_management)}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Fee: {trader.performance_fee}%
                  </span>
                </div>

                <Button onClick={() => { setSelected(trader); setAmount(''); setRatio(1); setAgreedToRisk(false) }} className="w-full">
                  Copy This Trader
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── My Active Copies ── */}
      {(activeCopies.length > 0 || copiesLoading) && (
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">My Active Copies</h2>

          {copiesLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
            </div>
          ) : (
            <Card className="overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Trader', 'Allocated', 'Current Value', 'P&L', 'P&L %', 'Ratio', 'Status', 'Actions'].map(col => (
                        <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {activeCopies.map((copy, i) => {
                      const pl = copy.current_value - copy.allocated_amount
                      const plPct = copy.allocated_amount > 0 ? (pl / copy.allocated_amount) * 100 : 0
                      const isPositive = pl >= 0
                      return (
                        <motion.tr
                          key={copy.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {copy.copy_traders?.display_name?.charAt(0) ?? '?'}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{copy.copy_traders?.display_name ?? 'Trader'}</p>
                                <p className="text-xs text-slate-400 capitalize">{copy.copy_traders?.risk_level} risk</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-700">{formatCurrency(copy.allocated_amount)}</td>
                          <td className="px-4 py-3 font-medium text-slate-700">{formatCurrency(copy.current_value)}</td>
                          <td className={`px-4 py-3 font-semibold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                            <span className="flex items-center gap-1">
                              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                              {isPositive ? '+' : ''}{formatCurrency(pl)}
                            </span>
                          </td>
                          <td className={`px-4 py-3 font-semibold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                            {isPositive ? '+' : ''}{plPct.toFixed(2)}%
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">{copy.copy_ratio}x</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                              copy.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {copy.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleTogglePause(copy)}
                                disabled={actioningId === copy.id}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-50"
                                title={copy.status === 'active' ? 'Pause' : 'Resume'}
                              >
                                {copy.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleStop(copy.id)}
                                disabled={actioningId === copy.id}
                                className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors disabled:opacity-50"
                                title="Stop copy"
                              >
                                <Square className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Copy Modal ── */}
      <Modal
        open={!!selected}
        onClose={() => { setSelected(null); setAgreedToRisk(false) }}
        title={`Copy ${selected?.display_name}`}
        size="md"
      >
        {selected && (
          <div className="space-y-4">
            {/* Trader summary */}
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {selected.display_name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900">{selected.display_name}</p>
                <p className="text-xs text-slate-500 capitalize mt-0.5">{selected.trading_style?.replace('_', ' ')} · {selected.risk_level} risk</p>
              </div>
              <div className="text-right">
                <p className="text-green-600 font-black text-lg">{formatPercent(selected.total_return_pct)}</p>
                <p className="text-xs text-slate-400">Total return</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="text-center p-2.5 bg-slate-50 rounded-xl">
                <p className="font-bold text-slate-900">{selected.win_rate}%</p>
                <p className="text-xs text-slate-500">Win Rate</p>
              </div>
              <div className="text-center p-2.5 bg-red-50 rounded-xl">
                <p className="font-bold text-red-600">-{selected.max_drawdown}%</p>
                <p className="text-xs text-slate-500">Max DD</p>
              </div>
              <div className="text-center p-2.5 bg-slate-50 rounded-xl">
                <p className="font-bold text-slate-900">{selected.performance_fee}%</p>
                <p className="text-xs text-slate-500">Perf. Fee</p>
              </div>
            </div>

            {/* Available balance pill */}
            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Wallet className="w-3.5 h-3.5" /> Available Balance
              </span>
              <span className="text-sm font-bold text-slate-900">{formatCurrency(walletBalance)}</span>
            </div>

            {/* Amount input */}
            <Input
              label={`Amount to Allocate (USDT) — Min. ${formatCurrency(selected.min_copy_amount)}`}
              type="number"
              placeholder={`${selected.min_copy_amount}`}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              leftIcon={<span className="text-xs font-bold text-slate-400">$</span>}
            />

            {/* Insufficient balance warning */}
            {insufficientBalance && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3"
              >
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-700">Insufficient balance</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    You need {formatCurrency(copyAmt - walletBalance)} more.{' '}
                    <Link to="/wallet" className="underline font-medium" onClick={() => setSelected(null)}>
                      Deposit funds →
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}

            {/* Copy ratio */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Copy Ratio</p>
              <div className="grid grid-cols-4 gap-2">
                {RATIOS.map(r => (
                  <button
                    key={r}
                    onClick={() => setRatio(r)}
                    className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                      ratio === r
                        ? 'bg-[#1E40AF] text-white shadow-md scale-105'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {r}x
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                {ratio === 0.25 ? 'Conservative — mirrors 25% of each trade size' :
                 ratio === 0.5 ? 'Moderate — mirrors 50% of each trade size' :
                 ratio === 1 ? 'Standard — mirrors trades at equal proportion' :
                 'Aggressive — doubles trade sizes (higher risk & reward)'}
              </p>
            </div>

            {/* Estimated return */}
            {parseFloat(amount || '0') > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs text-green-600 font-medium">Estimated monthly return</p>
                  <p className="text-xs text-green-500 mt-0.5">Based on trader's historical performance</p>
                </div>
                <p className="text-green-700 font-black text-lg">+{formatCurrency(estimatedMonthlyReturn)}</p>
              </motion.div>
            )}

            {/* Risk disclaimer */}
            <label className="flex items-start gap-3 cursor-pointer p-3 bg-yellow-50 rounded-xl border border-yellow-100">
              <input
                type="checkbox"
                checked={agreedToRisk}
                onChange={e => setAgreedToRisk(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#1E40AF] flex-shrink-0"
              />
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700 leading-relaxed">
                  <span className="font-semibold">I understand the risks.</span> Copy trading involves risk of loss. Past performance does not guarantee future results. I may lose some or all of my allocated funds.
                </p>
              </div>
            </label>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setSelected(null)} className="flex-1">Cancel</Button>
              <Button
                onClick={handleCopy}
                loading={copying}
                disabled={!agreedToRisk || !amount || parseFloat(amount) < (selected.min_copy_amount ?? 0) || insufficientBalance}
                className="flex-1"
              >
                <Shield className="w-4 h-4" /> Start Copying
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
