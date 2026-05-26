import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Link2, RefreshCw, CheckCircle, AlertCircle, Users,
  Search, Trash2, Shield, ChevronDown, ChevronUp,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface ExchangeRow {
  id: string
  user_id: string
  exchange: string
  label: string
  api_key: string
  is_active: boolean
  is_connected: boolean
  last_tested: string | null
  created_at: string
  user: {
    full_name: string
    email: string
  } | null
}

const EXCHANGE_META: Record<string, { name: string; logo: string; color: string }> = {
  binance: { name: 'Binance',  logo: '🟡', color: 'from-yellow-400 to-yellow-600' },
  okx:     { name: 'OKX',     logo: '⚫', color: 'from-slate-700 to-slate-900'   },
  bybit:   { name: 'Bybit',   logo: '🔶', color: 'from-amber-500 to-orange-600'  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04 } }),
}

export default function AdminExchangeMonitor() {
  const [rows, setRows] = useState<ExchangeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterExchange, setFilterExchange] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'connected' | 'unverified'>('all')
  const [removing, setRemoving] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('exchange_api_keys')
      .select(`
        id, user_id, exchange, label, api_key, is_active, is_connected, last_tested, created_at,
        user:users(full_name, email)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      toast.error(error.message)
    } else {
      setRows((data ?? []) as unknown as ExchangeRow[])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this API key? This cannot be undone.')) return
    setRemoving(id)
    const { error } = await supabase.from('exchange_api_keys').delete().eq('id', id)
    if (error) { toast.error(error.message) } else { toast.success('API key removed') }
    setRemoving(null)
    await load()
  }

  const filtered = rows.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      r.user?.full_name?.toLowerCase().includes(q) ||
      r.user?.email?.toLowerCase().includes(q) ||
      r.exchange.toLowerCase().includes(q) ||
      r.label.toLowerCase().includes(q)
    const matchExchange = filterExchange === 'all' || r.exchange === filterExchange
    const matchStatus = filterStatus === 'all'
      ? true
      : filterStatus === 'connected' ? r.is_connected : !r.is_connected
    return matchSearch && matchExchange && matchStatus
  })

  const stats = {
    total: rows.length,
    connected: rows.filter(r => r.is_connected).length,
    binance: rows.filter(r => r.exchange === 'binance').length,
    okx: rows.filter(r => r.exchange === 'okx').length,
    bybit: rows.filter(r => r.exchange === 'bybit').length,
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
          <h1 className="text-2xl font-bold text-slate-900">Exchange Monitor</h1>
          <p className="text-sm text-slate-500 mt-1">
            All user exchange API key connections across the platform.
          </p>
        </div>
        <Button variant="outline" onClick={load}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total Keys', value: stats.total, icon: Link2, color: 'text-blue-600 bg-blue-50' },
          { label: 'Connected', value: stats.connected, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
          { label: 'Binance', value: stats.binance, emoji: '🟡', color: 'text-yellow-700 bg-yellow-50' },
          { label: 'OKX', value: stats.okx, emoji: '⚫', color: 'text-slate-700 bg-slate-100' },
          { label: 'Bybit', value: stats.bybit, emoji: '🔶', color: 'text-orange-700 bg-orange-50' },
        ].map(({ label, value, icon: Icon, emoji, color }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  {emoji ? <span className="text-lg">{emoji}</span> : Icon && <Icon className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">API keys are stored encrypted</p>
          <p className="text-xs text-amber-700 mt-0.5">
            Only the first 8 and last 4 characters of each key are displayed here for verification.
            All keys are read-only — withdrawal access is never requested or stored.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by user or exchange…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF]"
          />
        </div>
        <select
          value={filterExchange}
          onChange={e => setFilterExchange(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF] bg-white"
        >
          <option value="all">All Exchanges</option>
          <option value="binance">Binance</option>
          <option value="okx">OKX</option>
          <option value="bybit">Bybit</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as typeof filterStatus)}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF] bg-white"
        >
          <option value="all">All Status</option>
          <option value="connected">Connected</option>
          <option value="unverified">Unverified</option>
        </select>
        <span className="text-xs text-slate-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <Card>
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Link2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No exchange connections found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((row, i) => {
              const meta = EXCHANGE_META[row.exchange] ?? { name: row.exchange, logo: '🔑', color: 'from-slate-400 to-slate-600' }
              const isExpanded = expanded === row.id
              return (
                <motion.div
                  key={row.id}
                  custom={i}
                  initial="hidden"
                  animate="show"
                  variants={fadeUp}
                  className="border border-slate-100 rounded-xl overflow-hidden"
                >
                  <div className="flex items-center gap-4 p-4 bg-white">
                    {/* Exchange badge */}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-xl flex-shrink-0`}>
                      {meta.logo}
                    </div>
                    {/* User info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900 text-sm">{row.user?.full_name ?? '—'}</p>
                        <span className="text-xs text-slate-400">{row.user?.email ?? row.user_id.slice(0, 8)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-medium text-slate-700">{meta.name}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">{row.label}</span>
                        <span className="text-xs font-mono text-slate-400">
                          {row.api_key.slice(0, 8)}••••{row.api_key.slice(-4)}
                        </span>
                      </div>
                    </div>
                    {/* Status */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {row.is_connected ? (
                        <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                          <CheckCircle className="w-3 h-3" /> Connected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-full font-medium">
                          <AlertCircle className="w-3 h-3" /> Unverified
                        </span>
                      )}
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setExpanded(isExpanded ? null : row.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleRemove(row.id)}
                        disabled={removing === row.id}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {removing === row.id
                          ? <div className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  </div>
                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <p className="text-slate-400 font-medium mb-0.5">User ID</p>
                        <p className="font-mono text-slate-600">{row.user_id.slice(0, 16)}…</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium mb-0.5">Key ID</p>
                        <p className="font-mono text-slate-600">{row.id.slice(0, 16)}…</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium mb-0.5">Last Tested</p>
                        <p className="text-slate-600">{row.last_tested ? new Date(row.last_tested).toLocaleDateString() : 'Never'}</p>
                      </div>
                      <div>
                        <p className="text-slate-400 font-medium mb-0.5">Connected At</p>
                        <p className="text-slate-600">{new Date(row.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </Card>

      {/* User summary */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-5 h-5 text-[#1E40AF]" />
          <h3 className="font-semibold text-slate-900">Users with Exchange Connections</h3>
        </div>
        <div className="text-sm text-slate-500">
          {new Set(rows.map(r => r.user_id)).size} unique users have connected at least one exchange account.
        </div>
      </Card>
    </div>
  )
}
