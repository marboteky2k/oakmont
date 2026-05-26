import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Users, TrendingUp, DollarSign, CheckCircle2,
  AlertTriangle, RefreshCw, Info, Zap, Target,
  BarChart2, ArrowUpRight, Search,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Wallet } from '@/types/database'

interface PartialUser { id: string; full_name: string; email: string; role: string }

type TargetGroup = 'all' | 'investors' | 'copy_traders' | 'specific'
type CreditMode = 'percent' | 'fixed'

interface UserRow {
  id: string
  full_name: string
  email: string
  role: string
  balance_usdt: number
  credit: number
  newBalance: number
}

interface AiRecommendation {
  label: string
  pct: number
  description: string
  tier: 'conservative' | 'moderate' | 'aggressive'
}

const TARGET_OPTIONS = [
  { value: 'all',          label: 'All Users' },
  { value: 'investors',    label: 'Investors Only' },
  { value: 'copy_traders', label: 'Copy Traders Only' },
  { value: 'specific',     label: 'Specific User' },
]

const MODE_OPTIONS = [
  { value: 'percent', label: 'Percentage (%)' },
  { value: 'fixed',   label: 'Fixed Amount ($)' },
]

const AI_RECOMMENDATIONS: AiRecommendation[] = [
  {
    label: 'Conservative Boost',
    pct: 2.5,
    description: 'Steady 2.5% credit — ideal for low-balance users under $5K',
    tier: 'conservative',
  },
  {
    label: 'Standard Return',
    pct: 5.0,
    description: 'Monthly 5% profit distribution aligned with Basic plan yield',
    tier: 'moderate',
  },
  {
    label: 'Premium Yield',
    pct: 10.0,
    description: '10% credit matching Premium plan returns for active investors',
    tier: 'moderate',
  },
  {
    label: 'High-Performance',
    pct: 18.0,
    description: 'Aggressive 18% return for VIP-tier accounts over $50K',
    tier: 'aggressive',
  },
]

const TIER_COLORS: Record<AiRecommendation['tier'], string> = {
  conservative: 'bg-green-50 border-green-200 text-green-700',
  moderate:     'bg-blue-50 border-blue-200 text-blue-700',
  aggressive:   'bg-amber-50 border-amber-200 text-amber-700',
}

