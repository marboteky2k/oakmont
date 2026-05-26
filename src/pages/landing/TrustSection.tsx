import { motion } from 'framer-motion'
import { Shield, Lock, Mail, BadgeCheck, Eye, Wallet } from 'lucide-react'

const trustItems = [
  {
    icon: Shield,
    color: 'bg-blue-100 text-[#1E40AF]',
    title: 'SSL Encrypted',
    desc: '256-bit SSL encryption protects all data in transit. Your personal information and transactions are always secured.',
  },
  {
    icon: Mail,
    color: 'bg-purple-100 text-purple-600',
    title: 'Email Verified',
    desc: 'Every withdrawal is secured with a one-time code sent to your registered email address — no app required.',
  },
  {
    icon: Wallet,
    color: 'bg-green-100 text-green-600',
    title: 'Cold Wallet Storage',
    desc: '95% of all user assets are stored offline in hardware cold wallets, completely isolated from online threats.',
  },
  {
    icon: BadgeCheck,
    color: 'bg-indigo-100 text-indigo-600',
    title: 'KYC Verified',
    desc: 'All users are identity-verified via government-issued ID and proof of address before any withdrawal is processed.',
  },
  {
    icon: Eye,
    color: 'bg-cyan-100 text-cyan-600',
    title: '24/7 Monitoring',
    desc: 'Round-the-clock security monitoring and automated alerts detect and respond to threats in real time.',
  },
  {
    icon: Lock,
    color: 'bg-rose-100 text-rose-600',
    title: 'Segregated Funds',
    desc: 'User funds are held in separate, independently audited accounts — completely isolated from company operations.',
  },
]

export function TrustSection() {
  return (
    <section id="security" className="py-24 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-[#3B82F6] font-semibold text-sm uppercase tracking-wider mb-3">Security & Trust</p>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Your security is our priority</h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            We employ military-grade security infrastructure to protect your funds and personal data at all times.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {trustItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="flex items-start gap-4 p-6 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:shadow-md transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-1.5">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
