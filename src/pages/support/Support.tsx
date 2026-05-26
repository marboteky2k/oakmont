import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import {
  MessageSquare, Mail, Clock, CheckCircle, ExternalLink,
  ChevronDown, Headphones, Shield, BookOpen
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

const quickLinks = [
  { icon: BookOpen, label: 'FAQ / Help Center', desc: 'Browse answers to common questions', href: '/#faq', color: 'bg-blue-100 text-blue-600' },
  { icon: Shield, label: 'KYC Verification', desc: 'Verify your identity to unlock all features', href: '/kyc', color: 'bg-green-100 text-green-600' },
  { icon: Mail, label: 'Email Support', desc: 'support@oakmontridgecapital.com', href: 'mailto:support@oakmontridgecapital.com', color: 'bg-purple-100 text-purple-600' },
]

const faqs = [
  { q: 'How long do withdrawals take?', a: 'Withdrawal requests are reviewed and processed within 24 hours on business days. Once approved, on-chain transaction time is typically 10–60 minutes.' },
  { q: 'My deposit is not showing — what should I do?', a: 'After submitting a deposit, our team reviews it within 1–4 hours. If it has been over 4 hours, contact support with your transaction hash (TX ID) and we will investigate.' },
  { q: 'Why was my KYC rejected?', a: 'Common reasons include blurry documents, expired IDs, or a mismatch between your document and submitted personal details. Re-submit with clear, valid, matching documents.' },
  { q: 'How is my withdrawal verified?', a: 'When you submit a withdrawal, we send a 6-digit code to your registered email address. Enter that code to confirm and your request is submitted for processing within 24 hours.' },
  { q: 'Can I stop copy trading at any time?', a: 'Yes. In the Copy Trading section, scroll to "My Active Copies" and click the Stop button next to any trader. Your allocated funds will be returned to your wallet balance.' },
]

export default function Support() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name || !email || !message) { toast.error('Fill in all required fields'); return }
    setSending(true)
    // Simulate API call — in production wire to Supabase Edge Function
    await new Promise(r => setTimeout(r, 1400))
    setSending(false)
    setSent(true)
    toast.success('Support ticket submitted! We\'ll respond within 24 hours.')
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Support Center</h1>
        <p className="text-slate-500 text-sm mt-1">Our team is here to help you 24/7. Expect a response within 24 hours.</p>
      </div>

      {/* Response time banner */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] rounded-2xl p-5 text-white">
        <Headphones className="w-8 h-8 text-blue-200 flex-shrink-0" />
        <div>
          <p className="font-bold">Live Support Available</p>
          <p className="text-blue-100 text-sm mt-0.5">Average response time: <strong>under 4 hours</strong> · Available Mon–Sat, 9 AM – 8 PM UTC</p>
        </div>
        <div className="ml-auto flex items-center gap-2 bg-white/20 rounded-xl px-3 py-1.5">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm font-medium">Online</span>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {quickLinks.map((link, i) => (
          <motion.a
            key={link.label}
            href={link.href}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-2xl hover:border-[#3B82F6] hover:shadow-md transition-all group"
          >
            <div className={`w-10 h-10 rounded-xl ${link.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
              <link.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 text-sm">{link.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{link.desc}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-[#3B82F6] flex-shrink-0 self-center transition-colors" />
          </motion.a>
        ))}
      </div>

      {/* Contact form */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Submit a Ticket</h3>
            <p className="text-xs text-slate-500">We'll reply to your registered email within 24 hours</p>
          </div>
        </div>

        {sent ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-xl font-bold text-slate-900 mb-2">Ticket Submitted!</p>
            <p className="text-slate-500 text-sm mb-5">
              Our support team will respond to <strong>{email}</strong> within 24 hours.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              Typical response: 2–8 hours on business days
            </div>
            <Button className="mt-6" onClick={() => setSent(false)} variant="outline" size="sm">Submit Another Ticket</Button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Full Name *" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
              <Input label="Email Address *" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#3B82F6] transition-colors"
              >
                <option value="">Select a topic...</option>
                <option value="deposit">Deposit Issue</option>
                <option value="withdrawal">Withdrawal Issue</option>
                <option value="kyc">KYC Verification</option>
                <option value="copy-trading">Copy Trading</option>
                <option value="investments">Investment Plans</option>
                <option value="account">Account & Security</option>
                <option value="referral">Referral Program</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Message *</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe your issue in detail — include transaction IDs, amounts, and any error messages..."
                rows={5}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 resize-none focus:outline-none focus:border-[#3B82F6] placeholder:text-slate-400 transition-colors"
              />
            </div>
            <Button type="submit" loading={sending} className="w-full" size="lg">
              <MessageSquare className="w-4 h-4" /> Submit Support Ticket
            </Button>
          </form>
        )}
      </Card>

      {/* Quick FAQ */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-4">Common Questions</h3>
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className={`border rounded-xl overflow-hidden transition-colors ${openFaq === i ? 'border-blue-200' : 'border-slate-200'}`}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${openFaq === i ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
              >
                <span className={`font-medium text-sm ${openFaq === i ? 'text-[#1E40AF]' : 'text-slate-900'}`}>{faq.q}</span>
                <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className={`w-4 h-4 flex-shrink-0 ml-3 ${openFaq === i ? 'text-[#1E40AF]' : 'text-slate-400'}`} />
                </motion.div>
              </button>
              {openFaq === i && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}>
                  <p className="px-4 pb-4 pt-2 text-sm text-slate-600 leading-relaxed border-t border-slate-100">{faq.a}</p>
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
