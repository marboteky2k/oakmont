import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Gift, Users, DollarSign, ArrowRight, ChevronRight,
  Link2, TrendingUp, CheckCircle, Star, Share2,
  BarChart3, Clock, Shield, Zap,
} from 'lucide-react'
import { PublicNav } from '@/components/layout/PublicNav'
import { LandingFooter } from '@/pages/landing/LandingFooter'
import { Button } from '@/components/ui/Button'

const TIERS = [
  {
    name: 'Starter',
    commission: '5%',
    minReferrals: 0,
    maxReferrals: 9,
    color: 'border-slate-200 bg-white',
    badge: null,
    perks: ['5% commission on deposits', 'Lifetime referral tracking', 'Basic dashboard access'],
  },
  {
    name: 'Silver',
    commission: '8%',
    minReferrals: 10,
    maxReferrals: 29,
    color: 'border-slate-300 bg-white',
    badge: null,
    perks: ['8% commission on deposits', 'Sub-affiliate 1% override', 'Priority payout processing'],
  },
  {
    name: 'Gold',
    commission: '10%',
    minReferrals: 30,
    maxReferrals: 99,
    color: 'border-[#1E40AF] ring-2 ring-[#1E40AF]/20 bg-white',
    badge: 'Most Popular',
    perks: ['10% commission on deposits', 'Sub-affiliate 2% override', '48-hour express payouts', 'Co-marketing support'],
  },
  {
    name: 'Elite',
    commission: '15%',
    minReferrals: 100,
    maxReferrals: null,
    color: 'border-amber-400 bg-gradient-to-b from-amber-50 to-white',
    badge: 'Highest Tier',
    perks: ['15% commission on deposits', 'Sub-affiliate 3% override', '24-hour express payouts', 'Dedicated affiliate manager', 'Custom landing pages', 'Revenue share on investments'],
  },
]

const HOW_IT_WORKS = [
  { step: '01', icon: Link2, title: 'Get Your Unique Link', desc: 'Sign up and navigate to the Referrals section. Your personal referral link is ready instantly — no approval needed.' },
  { step: '02', icon: Share2, title: 'Share With Your Network', desc: 'Post your link on social media, your website, email newsletters, or anywhere you connect with potential investors.' },
  { step: '03', icon: Users, title: 'Your Referrals Sign Up', desc: 'When someone creates an account using your link, they\'re permanently linked to you. You\'ll see them in your referral dashboard.' },
  { step: '04', icon: DollarSign, title: 'Earn Commissions', desc: 'Every time your referral makes a deposit, you earn a commission (5–15% depending on your tier) credited to your wallet automatically.' },
]

const TESTIMONIALS = [
  { name: 'Adaeze O.', country: 'Nigeria', earned: '$4,200', quote: 'I shared my link on my Telegram investment group and earned over $4,000 in my first 3 months. The commissions just keep coming.' },
  { name: 'Rafael M.', country: 'Brazil', earned: '$11,800', quote: 'I have a finance blog with 8,000 monthly readers. Oakmont\'s affiliate program is by far the highest-paying one I\'ve promoted.' },
  { name: 'Priya S.', country: 'India', earned: '$2,600', quote: 'I referred just 15 friends from my trading community and hit Silver tier. The sub-affiliate commissions were a great surprise.' },
]

const FAQS = [
  { q: 'When are commissions paid?', a: 'Commissions are calculated in real time when a referral makes a deposit and credited to your wallet within 24 hours.' },
  { q: 'Is there a limit to earnings?', a: 'No cap. The more you refer and the higher your tier, the more you earn. Elite affiliates regularly earn five-figure monthly commissions.' },
  { q: 'How long is the referral cookie active?', a: 'Referral tracking is permanent once someone signs up with your link. There is no expiry on the tracking — if they deposit 2 years later, you still earn.' },
  { q: 'Do I need to be an investor myself?', a: 'No. You can participate in the affiliate program without any investment. Simply refer others and earn commissions on their deposits.' },
  { q: 'What is a sub-affiliate commission?', a: 'If someone you referred becomes an affiliate and refers others, you earn a small override on commissions their referrals generate (1–3% depending on your tier).' },
]

