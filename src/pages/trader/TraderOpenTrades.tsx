import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, TrendingUp, TrendingDown, Clock, CheckCircle2, AlertTriangle,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useTraderProfile } from '@/hooks/useTraderProfile'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { TradeSignal, TradeDirection } from '@/types/database'

const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD', 'XAU/USD', 'BTC/USD', 'ETH/USD']

type TabKey = 'open' | 'history'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'open', label: 'Open Trades' },
  { key: 'history', label: 'Trade History' },
]

interface NewTradeForm {
  pair: string
  direction: TradeDirection
  entry_price: string
  stop_loss: string
  take_profit: string
  lot_size: string
}

const DEFAULT_FORM: NewTradeForm = {
  pair: 'EUR/USD',
  direction: 'buy',
  entry_price: '',
  stop_loss: '',
  take_profit: '',
  lot_size: '',
}

export default function TraderOpenTrades() {
  const { trader, loading: traderLoading } = useTraderProfile()
  const [activeTab, setActiveTab] = useState<TabKey>('open')
  const [trades, setTrades] = useState<TradeSignal[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<NewTradeForm>(DEFAULT_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [closingId, setClosingId] = useState<string | null>(null)

  const fetchTrades = async () => {
    if (!trader) return
    setLoading(true)
    const status = activeTab === 'open' ? 'open' : ['closed', 'cancelled']
    const query = supabase
      .from('trade_signals')
      .select('*')
      .eq('trader_id', trader.id)
      .order('opened_at', { ascending: false })
    if (activeTab === 'open') {
      query.eq('status', 'open')
    } else {
      query.in('status', ['closed', 'cancelled'])
    }
    const { data } = await query
    setTrades((data as TradeSignal[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (trader) fetchTrades()
  }, [trader, activeTab])

  const handleAddTrade = async () => {
    if (!trader) return
    const ep = parseFloat(form.entry_price)
    const sl = parseFloat(form.stop_loss)
    const tp = parseFloat(form.take_profit)
    const lot = parseFloat(form.lot_size)
    if ([ep, sl, tp, lot].some(isNaN) || lot <= 0 || ep <= 0) {
      toast.error('Please fill all fields with valid values.')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.from('trade_signals').insert({
      trader_id: trader.id,
      pair: form.pair,
      direction: form.direction,
      entry_price: ep,
      stop_loss: sl,
      take_profit: tp,
      lot_size: lot,
      status: 'open',
      opened_at: new Date().toISOString(),
    })
    setSubmitting(false)
    if (error) {
      toast.error('Failed to add trade: ' + error.message)
      return
    }
    toast.success('Trade added and will be copied to subscribers.')
    setShowModal(false)
    setForm(DEFAULT_FORM)
    fetchTrades()
  }

  const handleClose = async (tradeId: string) => {
    setClosingId(tradeId)
    const { error } = await supabase
      .from('trade_signals')
      .update({ status: 'closed', closed_at: new Date().toISOString() })
      .eq('id', tradeId)
    setClosingId(null)
    if (error) {
      toast.error('Failed to close trade.')
      return
    }
    toast.success('Trade closed successfully.')
    fetchTrades()
  }

  const dirBadge = (dir: TradeDirection) =>
    dir === 'buy'
      ? 'bg-green-100 text-green-700'
      : 'bg-red-100 text-red-700'

  const statusIcon = (status: string) => {
    if (status === 'open') return <Clock className="w-3.5 h-3.5 text-blue-500" />
    if (status === 'closed') return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
    return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
  }

  if (traderLoading) {
    return <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
  }

  if (!trader) {
    return (
      <Card>
        <div className="text-center py-16">
          <p className="text-slate-500">Set up your trader profile first.</p>
          <Button className="mt-4" onClick={() => (window.location.href = '/trader/profile')}>
            Set Up Profile
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trade Management</h1>
          <p className="text-slate-500 text-sm mt-1">Add and manage your trading positions.</p>
        </div>
        {activeTab === 'open' && (
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
            New Trade
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card padding="none">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-16">
            <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-500">
              {activeTab === 'open' ? 'No open positions' : 'No trade history yet'}
            </p>
            {activeTab === 'open' && (
              <p className="text-sm text-slate-400 mt-1">Click "New Trade" to open a position.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Pair', 'Dir', 'Entry', 'SL', 'TP', 'Lots', 'P&L', 'Opened', activeTab === 'open' ? 'Action' : 'Closed'].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-4 font-semibold text-slate-400 text-xs uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {trades.map((t, i) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-slate-50/60"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {statusIcon(t.status)}
                        <span className="font-semibold text-slate-800">{t.pair}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${dirBadge(t.direction)}`}>
                        {t.direction === 'buy' ? (
                          <TrendingUp className="w-3 h-3 inline mr-0.5" />
                        ) : (
                          <TrendingDown className="w-3 h-3 inline mr-0.5" />
                        )}
                        {t.direction}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">{t.entry_price.toFixed(4)}</td>
                    <td className="py-3 px-4 text-red-500 font-mono">{t.stop_loss.toFixed(4)}</td>
                    <td className="py-3 px-4 text-green-600 font-mono">{t.take_profit.toFixed(4)}</td>
                    <td className="py-3 px-4 text-slate-600">{t.lot_size.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      {t.profit_usd != null ? (
                        <span className={t.profit_usd >= 0 ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                          {t.profit_usd >= 0 ? '+' : ''}{formatCurrency(t.profit_usd)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">
                      {format(parseISO(t.opened_at), 'MMM d, HH:mm')}
                    </td>
                    <td className="py-3 px-4">
                      {activeTab === 'open' ? (
                        <button
                          onClick={() => handleClose(t.id)}
                          disabled={closingId === t.id}
                          className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {closingId === t.id ? 'Closing…' : 'Close'}
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {t.closed_at ? format(parseISO(t.closed_at), 'MMM d, HH:mm') : '—'}
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Trade Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 25 }}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900">Add New Trade</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Will be copied to all active subscribers</p>
                </div>
                <button
                  onClick={() => { setShowModal(false); setForm(DEFAULT_FORM) }}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-4">
                {/* Pair + Direction row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Pair</label>
                    <select
                      value={form.pair}
                      onChange={(e) => setForm((f) => ({ ...f, pair: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      {PAIRS.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Direction</label>
                    <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                      {(['buy', 'sell'] as TradeDirection[]).map((d) => (
                        <button
                          key={d}
                          onClick={() => setForm((f) => ({ ...f, direction: d }))}
                          className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                            form.direction === d
                              ? d === 'buy'
                                ? 'bg-green-500 text-white'
                                : 'bg-red-500 text-white'
                              : 'bg-white text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          {d === 'buy' ? '▲ Buy' : '▼ Sell'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Numeric fields */}
                {[
                  { key: 'entry_price', label: 'Entry Price' },
                  { key: 'stop_loss', label: 'Stop Loss' },
                  { key: 'take_profit', label: 'Take Profit' },
                  { key: 'lot_size', label: 'Lot Size' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">{label}</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      placeholder="0.00"
                      value={(form as unknown as Record<string, string>)[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 pb-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setShowModal(false); setForm(DEFAULT_FORM) }}
                >
                  Cancel
                </Button>
                <Button className="flex-1" loading={submitting} onClick={handleAddTrade}>
                  Open Trade
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
