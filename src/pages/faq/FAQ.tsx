import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, HelpCircle, Search, MessageSquare } from 'lucide-react'
import { PublicNav } from '@/components/layout/PublicNav'
import { LandingFooter } from '@/pages/landing/LandingFooter'
import { Button } from '@/components/ui/Button'

const CATEGORIES = [
  {
    label: 'Getting Started',
    color: 'bg-blue-100 text-blue-700',
    questions: [
      { q: 'How do I create an account?', a: 'Click "Get Started" on the homepage, enter your name, email, and a secure password. You\'ll receive a verification email — click the link to activate your account and begin KYC.' },
      { q: 'Is KYC verification mandatory?', a: 'KYC is required before making withdrawals or investing more than $500. It typically takes 1–3 business hours. You\'ll need a government-issued photo ID and a selfie.' },
      { q: 'What countries are supported?', a: 'We serve investors in 60+ countries. Residents of the United States, Canada, and a small number of sanctioned countries are currently restricted due to regulatory requirements.' },
      { q: 'Is there a minimum investment?', a: 'Yes. The minimum investment starts at $100 for the Basic plan. Copy trading requires a minimum of $200 to follow a trader.' },
    ],
  },
  {
    label: 'Deposits & Withdrawals',
    color: 'bg-green-100 text-green-700',
    questions: [
      { q: 'Which cryptocurrencies can I deposit?', a: 'We accept USDT (TRC-20 and ERC-20), Bitcoin (BTC), and Ethereum (ETH). Each currency has its own wallet address — always verify you are sending to the correct network.' },
      { q: 'How long does a deposit take to reflect?', a: 'Deposits are credited after blockchain confirmation (usually 1–60 minutes). If your deposit hasn\'t appeared after 2 hours, contact support with your transaction hash.' },
      { q: 'How do I make a withdrawal?', a: 'Go to Wallet → Withdraw, enter the amount and your crypto address. A 6-digit verification code will be sent to your email. Enter it to confirm, and our team will process it within 24 hours.' },
      { q: 'Are there withdrawal fees?', a: 'There are no platform withdrawal fees. You are only responsible for the on-chain network fee, which is deducted from the amount you receive.' },
      { q: 'How long do withdrawals take?', a: 'Withdrawal requests are reviewed by our team within 24 hours on business days (Mon–Fri). Once approved, the on-chain transfer is typically completed within 30 minutes.' },
    ],
  },
  {
    label: 'Copy Trading',
    color: 'bg-purple-100 text-purple-700',
    questions: [
      { q: 'How does copy trading work?', a: 'You choose a verified trader from our roster and allocate funds to follow them. Every trade they execute is mirrored in your account proportionally. You earn their returns minus any performance fee.' },
      { q: 'Can I stop copying a trader at any time?', a: 'Yes. Go to Copy Trading → My Active Copies and click Stop next to any trader. Your allocated funds are returned to your wallet immediately.' },
      { q: 'What is a performance fee?', a: 'Traders charge a fee (typically 10–25%) on profits they generate for you. This is deducted automatically and only applies when you\'re in profit.' },
      { q: 'How are copy traders verified?', a: 'Every trader on our platform undergoes a strict review: minimum 6 months of audited trading history, identity verification, and ongoing monthly performance audits.' },
      { q: 'What happens if a trader loses money?', a: 'Losses are shared proportionally, just like gains. If your copied trader\'s account drops by 5%, your allocated copy budget drops by the same percentage. You can set a stop-loss limit in settings.' },
    ],
  },
  {
    label: 'Investment Plans',
    color: 'bg-amber-100 text-amber-700',
    questions: [
      { q: 'What investment plans are available?', a: 'We offer four plans: Basic (5% / 30 days), Standard (12% / 60 days), Premium (18% / 90 days), and VIP (25% / 180 days). Returns are paid daily and credited to your wallet.' },
      { q: 'Can I invest in multiple plans at once?', a: 'Yes. You can hold multiple active investment plans simultaneously, including different plans or multiple positions in the same plan.' },
      { q: 'Can I withdraw my investment early?', a: 'Early termination is available with a 3% penalty on the remaining principal. This option is available from the Investments tab in your dashboard.' },
      { q: 'Are returns guaranteed?', a: 'Investment returns are performance-based and not legally guaranteed. Our disclosed APY reflects historical averages. Past performance is not indicative of future results.' },
    ],
  },
  {
    label: 'Account & Security',
    color: 'bg-red-100 text-red-700',
    questions: [
      { q: 'How do I reset my password?', a: 'Click "Forgot Password" on the login page, enter your email, and you\'ll receive a secure reset link within a few minutes.' },
      { q: 'Is my account secure?', a: 'All accounts are protected with encrypted passwords and email-based withdrawal verification. We recommend using a unique, strong password and never sharing your login credentials.' },
      { q: 'What should I do if I suspect unauthorized access?', a: 'Contact support immediately at support@oakmontridgecapital.com. We can temporarily lock your account and initiate a security review within 1 hour.' },
      { q: 'Can I have multiple accounts?', a: 'No. Each person is permitted one account per verified identity. Duplicate accounts detected during KYC review will be closed and balances may be held pending investigation.' },
    ],
  },
  {
    label: 'Referral Program',
    color: 'bg-indigo-100 text-indigo-700',
    questions: [
      { q: 'How does the referral program work?', a: 'Share your unique referral link. When someone signs up and makes their first deposit, you earn a commission (typically 5% of their deposits for 90 days). Commissions are credited to your wallet automatically.' },
      { q: 'Is there a limit to how many people I can refer?', a: 'No limit. Refer as many people as you like and earn commissions on every qualifying referral indefinitely.' },
      { q: 'When are referral commissions paid?', a: 'Commissions are calculated in real time and credited to your wallet within 24 hours of each qualifying deposit by your referral.' },
    ],
  },
]