export default function Affiliate() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0f172a] via-[#1E40AF] to-[#7c3aed] text-white py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white/5 blur-3xl"
              style={{ width: `${200 + i * 120}px`, height: `${200 + i * 120}px`, top: `${20 + i * 15}%`, left: `${60 + i * 8}%` }} />
          ))}
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-blue-200 text-sm font-medium mb-6">
              <Gift className="w-4 h-4" /> Earn up to 15% per referral
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-5">
              Turn your network<br />into passive income
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto mb-10">
              Join thousands of affiliates earning consistent commissions by referring investors to
              Oakmont Ridge Capital. No investment required. Unlimited earning potential.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button className="bg-white text-[#1E40AF] hover:bg-blue-50 font-bold px-10 text-base" size="lg">
                  Join the Programme <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-10 text-base" size="lg">
                  View My Referrals
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Link to="/" className="hover:text-[#1E40AF] transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600">Affiliate Programme</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-24 space-y-20">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Users, label: 'Active Affiliates', value: '3,200+', color: 'text-blue-600 bg-blue-50' },
            { icon: DollarSign, label: 'Total Commissions Paid', value: '$8.4M+', color: 'text-green-600 bg-green-50' },
            { icon: TrendingUp, label: 'Avg. Monthly Earning', value: '$2,100', color: 'text-purple-600 bg-purple-50' },
            { icon: Clock, label: 'Payout Time', value: '< 24 hrs', color: 'text-amber-600 bg-amber-50' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center"
            >
              <div className={`w-12 h-12 rounded-2xl ${s.color} flex items-center justify-center mx-auto mb-3`}>
                <s.icon className="w-6 h-6" />
              </div>
              <p className="text-2xl font-black text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* How it works */}
        <div>
          <div className="text-center mb-12">
            <p className="text-[#3B82F6] font-semibold text-sm uppercase tracking-wider mb-3">How It Works</p>
            <h2 className="text-3xl font-bold text-slate-900">Start earning in 4 simple steps</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-[#1E40AF] text-white flex items-center justify-center font-black text-lg mx-auto mb-4">
                  {step.step}
                </div>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1E40AF] flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Commission tiers */}
        <div>
          <div className="text-center mb-12">
            <p className="text-[#3B82F6] font-semibold text-sm uppercase tracking-wider mb-3">Commission Tiers</p>
            <h2 className="text-3xl font-bold text-slate-900">The more you refer, the more you earn</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">Tiers are based on your total number of active referrals. You automatically unlock the next tier when you hit the threshold.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TIERS.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-3xl border-2 ${tier.color} p-6 flex flex-col relative`}
              >
                {tier.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full shadow-sm whitespace-nowrap ${tier.badge === 'Most Popular' ? 'bg-[#1E40AF] text-white' : 'bg-amber-500 text-white'}`}>
                    {tier.badge}
                  </div>
                )}
                <p className="font-black text-xl text-slate-900 mb-2">{tier.name}</p>
                <div className="flex items-end gap-1 mb-1">
                  <p className="text-4xl font-black text-[#1E40AF]">{tier.commission}</p>
                  <p className="text-slate-400 text-sm mb-1">commission</p>
                </div>
                <p className="text-xs text-slate-400 mb-5">
                  {tier.maxReferrals
                    ? `${tier.minReferrals}–${tier.maxReferrals} referrals`
                    : `${tier.minReferrals}+ referrals`
                  }
                </p>
                <div className="space-y-2 flex-1">
                  {tier.perks.map(perk => (
                    <div key={perk} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">{perk}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Why join */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-[#3B82F6] font-semibold text-sm uppercase tracking-wider mb-3">Why Our Programme?</p>
            <h2 className="text-3xl font-bold text-slate-900 mb-5">The most rewarding affiliate programme in investment</h2>
            <div className="space-y-4">
              {[
                { icon: Shield, label: 'Trusted brand', sub: 'Refer confidently — your audience invests with a reputable, transparent platform.' },
                { icon: Zap, label: 'Instant credit', sub: 'Commissions appear in your wallet within 24 hours of every qualifying deposit.' },
                { icon: BarChart3, label: 'Full transparency', sub: 'Track every click, sign-up, and commission in real time from your dashboard.' },
                { icon: Star, label: 'Lifetime commissions', sub: 'Once someone signs up through your link, they\'re yours forever. No time limits.' },
              ].map(item => (
                <div key={item.label} className="flex gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1E40AF] flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{item.label}</p>
                    <p className="text-slate-500 text-sm">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1E40AF] to-[#7c3aed] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.country} · Earned {t.earned}</p>
                  </div>
                  <div className="ml-auto flex gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed italic">"{t.quote}"</p>
              </div>
            ))}
          </motion.div>
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
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-[#0f172a] via-[#1E40AF] to-[#7c3aed] rounded-3xl p-12 text-center text-white"
        >
          <Gift className="w-12 h-12 text-blue-200 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-3">Ready to start earning?</h2>
          <p className="text-blue-200 mb-8 max-w-lg mx-auto">
            Create your free account and get your unique referral link in under 2 minutes.
            No investment required. No hidden fees. Unlimited commissions.
          </p>
          <Link to="/register">
            <Button className="bg-white text-[#1E40AF] hover:bg-blue-50 font-bold px-10" size="lg">
              Join Free Today <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>

      </div>
      <LandingFooter />
    </div>
  )
}
