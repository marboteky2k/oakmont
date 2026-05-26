import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Activity, Plus, Trash2, Save, RefreshCw, Globe,
  TrendingUp, TrendingDown, Eye, EyeOff, GripVertical,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

// ── Types ──────────────────────────────────────────────────────
interface MarketConfig {
  id: string
  category: 'crypto' | 'forex' | 'commodity'
  symbol: string
  name: string
  coingecko_id?: string
  base?: string
  quote?: string
  enabled: boolean
  sort_order: number
}

const PRESET_CRYPTO: Omit<MarketConfig, 'id' | 'sort_order'>[] = [
  { category: 'crypto', symbol: 'BTC/USDT', name: 'Bitcoin', coingecko_id: 'bitcoin', enabled: true },
  { category: 'crypto', symbol: 'ETH/USDT', name: 'Ethereum', coingecko_id: 'ethereum', enabled: true },
  { category: 'crypto', symbol: 'BNB/USDT', name: 'BNB', coingecko_id: 'binancecoin', enabled: true },
  { category: 'crypto', symbol: 'SOL/USDT', name: 'Solana', coingecko_id: 'solana', enabled: true },
  { category: 'crypto', symbol: 'XRP/USDT', name: 'Ripple', coingecko_id: 'ripple', enabled: true },
  { category: 'crypto', symbol: 'ADA/USDT', name: 'Cardano', coingecko_id: 'cardano', enabled: true },
  { category: 'crypto', symbol: 'AVAX/USDT', name: 'Avalanche', coingecko_id: 'avalanche-2', enabled: true },
  { category: 'crypto', symbol: 'DOGE/USDT', name: 'Dogecoin', coingecko_id: 'dogecoin', enabled: false },
]

