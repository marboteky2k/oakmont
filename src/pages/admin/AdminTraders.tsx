import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Star, Shield, Edit2, ToggleLeft, ToggleRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency, formatPercent, getRiskColor } from '@/lib/utils'
import type { CopyTrader } from '@/types/database'
import toast from 'react-hot-toast'

const emptyForm = {
  display_name: '', bio: '', trading_style: 'swing', risk_level: 'medium',
  performance_fee: 10, min_copy_amount: 100, max_drawdown: 20, win_rate: 75,
  total_return_pct: 0, monthly_return_pct: 0,
}

export default function AdminTraders() {
  const [traders, setTraders] = useState<CopyTrader[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<any>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)

  const fetchTraders = async () => {
    const { data } = await supabase.from('copy_traders').select('*').order('total_return_pct', { ascending: false })
    setTraders(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchTraders() }, [])

  const saveTrader = async () => {
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase.from('copy_traders').update(form).eq('id', editing)
        if (error) throw error
        toast.success('Trader updated!')
      } else {
        const { error } = await supabase.from('copy_traders').insert({
          ...form,
          is_active: true,
          is_verified: false,
          is_featured: false,
          followers_count: 0,
          assets_under_management: 0,
          created_at: new Date().toISOString(),
        })
        if (error) throw error
        toast.success('Trader created!')
      }
      setShowModal(false)
      setForm(emptyForm)
      setEditing(null)
      fetchTraders()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggleVerified = async (t: CopyTrader) => {
    await supabase.from('copy_traders').update({ is_verified: !t.is_verified }).eq('id', t.id)
    fetchTraders()
  }

  const toggleFeatured = async (t: CopyTrader) => {
    await supabase.from('copy_traders').update({ is_featured: !t.is_featured }).eq('id', t.id)
    fetchTraders()
  }

  const openEdit = (t: CopyTrader) => {
    setForm({
      display_name: t.display_name, bio: t.bio ?? '', trading_style: t.trading_style,
      risk_level: t.risk_level, performance_fee: t.performance_fee, min_copy_amount: t.min_copy_amount,
      max_drawdown: t.max_drawdown, win_rate: t.win_rate, total_return_pct: t.total_return_pct,
      monthly_return_pct: t.monthly_return_pct,
    })
    setEditing(t.id)
    setShowModal(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Copy Traders</h1>
        <Button onClick={() => { setForm(emptyForm); setEditing(null); setShowModal(true) }}>
          <Plus className="w-4 h-4" /> Add Trader
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)
        ) : (
          traders.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card hover>
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {t.display_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{t.display_name}</p>
                    <p className="text-xs text-slate-500 capitalize">{t.trading_style?.replace('_', ' ')}</p>
                  </div>
                  <div className="flex gap-1">
                    {t.is_verified && <Badge variant="info" size="sm">✓</Badge>}
                    {t.is_featured && <Badge variant="warning" size="sm">★</Badge>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                  <div className="text-center bg-green-50 rounded-lg p-2">
                    <p className="font-bold text-green-600">{formatPercent(t.total_return_pct)}</p>
                    <p className="text-slate-500">Return</p>
                  </div>
                  <div className="text-center bg-blue-50 rounded-lg p-2">
                    <p className="font-bold text-[#1E40AF]">{t.win_rate}%</p>
                    <p className="text-slate-500">Win Rate</p>
                  </div>
                  <div className="text-center bg-slate-50 rounded-lg p-2">
                    <p className="font-bold text-slate-700">{t.followers_count}</p>
                    <p className="text-slate-500">Followers</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => openEdit(t)} className="flex-1 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors flex items-center justify-center gap-1">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button onClick={() => toggleVerified(t)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${t.is_verified ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                    <Shield className="w-3 h-3" /> {t.is_verified ? 'Verified' : 'Verify'}
                  </button>
                  <button onClick={() => toggleFeatured(t)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${t.is_featured ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                    <Star className="w-3 h-3" /> {t.is_featured ? 'Featured' : 'Feature'}
                  </button>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Trader' : 'Add Trader'} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Display Name" value={form.display_name} onChange={e => setForm({ ...form, display_name: e.target.value })} />
          <Select label="Trading Style" value={form.trading_style} onChange={e => setForm({ ...form, trading_style: e.target.value })}
            options={[
              { value: 'scalping', label: 'Scalping' }, { value: 'swing', label: 'Swing' },
              { value: 'day_trading', label: 'Day Trading' }, { value: 'position', label: 'Position' },
            ]} />
          <Select label="Risk Level" value={form.risk_level} onChange={e => setForm({ ...form, risk_level: e.target.value })}
            options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
          <Input label="Performance Fee (%)" type="number" value={form.performance_fee} onChange={e => setForm({ ...form, performance_fee: parseFloat(e.target.value) })} />
          <Input label="Min Copy Amount ($)" type="number" value={form.min_copy_amount} onChange={e => setForm({ ...form, min_copy_amount: parseFloat(e.target.value) })} />
          <Input label="Max Drawdown (%)" type="number" value={form.max_drawdown} onChange={e => setForm({ ...form, max_drawdown: parseFloat(e.target.value) })} />
          <Input label="Win Rate (%)" type="number" value={form.win_rate} onChange={e => setForm({ ...form, win_rate: parseFloat(e.target.value) })} />
          <Input label="Total Return (%)" type="number" value={form.total_return_pct} onChange={e => setForm({ ...form, total_return_pct: parseFloat(e.target.value) })} />
          <Input label="Monthly Return (%)" type="number" value={form.monthly_return_pct} onChange={e => setForm({ ...form, monthly_return_pct: parseFloat(e.target.value) })} />
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Bio</label>
            <textarea
              rows={3}
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              placeholder="Trader bio..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
          <Button onClick={saveTrader} loading={saving} className="flex-1">{editing ? 'Update' : 'Create'} Trader</Button>
        </div>
      </Modal>
    </div>
  )
}
