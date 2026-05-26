import { motion } from 'framer-motion'
import { UserPlus, Wallet, TrendingUp, ArrowRight } from 'lucide-react'

const steps = [
  {
    icon: UserPlus,
    color: 'bg-blue-100 text-[#1E40AF]',
    label: 'Step 1',
    title: 'Create Account & Verify',
    desc: 'Sign up with your email or Google. Complete KYC verification to unlock all features. The entire process takes less than 5 minutes.',
  },
  {
    icon: Wallet,
    color: 'bg-indigo-100 text-indigo-600',
    label: 'Step 2',
    title: 'Fund Your Wallet with Crypto',
    desc: 'Deposit USDT, BTC, or ETH to your personal wallet address. Funds are credited automatically after blockchain confirmation.',
  },
  {
    icon: TrendingUp,
    color: 'bg-green-100 text-green-600',
    label: 'Step 3',
    title: 'Copy a Trader & Earn',
    desc: 'Browse our verified trader roster, review their full performance history, and start copying with one click. Profits credited automatically.',
  },
]

export function HowItWorks() {
  return (
    <section id="about" className="py-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-[#3B82F6] font-semibold text-sm uppercase tracking-wider mb-3">How It Works</p>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Get started in 3 simple steps</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            From registration to earning — our streamlined onboarding gets you investing in minutes.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-0 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <div key={step.title} className="flex flex-col lg:flex-row items-center w-full lg:w-auto">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -6 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 w-full lg:w-72 flex flex-col items-center text-center group transition-shadow duration-300 hover:shadow-lg"
              >
                <div className="w-8 h-8 rounded-full bg-[#1E40AF] text-white text-xs font-bold flex items-center justify-center mb-4 shadow-md">
                  {i + 1}
                </div>
                <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="w-8 h-8" />
                </div>
                <p className="text-xs text-[#3B82F6] font-semibold uppercase tracking-wider mb-2">{step.label}</p>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>

              {i < steps.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 + 0.3 }}
                  className="flex-shrink-0 mx-6 my-4 lg:my-0"
                >
                  <ArrowRight className="w-6 h-6 text-slate-300 rotate-90 lg:rotate-0" />
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