const PRESET_FOREX: Omit<MarketConfig, 'id' | 'sort_order'>[] = [
  { category: 'forex', symbol: 'EUR/USD', name: 'Euro / US Dollar', base: 'EUR', quote: 'USD', enabled: true },
  { category: 'forex', symbol: 'GBP/USD', name: 'British Pound / US Dollar', base: 'GBP', quote: 'USD', enabled: true },
  { category: 'forex', symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', base: 'USD', quote: 'JPY', enabled: true },
  { category: 'forex', symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', base: 'USD', quote: 'CHF', enabled: true },
  { category: 'forex', symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', base: 'AUD', quote: 'USD', enabled: false },
  { category: 'forex', symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', base: 'USD', quote: 'CAD', enabled: false },
]

const PRESET_COMMODITY: Omit<MarketConfig, 'id' | 'sort_order'>[] = [
  { category: 'commodity', symbol: 'XAU/USD', name: 'Gold / US Dollar', enabled: true },
  { category: 'commodity', symbol: 'XAG/USD', name: 'Silver / US Dollar', enabled: false },
  { category: 'commodity', symbol: 'WTI/USD', name: 'Crude Oil WTI', enabled: true },
]

const CATEGORY_LABELS: Record<string, string> = {
  crypto: 'Cryptocurrency',
  forex: 'Forex Pairs',
  commodity: 'Commodities',
}

const CATEGORY_COLORS: Record<string, string> = {
  crypto:    'bg-orange-100 text-orange-700',
  forex:     'bg-blue-100 text-blue-700',
  commodity: 'bg-yellow-100 text-yellow-700',
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04 } }),
}

// ── Generate stable IDs ─────────────────────────────────────────
let _seq = 0
const uid = () => `local-${Date.now()}-${_seq++}`

// ── Component ───────────────────────────────────────────────────
export default function AdminMarkets() {
  const [markets, setMarkets] = useState<MarketConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [filterCat, setFilterCat] = useState<'all' | 'crypto' | 'forex' | 'commodity'>('all')
  const [liveStats, setLiveStats] = useState<Record<string, { price: number; change: number }>>({})

  // ── Load from site_settings ──────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'markets_config')
      .single()

    if (data?.value) {
      try {
        const parsed = JSON.parse(data.value) as MarketConfig[]
        setMarkets(parsed)
      } catch {
        seedDefaults()
      }
    } else {
      seedDefaults()
    }
    setLoading(false)
  }, [])

  const seedDefaults = () => {
    const all: MarketConfig[] = [
      ...PRESET_CRYPTO.map((m, i) => ({ ...m, id: uid(), sort_order: i })),
      ...PRESET_FOREX.map((m, i) => ({ ...m, id: uid(), sort_order: i })),
      ...PRESET_COMMODITY.map((m, i) => ({ ...m, id: uid(), sort_order: i })),
    ]
    setMarkets(all)
  }

  useEffect(() => { load() }, [load])

  // ── Fetch live crypto prices for preview ─────────────────────
  useEffect(() => {
    const cryptoIds = markets
      .filter(m => m.category === 'crypto' && m.coingecko_id && m.enabled)
      .map(m => m.coingecko_id!)
      .join(',')
    if (!cryptoIds) return

    const fetchPrices = async () => {
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${cryptoIds}&price_change_percentage=24h`
        )
        const data = await res.json()
        const map: Record<string, { price: number; change: number }> = {}
        for (const coin of data) {
          map[coin.id] = { price: coin.current_price, change: coin.price_change_percentage_24h ?? 0 }
        }
        setLiveStats(map)
      } catch { /* silently ignore */ }
    }
    fetchPrices()
  }, [markets.length])

  // ── Save to site_settings ─────────────────────────────────────
  const save = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert(
          { key: 'markets_config', value: JSON.stringify(markets), type: 'json', section: 'trading', updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )
      if (error) throw error
      toast.success('Market configuration saved!')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle enabled ────────────────────────────────────────────
  const toggleEnabled = (id: string) => {
    setMarkets(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m))
  }

  // ── Remove ───────────────────────────────────────────────────
  const remove = (id: string) => {
    setMarkets(prev => prev.filter(m => m.id !== id))
  }

  // ── Add custom pair ───────────────────────────────────────────
  const [addForm, setAddForm] = useState({ symbol: '', name: '', category: 'crypto' as MarketConfig['category'], coingecko_id: '' })
  const [showAdd, setShowAdd] = useState(false)

  const handleAdd = () => {
    if (!addForm.symbol.trim() || !addForm.name.trim()) { toast.error('Symbol and name are required'); return }
    const newItem: MarketConfig = {
      id: uid(),
      category: addForm.category,
      symbol: addForm.symbol.trim().toUpperCase(),
      name: addForm.name.trim(),
      coingecko_id: addForm.coingecko_id.trim() || undefined,
      enabled: true,
      sort_order: markets.length,
    }
    setMarkets(prev => [...prev, newItem])
    setAddForm({ symbol: '', name: '', category: 'crypto', coingecko_id: '' })
    setShowAdd(false)
    toast.success('Pair added — click Save to persist.')
  }

  const filtered = filterCat === 'all' ? markets : markets.filter(m => m.category === filterCat)
  const enabledCount = markets.filter(m => m.enabled).length

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
          <h1 className="text-2xl font-bold text-slate-900">Markets Configuration</h1>
          <p className="text-sm text-slate-500 mt-1">
            Control which market pairs are visible to all users on the Markets page.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-3.5 h-3.5" /> Add Pair
          </Button>
          <Button onClick={save} loading={saving}>
            <Save className="w-4 h-4" /> Save Config
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {(['all', 'crypto', 'forex', 'commodity'] as const).map(cat => {
          const count = cat === 'all' ? markets.length : markets.filter(m => m.category === cat).length
          const enabled = cat === 'all' ? enabledCount : markets.filter(m => m.category === cat && m.enabled).length
          return (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`text-left p-4 rounded-2xl border-2 transition-all ${
                filterCat === cat ? 'border-[#1E40AF] bg-blue-50' : 'border-slate-100 bg-white hover:border-slate-200'
              }`}
            >
              <p className="text-xs font-medium text-slate-500 capitalize mb-1">
                {cat === 'all' ? 'All Pairs' : CATEGORY_LABELS[cat]}
              </p>
              <p className="text-2xl font-bold text-slate-900">{count}</p>
              <p className="text-xs text-slate-400 mt-0.5">{enabled} enabled</p>
            </button>
          )
        })}
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <Globe className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Live for all users instantly</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Toggling a pair on/off and saving updates what users see in real time on their Markets page.
            Disabled pairs are hidden; enabled pairs show live prices from CoinGecko (crypto) or simulated feeds (forex/commodity).
          </p>
        </div>
      </div>

      {/* Market pairs list */}
      <Card>
        <div className="space-y-2">
          {filtered.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-8">No pairs in this category.</p>
          )}
          {filtered.map((m, i) => {
            const live = m.coingecko_id ? liveStats[m.coingecko_id] : null
            const isPositive = (live?.change ?? 0) >= 0
            return (
              <motion.div
                key={m.id}
                custom={i}
                initial="hidden"
                animate="show"
                variants={fadeUp}
                className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all ${
                  m.enabled ? 'bg-white border-slate-100' : 'bg-slate-50 border-slate-100 opacity-60'
                }`}
              >
                <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0 cursor-grab" />
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${CATEGORY_COLORS[m.category]}`}>
                  {CATEGORY_LABELS[m.category]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{m.symbol}</p>
                  <p className="text-xs text-slate-400">{m.name}</p>
                </div>
                {/* Live price preview */}
                {live && (
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-sm font-bold text-slate-900">
                      ${live.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                    <p className={`text-xs flex items-center justify-end gap-0.5 ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {isPositive ? '+' : ''}{live.change.toFixed(2)}%
                    </p>
                  </div>
                )}
                {m.coingecko_id && (
                  <span className="text-xs text-slate-400 font-mono hidden md:block flex-shrink-0">{m.coingecko_id}</span>
                )}
                {/* Toggle */}
                <button
                  onClick={() => toggleEnabled(m.id)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex-shrink-0 ${
                    m.enabled
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {m.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {m.enabled ? 'Visible' : 'Hidden'}
                </button>
                <button
                  onClick={() => remove(m.id)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )
          })}
        </div>
      </Card>

      {/* Add pair modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#1E40AF]" />
              </div>
              <h3 className="font-bold text-slate-900">Add Custom Pair</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category</label>
                <select
                  value={addForm.category}
                  onChange={e => setAddForm(p => ({ ...p, category: e.target.value as MarketConfig['category'] }))}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF]"
                >
                  <option value="crypto">Cryptocurrency</option>
                  <option value="forex">Forex</option>
                  <option value="commodity">Commodity</option>
                </select>
              </div>
              <Input
                label="Symbol (e.g. BTC/USDT)"
                placeholder="BTC/USDT"
                value={addForm.symbol}
                onChange={e => setAddForm(p => ({ ...p, symbol: e.target.value }))}
              />
              <Input
                label="Display Name"
                placeholder="Bitcoin"
                value={addForm.name}
                onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
              />
              {addForm.category === 'crypto' && (
                <Input
                  label="CoinGecko ID (for live prices)"
                  placeholder="bitcoin"
                  value={addForm.coingecko_id}
                  onChange={e => setAddForm(p => ({ ...p, coingecko_id: e.target.value }))}
                />
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleAdd} className="flex-1">
                <Plus className="w-4 h-4" /> Add Pair
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
