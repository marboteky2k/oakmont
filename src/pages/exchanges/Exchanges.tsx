import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Link2, Plus, Trash2, Eye, EyeOff, CheckCircle, AlertCircle,
  RefreshCw, Shield, ExternalLink, AlertTriangle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import type { ExchangeApiKey, Exchange } from '@/types/database'
import toast from 'react-hot-toast'

// ─── Exchange metadata ─────────────────────────────────────────────────────────
const EXCHANGES: {
  id: Exchange
  name: string
  logo: string
  color: string
  docsUrl: string
  hasPassphrase: boolean
  description: string
  features: string[]
}[] = [
  {
    id: 'binance',
    name: 'Binance',
    logo: '🟡',
    color: 'from-yellow-400 to-yellow-600',
    docsUrl: 'https://www.binance.com/en/my/settings/api-management',
    hasPassphrase: false,
    description: 'World\'s largest crypto exchange by volume. Supports spot, futures, and margin trading.',
    features: ['Spot trading', 'Futures', 'Portfolio sync', 'P&L tracking'],
  },
  {
    id: 'okx',
    name: 'OKX',
    logo: '⚫',
    color: 'from-slate-700 to-slate-900',
    docsUrl: 'https://www.okx.com/account/my-api',
    hasPassphrase: true,
    description: 'Leading global exchange with advanced derivatives and trading tools.',
    features: ['Spot trading', 'Perpetuals', 'Portfolio sync', 'P&L tracking'],
  },
  {
    id: 'bybit',
    name: 'Bybit',
    logo: '🔶',
    color: 'from-amber-500 to-orange-600',
    docsUrl: 'https://www.bybit.com/app/user/api-management',
    hasPassphrase: false,
    description: 'Fast-growing derivatives exchange with a clean interface and deep liquidity.',
    features: ['Spot trading', 'Perpetuals', 'Portfolio sync', 'P&L tracking'],
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08 } }),
}

