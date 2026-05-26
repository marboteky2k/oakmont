import { useEffect, useState } from 'react'
import { Plus, Edit2, ToggleLeft, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { CryptoWallet, Currency } from '@/types/database'
import toast from 'react-hot-toast'

export default function AdminCryptoWallets() {
  const [wallets, setWallets] = useState<CryptoWallet[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ currency: 'USDT', network: '', address: '', label: '' })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)

  const fetch = async () => {
    const { data } = await supabase.from('crypto_wallets').select('*').order('created_at', { ascending: false })
    setWallets(data ?? [])
  }

  useEffect(() => { fetch() }, [])

  const save = async () => {
    setSaving(true)
    try {
      if (editId) {
        const { error } = await supabase.from('crypto_wallets').update(form).eq('id', editId)
        if (error) throw error
        toast.success('Wallet updated!')
      } else {
        const { error } = await supabase.from('crypto_wallets').insert({ ...form, is_active: true })
        if (error) throw error
        toast.success('Wallet added!')
      }
      setShowModal(false)
      setForm({ currency: 'USDT', network: '', address: '', label: '' })
      setEditId(null)
      fetch()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (w: CryptoWallet) => {
    await supabase.from('crypto_wallets').update({ is_active: !w.is_active }).eq('id', w.id)
    fetch()
  }

  const remove = async (id: string) => {
    await supabase.from('crypto_wallets').delete().eq('id', id)
    toast.success('Wallet removed')
    fetch()
  }

  const openEdit = (w: CryptoWallet) => {
    setForm({ currency: w.currency, network: w.network, address: w.address, label: w.label })
    setEditId(w.id)
    setShowModal(true)
  }

  const currencyColors: Record<Currency, string> = {
    USDT: 'bg-green-100 text-green-700',
    BTC: 'bg-orange-100 text-orange-700',
    ETH: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Deposit Wallets</h1>
        <Button onClick={() => { setForm({ currency: 'USDT', network: '', address: '', label: '' }); setEditId(null); setShowModal(true) }}>
          <Plus className="w-4 h-4" /> Add Wallet
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wallets.map(w => (
          <Card key={w.id} hover>
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded-lg text-sm font-bold ${currencyColors[w.currency]}`}>
                {w.currency}
              </span>
              <div className="flex-1">
                <p className="font-medium text-slate-900">{w.label}</p>
                <p className="text-xs text-slate-500">{w.network}</p>
              </div>
              <Badge variant={w.is_active ? 'success' : 'default'} size="sm">
                {w.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <code className="text-xs font-mono text-slate-600 bg-slate-50 rounded-lg px-3 py-2 block break-all mb-3">
              {w.address}
            </code>
            {/* QR code preview */}
            <div className="flex items-center gap-3 mb-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(w.address)}&size=72x72&margin=4`}
                alt="QR"
                className="w-16 h-16 rounded-lg border border-slate-200 flex-shrink-0"
              />
              <div className="text-xs text-slate-400 leading-relaxed">
                Scan to verify address.<br />Used in investor deposit flow.
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(w)} className="flex-1 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 flex items-center justify-center gap-1">
                <Edit2 className="w-3 h-3" /> Edit
              </button>
              <button onClick={() => toggle(w)} className="flex-1 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 flex items-center justify-center gap-1">
                <ToggleLeft className="w-3 h-3" /> {w.is_active ? 'Disable' : 'Enable'}
              </button>
              <button onClick={() => remove(w.id)} className="py-1.5 px-3 rounded-lg bg-red-50 text-red-600 text-xs hover:bg-red-100 flex items-center gap-1">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editId ? 'Edit Wallet' : 'Add Deposit Wallet'}>
        <div className="space-y-4">
          <Select label="Currency" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
            options={[{ value: 'USDT', label: 'USDT' }, { value: 'BTC', label: 'Bitcoin (BTC)' }, { value: 'ETH', label: 'Ethereum (ETH)' }]} />
          <Input label="Network" placeholder="e.g. TRC-20, ERC-20, BEP-20" value={form.network} onChange={e => setForm({ ...form, network: e.target.value })} />
          <Input label="Wallet Address" placeholder="Paste wallet address..." value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          <Input label="Label" placeholder="e.g. USDT TRC-20 Main" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} />
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={save} loading={saving} className="flex-1">{editId ? 'Update' : 'Add'} Wallet</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
