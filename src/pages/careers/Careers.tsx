import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Briefcase, MapPin, Clock, ArrowRight, ChevronRight,
  Globe, Zap, Shield, TrendingUp, Users, Heart, CheckCircle,
} from 'lucide-react'
import { PublicNav } from '@/components/layout/PublicNav'
import { LandingFooter } from '@/pages/landing/LandingFooter'
import { useCareersHeader } from '@/hooks/useCmsContent'

interface Job {
  id: number
  title: string
  department: string
  location: string
  type: string
  level: string
  description: string
}

const JOBS: Job[] = [
  {
    id: 1,
    title: 'Senior Full-Stack Engineer',
    department: 'Engineering',
    location: 'Remote (Global)',
    type: 'Full-time',
    level: 'Senior',
    description: 'Build and scale the core trading platform infrastructure using React, TypeScript, Node.js, and Supabase. You\'ll own critical user-facing features and work closely with product and design.',
  },
  {
    id: 2,
    title: 'Quantitative Analyst',
    department: 'Trading & Research',
    location: 'Remote (UTC±3)',
    type: 'Full-time',
    level: 'Mid–Senior',
    description: 'Develop and back-test systematic trading strategies for our professional trader network. Strong Python and statistical modelling skills required.',
  },
  {
    id: 3,
    title: 'Compliance & AML Officer',
    department: 'Legal & Compliance',
    location: 'Remote (EU)',
    type: 'Full-time',
    level: 'Senior',
    description: 'Own our KYC/AML programme, manage regulatory relationships, and ensure the platform meets the highest compliance standards across multiple jurisdictions.',
  },
  {
    id: 4,
    title: 'Product Designer (UI/UX)',
    department: 'Design',
    location: 'Remote (Global)',
    type: 'Full-time',
    level: 'Mid',
    description: 'Shape the visual identity and user experience of our trading platform. Proficiency in Figma, a passion for fintech, and an eye for detail are essential.',
  },
  {
    id: 5,
    title: 'Customer Success Manager',
    department: 'Support',
    location: 'Remote (UTC±5)',
    type: 'Full-time',
    level: 'Mid',
    description: 'Be the voice of our users. Manage onboarding, handle escalations, and work with the product team to resolve friction points that affect user satisfaction.',
  },
  {
    id: 6,
    title: 'Growth & Performance Marketer',
    department: 'Marketing',
    location: 'Remote (Global)',
    type: 'Full-time',
    level: 'Mid–Senior',
    description: 'Drive user acquisition across paid social, affiliate, and referral channels. Deep experience with CPA/CPL funnels and fintech compliance requirements strongly preferred.',
  },
  {
    id: 7,
    title: 'Blockchain Integration Engineer',
    department: 'Engineering',
    location: 'Remote (Global)',
    type: 'Full-time',
    level: 'Senior',
    description: 'Own our multi-chain wallet infrastructure and crypto payment processing pipeline. Experience with EVM chains, Solana, or Tron is a major plus.',
  },
  {
    id: 8,
    title: 'Data Engineer (Part-time / Contract)',
    department: 'Data',
    location: 'Remote (Global)',
    type: 'Part-time',
    level: 'Mid',
    description: 'Build and maintain data pipelines that power our analytics dashboards, trader performance metrics, and business intelligence reports.',
  },
]

const DEPARTMENTS = ['All', 'Engineering', 'Trading & Research', 'Legal & Compliance', 'Design', 'Support', 'Marketing', 'Data']

const PERKS = [
  { icon: Globe,     label: '100% Remote',         desc: 'Work from anywhere in the world with flexible hours.' },
  { icon: Zap,       label: 'Competitive Pay',      desc: 'Top-of-market salaries benchmarked quarterly.' },
  { icon: TrendingUp,label: 'Profit Sharing',       desc: 'Every team member shares in the company\'s success.' },
  { icon: Shield,    label: 'Full Benefits',         desc: 'Health insurance, pension top-up, and more.' },
  { icon: Heart,     label: 'Wellness Stipend',      desc: '$100/month toward gym, therapy, or wellness tools.' },
  { icon: Users,     label: 'L&D Budget',            desc: '$2,000/year for courses, conferences, and books.' },
]

const levelColor: Record<string, string> = {
  'Mid':        'bg-green-100 text-green-700',
  'Senior':     'bg-blue-100 text-blue-700',
  'Mid–Senior': 'bg-indigo-100 text-indigo-700',
}

const typeColor: Record<string, string> = {
  'Full-time':  'bg-slate-100 text-slate-700',
  'Part-time':  'bg-amber-100 text-amber-700',
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06 } }),
}

