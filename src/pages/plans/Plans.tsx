import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Check, Zap, ChevronRight, Shield, Clock, TrendingUp, Star,
  ArrowRight, BarChart3, DollarSign, Users,
} from 'lucide-react'
import { PublicNav } from '@/components/layout/PublicNav'
import { LandingFooter } from '@/pages/landing/LandingFooter'
import { Button } from '@/components/ui/Button'

const PLANS = [
  {
    name: 'Basic',
    apy: '5%',
    period: '30 days',
    minAmount: '$100',
    maxAmount: '$999',
    risk: 'Low',
    riskColor: 'text-green-600 bg-green-50',
    color: 'border-slate-200',
    badge: null,
    perks: [
      'Daily profit payouts',
      'Cancel anytime (no lock-in)',
      'Email support',
      'Real-time portfolio tracking',
    ],
    notIncluded: ['Compounding option', 'Dedicated account manager', 'Priority withdrawals'],
  },
  {
    name: 'Standard',
    apy: '12%',
    period: '60 days',
    minAmount: '$1,000',
    maxAmount: '$9,999',
    risk: 'Medium',
    riskColor: 'text-amber-600 bg-amber-50',
    color: 'border-[#1E40AF] ring-2 ring-[#1E40AF]/20',
    badge: 'Most Popular',
    perks: [
      'Daily profit payouts',
      'Compounding option',
      'Priority email & chat support',
      'Real-time portfolio tracking',
      'Reinvestment automation',
    ],
    notIncluded: ['Dedicated account manager'],
  },
  {
    name: 'Premium',
    apy: '18%',
    period: '90 days',
    minAmount: '$10,000',
    maxAmount: '$49,999',
    risk: 'Medium',
    riskColor: 'text-amber-600 bg-amber-50',
    color: 'border-slate-200',
    badge: null,
    perks: [
      'Daily profit payouts',
      'Compounding + reinvest',
      'Dedicated account manager',
      'Priority withdrawals (12 hrs)',
      'Advanced analytics dashboard',
      'Monthly performance calls',
    ],
    notIncluded: [],
  },
  {
    name: 'VIP',
    apy: '25%',
    period: '180 days',
    minAmount: '$50,000',
    maxAmount: 'Unlimited',
    risk: 'High',
    riskColor: 'text-red-600 bg-red-50',
    color: 'border-slate-200',
    badge: 'Highest Returns',
    perks: [
      'Daily profit payouts',
      'Full compounding & reinvest',
      'Senior dedicated manager',
      'Priority withdrawals (6 hrs)',
      'Exclusive trade signals',
      'Weekly strategy calls',
      'Early access to new features',
    ],
    notIncluded: [],
  },
]

const FAQS = [
  { q: 'Are returns guaranteed?', a: 'Investment returns are performance-based and reflect our historical averages. They are not legally guaranteed. Past performance is not indicative of future results.' },
  { q: 'Can I upgrade my plan?', a: 'Yes, you can start a new plan at any time. Each plan runs independently, so you can hold multiple active plans simultaneously.' },
  { q: 'When are profits paid?', a: 'Profits are calculated and credited to your wallet daily at midnight UTC. You can withdraw or reinvest at any time.' },
  { q: 'What happens at the end of the plan period?', a: 'Your principal is returned to your wallet automatically when the plan matures. You can choose to reinvest or withdraw.' },
  { q: 'Can I exit a plan early?', a: 'Yes. Early exit is available with a 3% penalty on remaining principal. This can be done from your Investments dashboard.' },
]

const COMPARE_ROWS = [
  { feature: 'Minimum investment', basic: '$100', standard: '$1,000', premium: '$10,000', vip: '$50,000' },
  { feature: 'APY (annual percentage yield)', basic: '5%', standard: '12%', premium: '18%', vip: '25%' },
  { feature: 'Plan duration', basic: '30 days', standard: '60 days', premium: '90 days', vip: '180 days' },
  { feature: 'Payout frequency', basic: 'Daily', standard: 'Daily', premium: 'Daily', vip: 'Daily' },
  { feature: 'Compounding option', basic: '✗', standard: '✓', premium: '✓', vip: '✓' },
  { feature: 'Account manager', basic: '✗', standard: '✗', premium: '✓', vip: '✓ (Senior)' },
  { feature: 'Priority withdrawals', basic: '✗', standard: '✗', premium: '12 hrs', vip: '6 hrs' },
  { feature: 'Exclusive trade signals', basic: '✗', standard: '✗', premium: '✗', vip: '✓' },
]

