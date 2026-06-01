import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Shield, TrendingUp, Users, Globe, Award, ChevronRight,
  CheckCircle, BarChart3, Lock, Zap, Star,
} from 'lucide-react'
import { PublicNav } from '@/components/layout/PublicNav'
import { LandingFooter } from '@/pages/landing/LandingFooter'
import { Button } from '@/components/ui/Button'

const STATS = [
  { label: 'Active Investors', value: '14,800+', icon: Users, color: 'text-blue-600 bg-blue-50' },
  { label: 'Total Volume Traded', value: '$890M+', icon: BarChart3, color: 'text-green-600 bg-green-50' },
  { label: 'Countries Served', value: '60+', icon: Globe, color: 'text-purple-600 bg-purple-50' },
  { label: 'Avg. Annual Return', value: '18.4%', icon: TrendingUp, color: 'text-amber-600 bg-amber-50' },
]

const VALUES = [
  {
    icon: Shield,
    title: 'Trust & Security',
    desc: 'All client funds are held in segregated accounts. We use bank-grade encryption and multi-signature cold storage for all crypto assets.',
    color: 'bg-blue-50 text-[#1E40AF]',
  },
  {
    icon: TrendingUp,
    title: 'Consistent Performance',
    desc: 'Our verified traders are held to strict performance standards. Every signal, trade, and result is audited and transparently published.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: Zap,
    title: 'Cutting-Edge Technology',
    desc: 'Built on real-time market infrastructure, our platform processes signals in milliseconds and executes copy trades instantly.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: Users,
    title: 'Investor-First Culture',
    desc: 'Our support team is available 6 days a week. We measure success by our investors\' returns, not our own fees.',
    color: 'bg-purple-50 text-purple-600',
  },
]

const TEAM = [
  { name: 'James Hartley', role: 'Chief Executive Officer', years: '22 years in institutional trading', initials: 'JH', color: 'bg-blue-600' },
  { name: 'Sophia Adeyemi', role: 'Chief Investment Officer', years: 'Ex-Goldman Sachs, 18 years', initials: 'SA', color: 'bg-indigo-600' },
  { name: 'Marcus Liu', role: 'Head of Technology', years: 'Former Coinbase infrastructure lead', initials: 'ML', color: 'bg-violet-600' },
  { name: 'Elena Vasquez', role: 'Head of Risk Management', years: '15 years quantitative finance', initials: 'EV', color: 'bg-purple-600' },
  { name: 'David Okafor', role: 'Head of Compliance', years: 'Former SEC regulatory advisor', initials: 'DO', color: 'bg-blue-700' },
  { name: 'Priya Nair', role: 'Lead Copy Trader Analyst', years: 'Certified FRM, 12 years trading', initials: 'PN', color: 'bg-cyan-600' },
]

