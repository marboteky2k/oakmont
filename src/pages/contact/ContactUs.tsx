import { useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Mail, MessageSquare, MapPin, Clock, Send,
  CheckCircle, ChevronRight, Share2, HelpCircle, Phone, Hash,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { invokeFunction } from '@/lib/functions'
import toast from 'react-hot-toast'
import { PublicNav } from '@/components/layout/PublicNav'
import { LandingFooter } from '@/pages/landing/LandingFooter'
import { useContactInfo } from '@/hooks/useCmsContent'

const DEFAULT_SUPPORT_EMAIL  = 'support@oakmontridgecapital.com'
const DEFAULT_BUSINESS_EMAIL = 'business@oakmontridgecapital.com'
const DEFAULT_ADDRESS = `447 Broadway, 2nd Floor\nNew York, NY 10013\nUnited States`
const DEFAULT_PHONE   = '+1 609 257 4786'

const TOPICS = [
  'Account & Verification (KYC)',
  'Deposits & Withdrawals',
  'Copy Trading',
  'Investment Plans',
  'Technical Issue',
  'Security Concern',
  'Partnership Inquiry',
  'Other',
]

// Info cards are now built dynamically in the component using CMS data

const FAQ_SNIPPETS = [
  { q: 'How long do withdrawals take?', a: 'Most withdrawals are processed within 1–3 business days after KYC approval.' },
  { q: 'Is my account KYC required?', a: 'Yes. Identity verification is mandatory before withdrawals and increasing deposit limits.' },
  { q: 'Can I pause a copy trade?', a: 'Yes. You can pause, resume, or stop any active copy trade from your Copy Trading dashboard.' },
  { q: 'What currencies are accepted?', a: 'We accept USDT (TRC-20 & ERC-20), Bitcoin (BTC), and Ethereum (ETH).' },
]

export default function ContactUs() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [topic, setTopic] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [ticketNumber, setTicketNumber] = useState('')
  const cmsContact = useContactInfo()

  const SUPPORT_EMAIL = cmsContact.email || DEFAULT_SUPPORT_EMAIL
  const BUSINESS_EMAIL = DEFAULT_BUSINESS_EMAIL

  const INFO_CARDS = [
    {
      icon: Mail,
      color: 'bg-blue-50 text-[#1E40AF]',
      label: 'Support Email',
      value: SUPPORT_EMAIL,
      sub: cmsContact.response_time ? `Response ${cmsContact.response_time}` : 'Response within 24 hours',
      href: `mailto:${SUPPORT_EMAIL}`,
    },
    {
      icon: Phone,
      color: 'bg-green-50 text-green-600',
      label: 'Phone',
      value: cmsContact.phone || DEFAULT_PHONE,
      sub: 'Mon–Fri, 9am–6pm UTC',
      href: `tel:${(cmsContact.phone || DEFAULT_PHONE).replace(/\s/g, '')}`,
    },
    {
      icon: MapPin,
      color: 'bg-purple-50 text-purple-600',
      label: 'Office',
      value: '447 Broadway, 2nd Floor',
      sub: 'New York, NY 10013, US',
      href: 'https://maps.google.com/?q=447+Broadway+New+York+NY+10013',
    },
    {
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
      label: 'Business Hours',
      value: cmsContact.hours?.split(',')[0] ?? 'Mon – Fri',
      sub: cmsContact.hours?.split(',').slice(1).join(',').trim() || '09:00 – 18:00 UTC',
      href: null,
    },
  ]

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Please enter your name'); return }
    if (!email.includes('@')) { toast.error('Please enter a valid email'); return }
    if (!topic) { toast.error('Please select a topic'); return }
    if (message.trim().length < 20) { toast.error('Message must be at least 20 characters'); return }

    setSending(true)
    try {
      const data = await invokeFunction<{ ticket_number?: string }>('send-support-ticket', {
        name: name.trim(), email: email.trim(), topic, message: message.trim(), source: 'contact',
      })
      setTicketNumber(data?.ticket_number ?? '')
      setSent(true)
      toast.success('Message sent! We\'ll get back to you shortly.')
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1E40AF] to-[#1e3a8a] text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-5">
              <Mail className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Contact Us</h1>
            <p className="text-blue-200 text-sm max-w-xl mx-auto">
              Our team is here to help. Reach out with any question about your account,
              trading, or technical issues — we typically respond within 24 hours.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Link to="/" className="hover:text-[#1E40AF] transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600">Contact Us</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-20 space-y-10">

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {INFO_CARDS.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              {card.href ? (
                <a
                  href={card.href}
                  className="block bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all group"
                >
                  <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-400 mb-0.5">{card.label}</p>
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-[#1E40AF] transition-colors">{card.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
                </a>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-slate-400 mb-0.5">{card.label}</p>
                  <p className="text-sm font-semibold text-slate-900">{card.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Contact form */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Send us a message</h2>
              <p className="text-sm text-slate-500 mb-6">Fill in the form and we'll get back to you as soon as possible.</p>

              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-10"
                >
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Message sent!</h3>
                  <p className="text-sm text-slate-500 mb-5">
                    Our team will reply to <strong>{email}</strong> within 24 hours.
                  </p>

                  {ticketNumber && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl py-4 px-6 mb-5 inline-block">
                      <div className="flex items-center gap-2 text-blue-600 justify-center mb-1">
                        <Hash className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wide">Reference Number</span>
                      </div>
                      <p className="text-2xl font-black text-[#1E40AF] tracking-widest font-mono">{ticketNumber}</p>
                      <p className="text-xs text-blue-400 mt-1">Use this when following up with support</p>
                    </div>
                  )}

                  <button
                    onClick={() => { setSent(false); setTicketNumber(''); setName(''); setEmail(''); setTopic(''); setMessage('') }}
                    className="block mx-auto text-sm text-[#1E40AF] hover:underline font-medium"
                  >
                    Send another message
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Full Name"
                      placeholder="John Smith"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Topic</label>
                    <select
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
                    >
                      <option value="">Select a topic…</option>
                      {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Message <span className="text-slate-400 font-normal">({message.length}/1000)</span>
                    </label>
                    <textarea
                      rows={5}
                      maxLength={1000}
                      placeholder="Describe your issue or question in detail…"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent resize-none transition-all"
                    />
                  </div>

                  <Button type="submit" loading={sending} className="w-full" size="lg">
                    <Send className="w-4 h-4" />
                    Send Message
                  </Button>
                </form>
              )}
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* Quick FAQ */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#3B82F6]" />
                Common Questions
              </h3>
              <div className="space-y-4">
                {FAQ_SNIPPETS.map(item => (
                  <div key={item.q} className="border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                    <p className="text-sm font-medium text-slate-800 mb-1">{item.q}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
              <Link to="/#faq" className="mt-4 block text-xs text-[#1E40AF] hover:underline font-medium">
                View all FAQ →
              </Link>
            </div>

            {/* Social / Telegram */}
            <div className="bg-gradient-to-br from-[#1E40AF] to-[#2563eb] rounded-2xl p-6 text-white">
              <Share2 className="w-5 h-5 mb-3 text-blue-200" />
              <h3 className="font-semibold mb-1">Follow Us</h3>
              <p className="text-xs text-blue-200 mb-4">
                Stay updated with market insights, platform news, and trader spotlights.
              </p>
              <div className="flex gap-2">
                <a
                  href="#"
                  className="flex-1 text-center text-xs bg-white/15 hover:bg-white/25 transition-colors rounded-xl py-2 font-medium"
                >
                  Twitter / X
                </a>
                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center text-xs bg-white/15 hover:bg-white/25 transition-colors rounded-xl py-2 font-medium"
                >
                  Telegram
                </a>
              </div>
            </div>

            {/* Office address */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              {/* Address */}
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-[#1E40AF]" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Office Address</p>
                  <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                    {cmsContact.address || DEFAULT_ADDRESS}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Phone</p>
                  <a
                    href={`tel:${(cmsContact.phone || DEFAULT_PHONE).replace(/\s/g, '')}`}
                    className="text-sm text-slate-800 hover:text-[#1E40AF] transition-colors font-medium"
                  >
                    {cmsContact.phone || DEFAULT_PHONE}
                  </a>
                </div>
              </div>

              {/* Business email */}
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Business Inquiries</p>
                  <a
                    href={`mailto:${BUSINESS_EMAIL}`}
                    className="text-sm text-[#1E40AF] hover:underline font-medium"
                  >
                    {BUSINESS_EMAIL}
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <LandingFooter />
    </div>
  )
}