export default function FAQ() {
  const [search, setSearch] = useState('')
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const toggle = (key: string) => setOpenKey(prev => prev === key ? null : key)

  const filtered = CATEGORIES
    .filter(c => !activeCategory || c.label === activeCategory)
    .map(c => ({
      ...c,
      questions: search.trim()
        ? c.questions.filter(q =>
            q.q.toLowerCase().includes(search.toLowerCase()) ||
            q.a.toLowerCase().includes(search.toLowerCase())
          )
        : c.questions,
    }))
    .filter(c => c.questions.length > 0)

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1E40AF] to-[#1e3a8a] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-5">
              <HelpCircle className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Frequently Asked Questions</h1>
            <p className="text-blue-200 text-sm max-w-xl mx-auto mb-8">
              Find answers to the most common questions about our platform, investments, and account management.
            </p>
            {/* Search */}
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300" />
              <input
                type="text"
                placeholder="Search questions…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/15 border border-white/20 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder:text-blue-300 text-sm focus:outline-none focus:bg-white/25 transition-colors"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Link to="/" className="hover:text-[#1E40AF] transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600">FAQ</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-20">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar category filters */}
          <div className="lg:w-56 flex-shrink-0">
            <div className="sticky top-6">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Categories</p>
              <div className="space-y-1">
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${!activeCategory ? 'bg-[#1E40AF] text-white' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}
                >
                  All Questions
                </button>
                {CATEGORIES.map(c => (
                  <button
                    key={c.label}
                    onClick={() => setActiveCategory(prev => prev === c.label ? null : c.label)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${activeCategory === c.label ? 'bg-[#1E40AF] text-white' : 'text-slate-600 hover:bg-white hover:shadow-sm'}`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* FAQ list */}
          <div className="flex-1 space-y-8">
            {filtered.length === 0 ? (
              <div className="text-center py-16">
                <HelpCircle className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No questions match your search.</p>
                <button onClick={() => setSearch('')} className="text-[#1E40AF] text-sm hover:underline mt-2">Clear search</button>
              </div>
            ) : (
              filtered.map(category => (
                <div key={category.label}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${category.color}`}>{category.label}</span>
                    <span className="text-xs text-slate-400">{category.questions.length} question{category.questions.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-2">
                    {category.questions.map((item, qi) => {
                      const key = `${category.label}-${qi}`
                      const isOpen = openKey === key
                      return (
                        <div
                          key={key}
                          className={`bg-white rounded-2xl border transition-all ${isOpen ? 'border-blue-200 shadow-sm' : 'border-slate-100'}`}
                        >
                          <button
                            onClick={() => toggle(key)}
                            className="w-full flex items-center justify-between px-5 py-4 text-left"
                          >
                            <span className={`font-medium text-sm ${isOpen ? 'text-[#1E40AF]' : 'text-slate-900'}`}>{item.q}</span>
                            <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0 ml-3">
                              <ChevronDown className={`w-4 h-4 ${isOpen ? 'text-[#1E40AF]' : 'text-slate-400'}`} />
                            </motion.div>
                          </button>
                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                key="content"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <p className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                                  {item.a}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}

            {/* Still need help? */}
            <div className="bg-gradient-to-br from-[#1E40AF] to-[#1e3a8a] rounded-2xl p-8 text-center text-white mt-8">
              <MessageSquare className="w-8 h-8 text-blue-200 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2">Still have questions?</h3>
              <p className="text-blue-200 text-sm mb-5">
                Our support team is available Monday – Saturday, 9 AM – 8 PM UTC.
              </p>
              <Link to="/contact">
                <Button className="bg-white text-[#1E40AF] hover:bg-blue-50 font-bold" size="sm">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </div>
      <LandingFooter />
    </div>
  )
}