export default function Plans() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0f172a] via-[#1E40AF] to-[#1e3a8a] text-white py-20 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-blue-300 font-semibold text-sm uppercase tracking-wider mb-3">Investment Plans</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
            Choose the plan that fits your goals
          </h1>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto">
            From $100 starter investments to high-yield VIP portfolios — every plan is backed by our
            verified traders and real-time risk management.
          </p>
          <div className="flex flex-wrap justify-center gap-6 mt-10">
            {[
              { icon: Shield, label: 'Secure Fund Custody' },
              { icon: Clock, label: 'Daily Profit Payouts' },
              { icon: TrendingUp, label: 'Audited Performance' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 text-blue-200 text-sm">
                <item.icon className="w-4 h-4 text-blue-300" />
                {item.label}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Link to="/" className="hover:text-[#1E40AF] transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600">Investment Plans</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-24 space-y-20">

        {/* Plan cards */}
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`bg-white rounded-3xl border-2 ${plan.color} p-6 flex flex-col relative`}
            >
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full shadow-sm ${plan.badge === 'Most Popular' ? 'bg-[#1E40AF] text-white' : 'bg-amber-500 text-white'}`}>
                  {plan.badge}
                </div>
              )}

              <div className="mb-5">
                <p className="font-black text-2xl text-slate-900">{plan.name}</p>
                <div className="flex items-end gap-1 mt-2">
                  <p className="text-4xl font-black text-[#1E40AF]">{plan.apy}</p>
                  <p className="text-slate-400 text-sm mb-1">/ {plan.period}</p>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${plan.riskColor}`}>{plan.risk} Risk</span>
                  <span className="text-xs text-slate-400">{plan.minAmount} – {plan.maxAmount}</span>
                </div>
              </div>

              <div className="space-y-2 mb-6 flex-1">
                {plan.perks.map(perk => (
                  <div key={perk} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-700">{perk}</span>
                  </div>
                ))}
                {plan.notIncluded.map(item => (
                  <div key={item} className="flex items-start gap-2 opacity-40">
                    <span className="w-4 h-4 flex-shrink-0 text-center text-slate-400 text-xs font-bold mt-0.5">✗</span>
                    <span className="text-sm text-slate-400">{item}</span>
                  </div>
                ))}
              </div>

              <Link to="/register">
                <Button
                  className={`w-full ${plan.badge === 'Most Popular' ? '' : 'bg-slate-900 hover:bg-slate-800'}`}
                  size="sm"
                >
                  Get Started <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Users, label: 'Active Investors', value: '14,800+', color: 'text-blue-600 bg-blue-50' },
            { icon: DollarSign, label: 'Total Paid Out', value: '$215M+', color: 'text-green-600 bg-green-50' },
            { icon: BarChart3, label: 'Avg. Monthly Return', value: '4.2%', color: 'text-amber-600 bg-amber-50' },
            { icon: Star, label: 'Investor Rating', value: '4.9 / 5', color: 'text-purple-600 bg-purple-50' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center"
            >
              <div className={`w-11 h-11 rounded-2xl ${s.color} flex items-center justify-center mx-auto mb-3`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Comparison table */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Plan comparison</h2>
            <p className="text-slate-500 text-sm mt-2">A side-by-side breakdown of all plan features</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-500 w-1/3">Feature</th>
                    {PLANS.map(p => (
                      <th key={p.name} className="px-4 py-4 text-center text-sm font-bold text-slate-900 whitespace-nowrap">
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPARE_ROWS.map((row, i) => (
                    <tr key={row.feature} className={i % 2 === 0 ? 'bg-slate-50/50' : ''}>
                      <td className="px-6 py-3.5 text-sm text-slate-600">{row.feature}</td>
                      {[row.basic, row.standard, row.premium, row.vip].map((val, vi) => (
                        <td key={vi} className={`px-4 py-3.5 text-center text-sm font-medium ${val === '✓' || val.startsWith('✓') ? 'text-green-600' : val === '✗' ? 'text-slate-300' : 'text-slate-900'}`}>
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Common questions</h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {FAQS.map((item, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5">
                <p className="font-semibold text-slate-900 mb-2 text-sm">{item.q}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link to="/faq" className="text-[#1E40AF] text-sm hover:underline font-medium">
              View all FAQ →
            </Link>
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-[#1E40AF] to-[#1e3a8a] rounded-3xl p-12 text-center text-white"
        >
          <Zap className="w-10 h-10 text-blue-200 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-3">Start investing in minutes</h2>
          <p className="text-blue-200 mb-8 max-w-xl mx-auto">
            Create your free account, complete a quick KYC check, and make your first investment — all in under 10 minutes.
          </p>
          <Link to="/register">
            <Button className="bg-white text-[#1E40AF] hover:bg-blue-50 font-bold px-10" size="lg">
              Open Free Account
            </Button>
          </Link>
        </motion.div>

      </div>
      <LandingFooter />
    </div>
  )
}