export default function Careers() {
  const [dept, setDept] = useState('All')
  const [expanded, setExpanded] = useState<number | null>(null)
  const cmsHeader = useCareersHeader()

  const filtered = JOBS.filter(j => dept === 'All' || j.department === dept)

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1E40AF] to-[#1e3a8a] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-5">
              <Briefcase className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">
              {cmsHeader.headline || 'Join Our Team'}
            </h1>
            <p className="text-blue-200 text-sm max-w-2xl mx-auto leading-relaxed">
              {cmsHeader.subheadline || "We're building the world's most trusted copy trading platform. If you're passionate about fintech, driven by impact, and thrive in a remote-first culture — we'd love to meet you."}
            </p>
            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-blue-100">
              <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-blue-300" /> {JOBS.length} open roles</span>
              <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-blue-300" /> 100% remote</span>
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-blue-300" /> 40+ team members</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Link to="/" className="hover:text-[#1E40AF] transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600">Careers</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-20 space-y-14">

        {/* Perks */}
        <div>
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xl font-bold text-slate-900 mb-6"
          >
            Why Oakmont Ridge?
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PERKS.map((perk, i) => (
              <motion.div
                key={perk.label}
                custom={i}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={fadeUp}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E40AF] flex items-center justify-center flex-shrink-0">
                  <perk.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{perk.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{perk.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Open roles */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-slate-900">Open Roles</h2>
            <div className="flex flex-wrap gap-2">
              {DEPARTMENTS.map(d => (
                <button
                  key={d}
                  onClick={() => setDept(d)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${
                    dept === d
                      ? 'bg-[#1E40AF] text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-[#3B82F6] hover:text-[#1E40AF]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
              <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No open roles in this department right now.</p>
              <p className="text-sm text-slate-400 mt-1">Check back soon or <Link to="/contact" className="text-[#1E40AF] hover:underline">send a speculative application</Link>.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((job, i) => (
                <motion.div
                  key={job.id}
                  custom={i}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => setExpanded(expanded === job.id ? null : job.id)}
                    className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-5 h-5 text-[#1E40AF]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm">{job.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">{job.department}</span>
                        <span className="text-slate-200 text-xs">·</span>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="w-3 h-3" /> {job.location}
                        </span>
                        <span className="text-slate-200 text-xs">·</span>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3" /> {job.type}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`hidden sm:block text-xs px-2.5 py-1 rounded-full font-medium ${levelColor[job.level] ?? 'bg-slate-100 text-slate-700'}`}>
                        {job.level}
                      </span>
                      <span className={`hidden sm:block text-xs px-2.5 py-1 rounded-full font-medium ${typeColor[job.type] ?? 'bg-slate-100 text-slate-700'}`}>
                        {job.type}
                      </span>
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expanded === job.id ? 'rotate-90' : ''}`} />
                    </div>
                  </button>

                  {expanded === job.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-100 px-5 py-5"
                    >
                      <p className="text-sm text-slate-600 leading-relaxed mb-5">{job.description}</p>
                      <div className="flex flex-wrap gap-3">
                        <Link
                          to="/contact"
                          state={{ jobTitle: job.title }}
                          className="flex items-center gap-2 bg-[#1E40AF] hover:bg-blue-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                        >
                          Apply Now <ArrowRight className="w-4 h-4" />
                        </Link>
                        <a
                          href={`mailto:careers@oakmontridgecapital.com?subject=Application: ${encodeURIComponent(job.title)}`}
                          className="flex items-center gap-2 border border-slate-200 text-slate-700 text-sm font-medium px-5 py-2.5 rounded-xl hover:border-[#3B82F6] hover:text-[#1E40AF] transition-colors"
                        >
                          Email Application
                        </a>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* No match CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-[#1E40AF] to-[#2563eb] rounded-3xl p-8 text-white text-center"
        >
          <Heart className="w-8 h-8 mx-auto mb-4 text-blue-200" />
          <h2 className="text-xl font-bold mb-2">Don't see the right role?</h2>
          <p className="text-blue-200 text-sm mb-6 max-w-md mx-auto">
            We're always interested in meeting exceptional people. Send us your CV and tell us
            how you'd like to contribute to the future of trading.
          </p>
          <a
            href={`mailto:${cmsHeader.email || 'careers@oakmontridgecapital.com'}`}
            className="inline-flex items-center gap-2 bg-white text-[#1E40AF] font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-blue-50 transition-colors"
          >
            Send Speculative Application <ArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </div>
      <LandingFooter />
    </div>
  )
}
