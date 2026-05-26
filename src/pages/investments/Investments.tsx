import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Clock, TrendingUp, CheckCircle, Plus, Calendar, Zap, AlertTriangle, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatCurrency, getStatusColor } from '@/lib/utils'
import type { InvestmentPlan, Investment } from '@/types/database'
import { differenceInDays, format, addDays } from 'date-fns'
import toast from 'react-hot-toast'

// Deterministic slot data derived from plan index so it never changes on re-render
const SLOT_DATA = [
  { total: 100, used: 43 },
  { total: 80, used: 71 },
  { total: 50, used: 46 },
  { total: 200, used: 88 },
]

function getSlotData(index: number) {
  const d = SLOT_DATA[index % SLOT_DATA.length]
  return { total: d.total, used: d.used, remaining: d.total - d.used }
}

export default function Investments() {
  const { profile } = useAuth()
  const [plans, setPlans] = useState<InvestmentPlan[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<InvestmentPlan | null>(null)
  const [amount, setAmount] = useState('')
  const [investing, setInvesting] = useState(false)
  const [tab, setTab] = useState<'plans' | 'mine'>('plans')
  const [walletBalance, setWalletBalance] = useState<number>(0)

  const fetchData = async () => {
    if (!profile) return
    const [p, inv, wallet] = await Promise.all([
      supabase.from('investment_plans').select('*').eq('is_active', true).order('roi_percentage'),
      supabase.from('investments').select('*, investment_plans(*)').eq('user_id', profile.id).order('started_at', { ascending: false }),
      supabase.from('wallets').select('balance_usdt').eq('user_id', profile.id).maybeSingle(),
    ])
    if (p.data) setPlans(p.data)
    if (inv.data) setInvestments(inv.data)
    if (wallet.data) setWalletBalance(wallet.data.balance_usdt ?? 0)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [profile])

  const handleInvest = async () => {
    if (!selected || !profile || !amount) return
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt < selected.min_amount || amt > selected.max_amount) {
      toast.error(`Amount must be between ${formatCurrency(selected.min_amount)} and ${formatCurrency(selected.max_amount)}`)
      return
    }
    if (amt > walletBalance) {
      toast.error(`Insufficient balance. You have ${formatCurrency(walletBalance)} available.`)
      return
    }
    setInvesting(true)
    try {
      const now = new Date()
      const maturity = addDays(now, selected.period_days)
      const expected = amt * (1 + selected.roi_percentage / 100)
      const { error } = await supabase.from('investments').insert({
        user_id: profile.id,
        plan_id: selected.id,
        amount: amt,
        expected_return: expected,
        actual_return: 0,
        status: 'active',
        started_at: now.toISOString(),
        maturity_at: maturity.toISOString(),
      })
      if (error) throw error
      toast.success(`Investment of ${formatCurrency(amt)} started in ${selected.name}!`)
      setSelected(null)
      setAmount('')
      fetchData()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setInvesting(false)
    }
  }

  const riskVariant = (r: string): 'success' | 'warning' | 'danger' =>
    r === 'low' ? 'success' : r === 'medium' ? 'warning' : 'danger'

  const investAmt = parseFloat(amount || '0')
  const expectedReturn = selected ? investAmt * (1 + selected.roi_percentage / 100) : 0
  const expectedProfit = expectedReturn - investAmt
  const maturityDate = selected ? addDays(new Date(), selected.period_days) : null
  const insufficientBalance = investAmt > 0 && investAmt > walletBalance

  const planColors = [
    'from-blue-500 to-cyan-500',
    'from-[#1E40AF] to-[#3B82F6]',
    'from-violet-500 to-purple-600',
    'from-amber-500 to-orange-500',
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Investment Plans</h1>
        <p className="text-slate-500 text-sm mt-1">Choose a plan and grow your capital with fixed returns.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[{ key: 'plans', label: 'Available Plans' }, { key: 'mine', label: 'My Investments' }].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as 'plans' | 'mine')}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key ? 'bg-white text-[#1E40AF] shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            {t.key === 'mine' && investments.length > 0 && (
              <span className="ml-1.5 bg-[#1E40AF] text-white text-xs px-1.5 py-0.5 rounded-full">{investments.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Plans tab ── */}
      {tab === 'plans' && (
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan, i) => {
              const slots = getSlotData(i)
              const slotPct = (slots.used / slots.total) * 100
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card hover className="flex flex-col gap-4 h-full relative overflow-hidden">
                    {/* Gradient top accent */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${planColors[i % planColors.length]}`} />

                    <div className="flex items-start justify-between pt-1">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{plan.name}</h3>
                        <p className="text-slate-500 text-xs mt-0.5">{plan.period_days}-day lock period</p>
                      </div>
                      <Badge variant={riskVariant(plan.risk_level)} size="sm" className="capitalize">
                        {plan.risk_level}
                      </Badge>
                    </div>

                    {/* ROI display */}
                    <div className={`text-center py-5 bg-gradient-to-br from-[#DBEAFE] to-blue-50 rounded-xl relative overflow-hidden`}>
                      <div className={`absolute inset-0 bg-gradient-to-br ${planColors[i % planColors.length]} opacity-5`} />
                      <p className="text-5xl font-black text-[#1E40AF]">{plan.roi_percentage}%</p>
                      <p className="text-slate-500 text-xs mt-1">returns in {plan.period_days} days</p>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">{plan.description}</p>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 flex items-center gap-1.5 text-xs"><TrendingUp className="w-3 h-3" /> Min</span>
                        <span className="font-semibold text-xs">{formatCurrency(plan.min_amount)}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 flex items-center gap-1.5 text-xs"><BarChart3 className="w-3 h-3" /> Max</span>
                        <span className="font-semibold text-xs">{formatCurrency(plan.max_amount)}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-slate-500 flex items-center gap-1.5 text-xs"><Clock className="w-3 h-3" /> Duration</span>
                        <span className="font-semibold text-xs">{plan.period_days} Days</span>
                      </div>
                    </div>

                    {/* Slots progress */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-slate-500">Capacity</span>
                        <span className={`font-medium ${slots.remaining <= 10 ? 'text-red-500' : 'text-slate-700'}`}>
                          {slots.remaining} of {slots.total} slots left
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${
                            slotPct > 85 ? 'from-red-400 to-red-500' :
                            slotPct > 60 ? 'from-amber-400 to-orange-500' :
                            'from-[#1E40AF] to-[#3B82F6]'
                          } transition-all duration-500`}
                          style={{ width: `${slotPct}%` }}
                        />
                      </div>
                    </div>

                    <Button
                      onClick={() => { setSelected(plan); setAmount('') }}
                      className="w-full mt-auto"
                      disabled={slots.remaining === 0}
                    >
                      <Plus className="w-4 h-4" />
                      {slots.remaining === 0 ? 'Fully Subscribed' : 'Invest Now'}
                    </Button>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )
      )}

      {/* ── My Investments tab ── */}
      {tab === 'mine' && (
        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
          ) : investments.length === 0 ? (
            <Card className="text-center py-14">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-7 h-7 text-slate-400" />
              </div>
              <p className="font-medium text-slate-700 mb-1">No investments yet</p>
              <p className="text-slate-400 text-sm mb-4">Browse available plans to start growing your capital.</p>
              <Button onClick={() => setTab('plans')} size="sm">Browse Plans</Button>
            </Card>
          ) : (
            investments.map((inv, i) => {
              const daysLeft = differenceInDays(new Date(inv.maturity_at), new Date())
              const daysTotal = (inv.investment_plans as any)?.period_days ?? 30
              const progress = Math.min(100, Math.max(0, 100 - (daysLeft / daysTotal) * 100))
              return (
                <motion.div key={inv.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
                  <Card>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{(inv.investment_plans as any)?.name ?? 'Plan'}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Started {format(new Date(inv.started_at), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <span className={`ml-auto text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(inv.status)}`}>
                            {inv.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                          <div className="bg-slate-50 rounded-xl p-2.5">
                            <p className="text-slate-400 text-xs">Invested</p>
                            <p className="font-bold text-slate-900 mt-0.5">{formatCurrency(inv.amount)}</p>
                          </div>
                          <div className="bg-green-50 rounded-xl p-2.5">
                            <p className="text-slate-400 text-xs">Expected Return</p>
                            <p className="font-bold text-green-600 mt-0.5">{formatCurrency(inv.expected_return)}</p>
                          </div>
                          <div className="bg-blue-50 rounded-xl p-2.5">
                            <p className="text-slate-400 text-xs">Matures</p>
                            <p className="font-bold text-blue-700 mt-0.5">{format(new Date(inv.maturity_at), 'MMM d')}</p>
                          </div>
                        </div>

                        {inv.status === 'active' && (
                          <div>
                            <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                              <span>Progress</span>
                              <span className="font-medium">
                                {daysLeft > 0 ? `${daysLeft} days remaining` : '🎉 Matured!'}
                              </span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="sm:w-28 flex flex-col justify-between items-end gap-1">
                        <div className="text-right">
                          <p className="text-3xl font-black text-[#1E40AF]">{(inv.investment_plans as any)?.roi_percentage ?? 0}%</p>
                          <p className="text-xs text-slate-400">ROI</p>
                        </div>
                        <p className="text-xs text-slate-400 text-right">
                          +{formatCurrency(inv.expected_return - inv.amount)} profit
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )
            })
          )}
        </div>
      )}

      {/* ── Invest Modal ── */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={`Invest in ${selected?.name}`}>
        {selected && (
          <div className="space-y-4">
            {/* ROI banner */}
            <div className="bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] rounded-2xl p-5 text-center text-white">
              <p className="text-5xl font-black">{selected.roi_percentage}%</p>
              <p className="text-blue-100 text-sm mt-1">fixed ROI in {selected.period_days} days</p>
            </div>

            {/* Plan details */}
            <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 rounded-xl p-4">
              <div>
                <p className="text-slate-400 text-xs">Minimum</p>
                <p className="font-bold text-slate-900">{formatCurrency(selected.min_amount)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Maximum</p>
                <p className="font-bold text-slate-900">{formatCurrency(selected.max_amount)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Duration</p>
                <p className="font-bold text-slate-900">{selected.period_days} days</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Risk Level</p>
                <p className="font-bold text-slate-900 capitalize">{selected.risk_level}</p>
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
              label={`Investment Amount (USDT) — Min. ${formatCurrency(selected.min_amount)}`}
              type="number"
              placeholder={formatCurrency(selected.min_amount)}
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
                    You need {formatCurrency(investAmt - walletBalance)} more.{' '}
                    <Link to="/wallet" className="underline font-medium" onClick={() => setSelected(null)}>
                      Deposit funds →
                    </Link>
                  </p>
                </div>
              </motion.div>
            )}

            {/* Live return calculator */}
            {investAmt > 0 && !insufficientBalance && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-2 text-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-green-600" />
                  <p className="font-semibold text-green-800">Return Calculator</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">You invest</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(investAmt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Expected profit</span>
                  <span className="font-bold text-green-600">+{formatCurrency(expectedProfit)}</span>
                </div>
                <div className="flex justify-between border-t border-green-200 pt-2">
                  <span className="font-semibold text-slate-700">Total at maturity</span>
                  <span className="font-black text-green-700 text-base">{formatCurrency(expectedReturn)}</span>
                </div>
                {maturityDate && (
                  <div className="flex items-center gap-1.5 text-xs text-green-600 pt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Matures on {format(maturityDate, 'MMMM d, yyyy')}
                  </div>
                )}
              </motion.div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setSelected(null)} className="flex-1">Cancel</Button>
              <Button
                onClick={handleInvest}
                loading={investing}
                disabled={!investAmt || investAmt < selected.min_amount || investAmt > selected.max_amount || insufficientBalance}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4" /> Confirm Investment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
