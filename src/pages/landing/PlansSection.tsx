import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, Zap, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const plans = [
  {
    name: 'Basic',
    apy: '5%',
    period: '30 days',
    minAmount: '$100',
    maxAmount: '$999',
    risk: 'Low',
    riskColor: 'bg-green-100 text-green-700',
    perks: ['Daily profit payouts', 'Cancel anytime', 'Email support'],
    accent: 'border-slate-200',
    popular: false,
  },
  {
    name: 'Standard',
    apy: '12%',
    period: '60 days',
    minAmount: '$1,000',
    maxAmount: '$9,999',
    risk: 'Medium',
    riskColor: 'bg-yellow-100 text-yellow-700',
    perks: ['Daily profit payouts', 'Compounding option', 'Priority support'],
    accent: 'border-[#3B82F6] ring-2 ring-[#3B82F6]/20',
    popular: true,
  },
  {
    name: 'Premium',
    apy: '18%',
    period: '90 days',
    minAmount: '$10,000',
    maxAmount: '$49,999',
    risk: 'Medium',
    riskColor: 'bg-yellow-100 text-yellow-700',
    perks: ['Daily profit payouts', 'Compounding + reinvest', 'Dedicated manager'],
    accent: 'border-slate-200',
    popular: false,
  },
  {
    name: 'VIP',
    apy: '25%',
    period: '180 days',
    minAmount: '$50,000',
    maxAmount: 'Unlimited',
    risk: 'High',
    riskColor: 'bg-red-100 text-red-700',
    perks: ['Daily profit payouts', 'Full compounding', 'Exclusive signals'],
    accent: 'border-slate-200',
    popular: false,
  },
]

export function PlansSection() {
  return (
    <section id="plans" className="py-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-[#3B82F6] font-semibold text-sm uppercase tracking-wider mb-3">Investment Plans</p>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Choose your growth path</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            Fixed-return investment plans with transparent APY, daily payouts, and zero hidden fees.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className={`relative bg-white rounded-2xl border-2 ${plan.accent} p-6 flex flex-col transition-shadow duration-300 hover:shadow-xl`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-[#1E40AF] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md whitespace-nowrap">
                  <Zap className="w-3 h-3" />
                  Most Popular
                </div>
              )}

              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-slate-900">{plan.name}</p>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${plan.riskColor}`}>
                    {plan.risk}
                  </span>
                </div>
                <p className="text-5xl font-black text-[#1E40AF] leading-none mb-1">{plan.apy}</p>
                <p className="text-slate-400 text-sm">APY over {plan.period}</p>
              </div>

              <div className="space-y-2 mb-6 pb-6 border-b border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Minimum</span>
                  <span className="font-semibold text-slate-900">{plan.minAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Maximum</span>
                  <span className="font-semibold text-slate-900">{plan.maxAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Duration</span>
                  <span className="font-semibold text-slate-900">{plan.period}</span>
                </div>
              </div>

              <div className="space-y-2.5 mb-6 flex-1">
                {plan.perks.map(perk => (
                  <div key={perk} className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {perk}
                  </div>
                ))}
              </div>

              <Link to="/register" className="block mt-auto">
                <Button
                  variant={plan.popular ? 'primary' : 'outline'}
                  className="w-full"
                  size="sm"
                >
                  Invest Now <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