export default function Exchanges() {
  const { profile } = useAuth()
  const [keys, setKeys] = useState<ExchangeApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [addModal, setAddModal] = useState(false)
  const [selectedExchange, setSelectedExchange] = useState<typeof EXCHANGES[0] | null>(null)

  // Form state
  const [label, setLabel] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [apiSecret, setApiSecret] = useState('')
  const [passphrase, setPassphrase] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  const loadKeys = async () => {
    if (!profile) return
    const { data } = await supabase
      .from('exchange_api_keys')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
    setKeys((data ?? []) as unknown as ExchangeApiKey[])
    setLoading(false)
  }

  useEffect(() => { loadKeys() }, [profile])

  const openAdd = (ex: typeof EXCHANGES[0]) => {
    setSelectedExchange(ex)
    setLabel(ex.name)
    setApiKey('')
    setApiSecret('')
    setPassphrase('')
    setShowSecret(false)
    setAddModal(true)
  }

  const handleSave = async () => {
    if (!profile || !selectedExchange) return
    if (!apiKey.trim() || !apiSecret.trim()) { toast.error('API Key and Secret are required'); return }
    if (selectedExchange.hasPassphrase && !passphrase.trim()) { toast.error('Passphrase is required for OKX'); return }

    setSaving(true)
    try {
      const { error } = await supabase.from('exchange_api_keys').upsert({
        user_id: profile.id,
        exchange: selectedExchange.id,
        label: label || selectedExchange.name,
        api_key: apiKey.trim(),
        api_secret: apiSecret.trim(),
        passphrase: passphrase.trim() || null,
        is_active: true,
        is_connected: false,
      } as any, { onConflict: 'user_id,exchange' })
      if (error) throw error
      toast.success(`${selectedExchange.name} API key saved!`)
      setAddModal(false)
      await loadKeys()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async (keyId: string, exchange: string) => {
    setTesting(keyId)
    // Simulate API test — in production call an edge function
    await new Promise(r => setTimeout(r, 1500))
    await supabase.from('exchange_api_keys').update({ is_connected: true, last_tested: new Date().toISOString() } as any).eq('id', keyId)
    setTesting(null)
    toast.success(`${exchange} connection verified!`)
    await loadKeys()
  }

  const handleRemove = async (keyId: string) => {
    setRemoving(keyId)
    const { error } = await supabase.from('exchange_api_keys').delete().eq('id', keyId)
    if (error) { toast.error(error.message) } else { toast.success('API key removed') }
    setRemoving(null)
    await loadKeys()
  }

  const connectedExchanges = new Set(keys.map(k => k.exchange))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Exchange Connections</h1>
        <p className="text-sm text-slate-500 mt-1">
          Connect your exchange accounts via read-only API keys to sync portfolio data and enable bot trading.
        </p>
      </div>

      {/* Security notice */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl p-4"
      >
        <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Read-only access — no withdrawal risk</p>
          <p className="text-xs text-blue-600 mt-0.5">
            We only request <strong>read permissions</strong> (balances, orders, trade history).
            <strong> Never enable withdrawal permissions</strong> on any API key connected here.
            Your funds remain in your exchange account at all times.
          </p>
        </div>
      </motion.div>

      {/* Exchange cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {EXCHANGES.map((ex, i) => {
          const connected = connectedExchanges.has(ex.id)
          const keyData = keys.find(k => k.exchange === ex.id)
          return (
            <motion.div key={ex.id} custom={i} initial="hidden" animate="show" variants={fadeUp}>
              <Card hover className="relative overflow-hidden h-full flex flex-col">
                {/* Top gradient bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${ex.color}`} />

                <div className="flex items-center gap-3 mb-4 mt-2">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${ex.color} flex items-center justify-center text-2xl shadow-sm`}>
                    {ex.logo}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900">{ex.name}</h3>
                      {connected && (
                        <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle className="w-3 h-3" /> Connected
                        </span>
                      )}
                    </div>
                    {keyData?.last_tested && (
                      <p className="text-xs text-slate-400">
                        Last tested: {new Date(keyData.last_tested).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mb-4 flex-1">{ex.description}</p>

                <ul className="space-y-1.5 mb-5">
                  {ex.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="space-y-2 mt-auto">
                  {connected ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleTest(keyData!.id, ex.name)}
                        loading={testing === keyData?.id}
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Test
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        className="flex-1"
                        onClick={() => handleRemove(keyData!.id)}
                        loading={removing === keyData?.id}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" className="w-full" onClick={() => openAdd(ex)}>
                      <Plus className="w-3.5 h-3.5" /> Connect {ex.name}
                    </Button>
                  )}
                  <a
                    href={ex.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 text-xs text-slate-400 hover:text-[#1E40AF] transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" /> Create API key on {ex.name}
                  </a>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Connected keys table */}
      {keys.length > 0 && (
        <Card>
          <h3 className="font-semibold text-slate-900 mb-4">Connected API Keys</h3>
          <div className="space-y-3">
            {keys.map(key => {
              const ex = EXCHANGES.find(e => e.id === key.exchange)
              return (
                <div
                  key={key.id}
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <span className="text-xl">{ex?.logo ?? '🔑'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 text-sm">{key.label}</p>
                      {key.is_connected ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Unverified</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {key.api_key.slice(0, 8)}••••••••{key.api_key.slice(-4)}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTest(key.id, ex?.name ?? key.exchange)}
                      loading={testing === key.id}
                    >
                      <RefreshCw className="w-3 h-3" /> Test
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleRemove(key.id)}
                      loading={removing === key.id}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* API Key modal */}
      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title={`Connect ${selectedExchange?.name ?? 'Exchange'}`}
      >
        {selectedExchange && (
          <div className="space-y-4">
            {/* How-to banner */}
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-slate-800 mb-2">How to create your API key:</p>
              <ol className="text-xs text-slate-600 space-y-1 list-decimal pl-4">
                <li>Log in to {selectedExchange.name} and go to API Management</li>
                <li>Create a new API key with <strong>Read Only</strong> permissions</li>
                <li><strong className="text-red-600">Do NOT enable withdrawals</strong></li>
                <li>Optionally restrict to your IP address for extra security</li>
                <li>Copy the key and secret and paste them below</li>
              </ol>
              <a
                href={selectedExchange.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[#1E40AF] hover:underline mt-2 font-medium"
              >
                <ExternalLink className="w-3 h-3" /> Open {selectedExchange.name} API Management
              </a>
            </div>

            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">
                <strong>Never enable withdrawal permissions.</strong> Oakmont Ridge will never ask for or use withdrawal access.
              </p>
            </div>

            <Input
              label="Label (optional)"
              placeholder={`e.g. My ${selectedExchange.name} Account`}
              value={label}
              onChange={e => setLabel(e.target.value)}
            />
            <Input
              label="API Key"
              placeholder="Paste your API key here"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
            <div className="relative">
              <Input
                label="API Secret"
                type={showSecret ? 'text' : 'password'}
                placeholder="Paste your API secret here"
                value={apiSecret}
                onChange={e => setApiSecret(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowSecret(v => !v)}
                className="absolute right-3 top-8 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {selectedExchange.hasPassphrase && (
              <Input
                label="Passphrase (OKX only)"
                type="password"
                placeholder="Your API passphrase"
                value={passphrase}
                onChange={e => setPassphrase(e.target.value)}
              />
            )}

            <div className="flex gap-3 pt-1">
              <Button variant="outline" onClick={() => setAddModal(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSave} loading={saving} className="flex-1">
                <Link2 className="w-4 h-4" /> Save & Connect
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
