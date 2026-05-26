import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Edit2, ToggleLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatCurrency } from '@/lib/utils'
import type { InvestmentPlan } from '@/types/database'
import toast from 'react-hot-toast'

const emptyPlan = {
  name: '', description: '', min_amount: 100, max_amount: 10000,
  roi_percentage: 10, period_days: 30, risk_level: 'medium',
}

export default function AdminInvestments() {
  const [plans, setPlans] = useState<InvestmentPlan[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<any>(emptyPlan)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const fetch = async () => {
    const { data } = await supabase.from('investment_plans').select('*').order('roi_percentage')
    setPlans(data ?? [])
  }

  useEffect(() => { fetch() }, [])

  const save = async () => {
    setSaving(true)
    try {
      if (editId) {
        const { error } = await supabase.from('investment_plans').update(form).eq('id', editId)
        if (error) throw error
        toast.success('Plan updated!')
      } else {
        const { error } = await supabase.from('investment_plans').insert({ ...form, is_active: true })
        if (error) throw error
        toast.success('Plan created!')
      }
      setShowModal(false)
      setForm(emptyPlan)
      setEditId(null)
      fetch()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (p: InvestmentPlan) => {
    await supabase.from('investment_plans').update({ is_active: !p.is_active }).eq('id', p.id)
    fetch()
  }

  const openEdit = (p: InvestmentPlan) => {
    setForm({
      name: p.name, description: p.description, min_amount: p.min_amount, max_amount: p.max_amount,
      roi_percentage: p.roi_percentage, period_days: p.period_days, risk_level: p.risk_level,
    })
    setEditId(p.id)
    setShowModal(true)
  }

  const riskVariant = (r: string): any => r === 'low' ? 'success' : r === 'medium' ? 'warning' : 'danger'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Investment Plans</h1>
        <Button onClick={() => { setForm(emptyPlan); setEditId(null); setShowModal(true) }}>
          <Plus className="w-4 h-4" /> Add Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card hover>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-slate-900">{p.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{p.period_days} days</p>
                </div>
                <div className="flex gap-1.5">
                  <Badge variant={riskVariant(p.risk_level)} size="sm" className="capitalize">{p.risk_level}</Badge>
                  <Badge variant={p.is_active ? 'success' : 'default'} size="sm">{p.is_active ? 'Active' : 'Off'}</Badge>
                </div>
              </div>
              <p className="text-4xl font-black text-[#1E40AF] mb-2">{p.roi_percentage}%</p>
              <div className="text-xs text-slate-500 space-y-1 mb-4">
                <p>Min: {formatCurrency(p.min_amount)} — Max: {formatCurrency(p.max_amount)}</p>
                <p className="line-clamp-2">{p.description}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(p)} className="flex-1 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 flex items-center justify-center gap-1">
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
                <button onClick={() => toggle(p)} className="flex-1 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 flex items-center justify-center gap-1">
                  <ToggleLeft className="w-3 h-3" /> {p.is_active ? 'Disable' : 'Enable'}
                </button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Plan' : 'New Investment Plan'} size="md">
        <div className="space-y-4">
          <Input label="Plan Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Starter Plan" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="ROI (%)" type="number" value={form.roi_percentage} onChange={e => setForm({ ...form, roi_percentage: parseFloat(e.target.value) })} />
            <Input label="Period (Days)" type="number" value={form.period_days} onChange={e => setForm({ ...form, period_days: parseInt(e.target.value) })} />
            <Input label="Min Amount ($)" type="number" value={form.min_amount} onChange={e => setForm({ ...form, min_amount: parseFloat(e.target.value) })} />
            <Input label="Max Amount ($)" type="number" value={form.max_amount} onChange={e => setForm({ ...form, max_amount: parseFloat(e.target.value) })} />
          </div>
          <Select label="Risk Level" value={form.risk_level} onChange={e => setForm({ ...form, risk_level: e.target.value })}
            options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} />
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Describe this plan..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent resize-none" />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={save} loading={saving} className="flex-1">{editId ? 'Update' : 'Create'} Plan</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