const MILESTONES = [
  { year: '2018', title: 'Founded', desc: 'Oakmont Ridge Capital launched with a team of institutional traders and a vision to democratise professional investment.' },
  { year: '2019', title: '$10M AUM', desc: 'Reached $10 million in assets under management within the first 12 months of operation.' },
  { year: '2020', title: 'Copy Trading Launch', desc: 'Launched our flagship copy trading platform, enabling retail investors to mirror our expert traders in real time.' },
  { year: '2021', title: 'Global Expansion', desc: 'Expanded to 40+ countries, adding multi-currency wallet support and localised compliance frameworks.' },
  { year: '2022', title: '$500M Traded', desc: 'Surpassed $500 million in cumulative traded volume across Forex, crypto, and commodities.' },
  { year: '2024', title: '$890M+ & Growing', desc: 'Now serving 14,800+ investors globally with industry-leading average returns and zero security incidents.' },
]

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <PublicNav />

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0f172a] via-[#1E40AF] to-[#1e3a8a] text-white py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border border-white/30"
              style={{
                width: `${(i + 1) * 180}px`,
                height: `${(i + 1) * 180}px`,
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          ))}
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-blue-200 text-sm font-medium mb-6">
              <Award className="w-4 h-4" /> Institutional-Grade Investment Since 2018
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold mb-5 leading-tight">
              Built by Traders.<br />Trusted by Investors.
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto leading-relaxed">
              Oakmont Ridge Capital was founded with one mission: give every investor — regardless of background
              or capital — access to the same tools and strategies used by the world's top trading firms.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Link to="/" className="hover:text-[#1E40AF] transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600">About Us</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-24 space-y-24">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
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

        {/* Mission */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-[#3B82F6] font-semibold text-sm uppercase tracking-wider mb-3">Our Mission</p>
            <h2 className="text-3xl font-bold text-slate-900 mb-5 leading-tight">
              Democratising access to professional-grade financial markets
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              For decades, institutional-grade investment strategies were locked behind minimum investments of
              $1 million or more. We changed that. At Oakmont Ridge Capital, you can start with $100 and access
              the same diversified, risk-managed portfolios that power the world's largest hedge funds.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              We combine verified human traders with data-driven algorithms to deliver consistent returns
              across Forex, crypto, and commodities — in any market condition.
            </p>
            <div className="space-y-2">
              {['Fully regulated and compliant operations', 'Transparent performance history for every trader', 'Real-time portfolio management tools'].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-700 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-[#1E40AF] to-[#1e3a8a] rounded-3xl p-8 text-white"
          >
            <Lock className="w-8 h-8 text-blue-200 mb-4" />
            <h3 className="text-xl font-bold mb-3">Why investors trust us</h3>
            <div className="space-y-4">
              {[
                { label: 'Segregated fund custody', sub: 'Your capital is never commingled with firm assets' },
                { label: 'Daily profit reporting', sub: 'Track every cent earned in real time' },
                { label: '2-factor authentication', sub: 'Industry standard account security on all accounts' },
                { label: 'Email withdrawal verification', sub: 'Every withdrawal requires your explicit approval' },
              ].map(item => (
                <div key={item.label} className="flex gap-3">
                  <Star className="w-4 h-4 text-blue-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">{item.label}</p>
                    <p className="text-blue-200 text-xs mt-0.5">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Core values */}
        <div>
          <div className="text-center mb-12">
            <p className="text-[#3B82F6] font-semibold text-sm uppercase tracking-wider mb-3">Our Values</p>
            <h2 className="text-3xl font-bold text-slate-900">The principles that guide everything we do</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
              >
                <div className={`w-12 h-12 rounded-2xl ${v.color} flex items-center justify-center mb-4`}>
                  <v.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{v.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <div className="text-center mb-12">
            <p className="text-[#3B82F6] font-semibold text-sm uppercase tracking-wider mb-3">Our Journey</p>
            <h2 className="text-3xl font-bold text-slate-900">Key milestones since 2018</h2>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 -translate-x-px top-0 bottom-0 w-0.5 bg-slate-200 hidden lg:block" />
            <div className="space-y-8">
              {MILESTONES.map((m, i) => (
                <motion.div
                  key={m.year}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className={`flex flex-col lg:flex-row gap-6 items-start lg:items-center ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
                >
                  <div className={`flex-1 ${i % 2 === 0 ? 'lg:text-right' : 'lg:text-left'}`}>
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 inline-block w-full lg:max-w-sm">
                      <p className="text-[#1E40AF] font-black text-lg">{m.year}</p>
                      <p className="font-bold text-slate-900 mb-1">{m.title}</p>
                      <p className="text-sm text-slate-500 leading-relaxed">{m.desc}</p>
                    </div>
                  </div>
                  <div className="hidden lg:flex w-8 h-8 rounded-full bg-[#1E40AF] text-white items-center justify-center font-bold text-sm flex-shrink-0 z-10 shadow-lg">
                    {i + 1}
                  </div>
                  <div className="flex-1" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Leadership */}
        <div>
          <div className="text-center mb-12">
            <p className="text-[#3B82F6] font-semibold text-sm uppercase tracking-wider mb-3">Leadership</p>
            <h2 className="text-3xl font-bold text-slate-900">The team behind the platform</h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              Our leadership brings over 100 years of combined experience from the world's top financial institutions.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEAM.map((member, i) => (
              <motion.div
                key={member.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-start gap-4"
              >
                <div className={`w-12 h-12 rounded-2xl ${member.color} text-white flex items-center justify-center font-bold text-lg flex-shrink-0`}>
                  {member.initials}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{member.name}</p>
                  <p className="text-sm text-[#1E40AF] font-medium">{member.role}</p>
                  <p className="text-xs text-slate-400 mt-1">{member.years}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-[#1E40AF] to-[#1e3a8a] rounded-3xl p-12 text-center text-white"
        >
          <h2 className="text-3xl font-bold mb-4">Ready to invest with the best?</h2>
          <p className="text-blue-200 mb-8 max-w-xl mx-auto">
            Join 14,800+ investors who trust Oakmont Ridge Capital to grow their wealth
            through professional, transparent, and secure investment strategies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button className="bg-white text-[#1E40AF] hover:bg-blue-50 font-bold px-8" size="lg">
                Start Investing Today
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8" size="lg">
                Talk to an Advisor
              </Button>
            </Link>
          </div>
        </motion.div>

      </div>
      <LandingFooter />
    </div>
  )
}