export default function AdminProfitEngine() {
  const [targetGroup, setTargetGroup] = useState<TargetGroup>('investors')
  const [creditMode, setCreditMode]   = useState<CreditMode>('percent')
  const [creditValue, setCreditValue] = useState('')
  const [searchEmail, setSearchEmail] = useState('')
  const [note, setNote]               = useState('')

  const [users, setUsers]         = useState<UserRow[]>([])
  const [loading, setLoading]     = useState(false)
  const [applying, setApplying]   = useState(false)
  const [progress, setProgress]   = useState(0)
  const [done, setDone]           = useState(false)
  const [applied, setApplied]     = useState(0)
  const [totalCredited, setTotalCredited] = useState(0)

  const numericValue = parseFloat(creditValue) || 0

  // ── Load preview rows ────────────────────────────────────────────────────
  async function loadPreview() {
    setLoading(true)
    setDone(false)

    // Build role filter
    const roleFilter =
      targetGroup === 'investors'    ? ['investor'] :
      targetGroup === 'copy_traders' ? ['copy_trader'] :
      targetGroup === 'all'          ? ['investor', 'copy_trader'] :
      null

    let query = supabase
      .from('users')
      .select('id, full_name, email, role')
      .eq('is_active', true)

    if (roleFilter) {
      query = query.in('role', roleFilter)
    } else if (searchEmail) {
      query = query.ilike('email', `%${searchEmail}%`)
    }

    const { data: usersData, error } = await query.limit(200)
    if (error || !usersData) { setLoading(false); return }

    // Fetch wallets
    const ids = (usersData as PartialUser[]).map((u) => u.id)
    const { data: walletsData } = await supabase
      .from('wallets')
      .select('user_id, balance_usdt')
      .in('user_id', ids)

    const walletMap: Record<string, number> = {}
    ;(walletsData as Wallet[] ?? []).forEach((w) => {
      walletMap[w.user_id] = w.balance_usdt
    })

    const rows: UserRow[] = (usersData as PartialUser[]).map((u) => {
      const bal = walletMap[u.id] ?? 0
      const credit =
        creditMode === 'percent'
          ? parseFloat(((bal * numericValue) / 100).toFixed(2))
          : numericValue
      return {
        id:         u.id,
        full_name:  u.full_name,
        email:      u.email,
        role:       u.role,
        balance_usdt: bal,
        credit,
        newBalance: parseFloat((bal + credit).toFixed(2)),
      }
    })

    setUsers(rows)
    setLoading(false)
  }

  // Reload when filters change
  useEffect(() => {
    if (numericValue > 0) loadPreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetGroup, creditMode, numericValue, searchEmail])

  // Recompute credits when value changes without re-fetching
  const preview = useMemo<UserRow[]>(() => {
    return users.map((u) => {
      const credit =
        creditMode === 'percent'
          ? parseFloat(((u.balance_usdt * numericValue) / 100).toFixed(2))
          : numericValue
      return { ...u, credit, newBalance: parseFloat((u.balance_usdt + credit).toFixed(2)) }
    })
  }, [users, creditMode, numericValue])

  const totalCredit = useMemo(() => preview.reduce((s, u) => s + u.credit, 0), [preview])

  // ── Apply profit ─────────────────────────────────────────────────────────
  async function applyProfit() {
    if (!preview.length || numericValue <= 0) {
      toast.error('Set a credit value and load users first')
      return
    }
    setApplying(true)
    setProgress(0)
    setDone(false)

    let credited = 0
    let totalAmt = 0
    const BATCH = 10

    for (let i = 0; i < preview.length; i += BATCH) {
      const batch = preview.slice(i, i + BATCH)

      await Promise.all(
        batch.map(async (u) => {
          // 1. Update wallet balance
          const { error: we } = await supabase
            .from('wallets')
            .update({ balance_usdt: u.newBalance })
            .eq('user_id', u.id)

          if (we) return

          // 2. Insert profit transaction
          await supabase.from('transactions').insert({
            user_id:     u.id,
            type:        'profit',
            amount:      u.credit,
            currency:    'USDT',
            status:      'confirmed',
            description: note || `AI Profit Engine — ${creditMode === 'percent' ? numericValue + '%' : '$' + numericValue} credit`,
          })

          // 3. Insert audit log
          await supabase.from('audit_logs').insert({
            action:       'profit_credit',
            entity_type:  'wallet',
            entity_id:    u.id,
            new_values:   { amount: u.credit, mode: creditMode, value: numericValue },
          })

          credited++
          totalAmt = parseFloat((totalAmt + u.credit).toFixed(2))
        }),
      )

      setProgress(Math.round(((i + BATCH) / preview.length) * 100))
    }

    setApplied(credited)
    setTotalCredited(totalAmt)
    setApplying(false)
    setDone(true)
    toast.success(`Profit applied to ${credited} accounts`)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">AI Profit Engine</h1>
          </div>
          <p className="text-slate-500 text-sm">
            Distribute profit credits to user wallets in bulk — preview before applying.
          </p>
        </div>

        {done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2.5 text-sm font-medium"
          >
            <CheckCircle2 className="w-4 h-4" />
            {applied} accounts credited · {formatCurrency(totalCredited)} total
          </motion.div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users,         label: 'Users Selected',   value: preview.length.toString(),    color: 'text-blue-600',  bg: 'bg-blue-50' },
          { icon: DollarSign,    label: 'Total Credit',      value: formatCurrency(totalCredit),  color: 'text-green-600', bg: 'bg-green-50' },
          { icon: BarChart2,     label: 'Credit Mode',       value: creditMode === 'percent' ? `${numericValue || 0}%` : `$${numericValue || 0}`, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { icon: Target,        label: 'Target Group',      value: TARGET_OPTIONS.find(o => o.value === targetGroup)?.label ?? '—', color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <Card key={label} className="!p-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-slate-400">{label}</p>
                <p className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left panel: Controls ── */}
        <div className="space-y-4">
          {/* Target group */}
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" /> Target Group
            </h3>
            <Select
              value={targetGroup}
              onChange={(e) => setTargetGroup(e.target.value as TargetGroup)}
              options={TARGET_OPTIONS}
            />
            <AnimatePresence>
              {targetGroup === 'specific' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 overflow-hidden"
                >
                  <Input
                    placeholder="Search by email…"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    leftIcon={<Search className="w-4 h-4" />}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </Card>

          {/* Credit config */}
          <Card>
            <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" /> Credit Amount
            </h3>
            <div className="space-y-3">
              <Select
                value={creditMode}
                onChange={(e) => setCreditMode(e.target.value as CreditMode)}
                options={MODE_OPTIONS}
              />
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder={creditMode === 'percent' ? 'e.g. 5.0' : 'e.g. 250.00'}
                value={creditValue}
                onChange={(e) => setCreditValue(e.target.value)}
                leftIcon={
                  <span className="text-slate-400 text-xs font-bold">
                    {creditMode === 'percent' ? '%' : '$'}
                  </span>
                }
              />
              {numericValue > 20 && creditMode === 'percent' && (
                <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg p-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  High percentage — verify before applying
                </div>
              )}
            </div>
          </Card>

          {/* Note */}
          <Card>
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400" /> Transaction Note
            </h3>
            <textarea
              rows={3}
              placeholder="Optional note saved on each transaction…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 text-slate-700 placeholder:text-slate-300"
            />
          </Card>

          {/* Apply button */}
          <Button
            onClick={applyProfit}
            disabled={applying || numericValue <= 0 || !preview.length}
            className="w-full"
            size="lg"
          >
            {applying ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Applying… {progress}%
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Apply to {preview.length} Account{preview.length !== 1 ? 's' : ''}
              </span>
            )}
          </Button>

          {/* Progress bar */}
          <AnimatePresence>
            {applying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full bg-slate-100 rounded-full h-2 overflow-hidden"
              >
                <motion.div
                  className="h-full bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right panel: AI recommendations + preview ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* AI recommendations */}
          <Card>
            <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" /> AI Recommendations
            </h3>
            <p className="text-xs text-slate-400 mb-4">Click a suggestion to auto-fill the credit value</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AI_RECOMMENDATIONS.map((r) => (
                <button
                  key={r.label}
                  onClick={() => { setCreditMode('percent'); setCreditValue(r.pct.toString()) }}
                  className={`text-left rounded-xl border px-3.5 py-3 transition-all hover:shadow-sm ${TIER_COLORS[r.tier]} ${
                    creditMode === 'percent' && parseFloat(creditValue) === r.pct
                      ? 'ring-2 ring-offset-1 ring-current shadow-md'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">{r.label}</span>
                    <span className="text-base font-extrabold">{r.pct}%</span>
                  </div>
                  <p className="text-xs opacity-80 leading-snug">{r.description}</p>
                </button>
              ))}
            </div>
          </Card>

          {/* Preview table */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                Preview — {preview.length} user{preview.length !== 1 ? 's' : ''}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={loadPreview}
                disabled={loading}
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : preview.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Set a credit value to preview affected accounts</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['User', 'Role', 'Current Balance', 'Credit', 'New Balance'].map((h) => (
                        <th key={h} className="text-left pb-3 px-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {preview.slice(0, 50).map((u, i) => (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.015 }}
                        className="hover:bg-slate-50"
                      >
                        <td className="py-2.5 px-2">
                          <p className="font-medium text-slate-800 truncate max-w-[140px]">{u.full_name}</p>
                          <p className="text-xs text-slate-400 truncate max-w-[140px]">{u.email}</p>
                        </td>
                        <td className="py-2.5 px-2">
                          <Badge variant={u.role === 'copy_trader' ? 'info' : 'default'} size="sm">
                            {u.role === 'copy_trader' ? 'Trader' : 'Investor'}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-2 text-slate-600 font-mono text-xs">
                          {formatCurrency(u.balance_usdt)}
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="text-green-600 font-semibold font-mono text-xs flex items-center gap-0.5">
                            <ArrowUpRight className="w-3 h-3" />
                            {formatCurrency(u.credit)}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 font-semibold text-slate-900 font-mono text-xs">
                          {formatCurrency(u.newBalance)}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 50 && (
                  <p className="text-center text-xs text-slate-400 pt-3">
                    Showing 50 of {preview.length} — all will be credited on apply
                  </p>
                )}

                {/* Totals row */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
                  <span className="text-slate-500">{preview.length} accounts selected</span>
                  <span className="font-bold text-slate-900">
                    Total credit: <span className="text-green-600">{formatCurrency(totalCredit)}</span>
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* Done summary */}
          <AnimatePresence>
            {done && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card className="!border-green-200 bg-green-50">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-800">Profit distribution complete</p>
                      <p className="text-sm text-green-700 mt-0.5">
                        {formatCurrency(totalCredited)} credited across {applied} accounts.
                        Transactions and audit logs recorded.
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
