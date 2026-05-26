import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import type { FAQItem } from '@/types/settings'

function FAQItemComponent({ q, a, isOpen, onToggle }: {
  q: string; a: string; isOpen: boolean; onToggle: () => void
}) {
  return (
    <div className={`border rounded-2xl overflow-hidden transition-colors duration-200 ${isOpen ? 'border-[#3B82F6]/30' : 'border-slate-200'}`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-5 text-left transition-colors ${
          isOpen ? 'bg-blue-50' : 'bg-white hover:bg-slate-50'
        }`}
      >
        <span className={`font-semibold text-sm pr-4 leading-snug ${isOpen ? 'text-[#1E40AF]' : 'text-slate-900'}`}>
          {q}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex-shrink-0"
        >
          <ChevronDown className={`w-5 h-5 ${isOpen ? 'text-[#1E40AF]' : 'text-slate-400'}`} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 pt-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQSection() {
  const { settings } = useSiteSettings()
  const { faq } = settings
  const items = faq.items as FAQItem[]

  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-[#3B82F6] font-semibold text-sm uppercase tracking-wider mb-3">FAQ</p>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">{faq.headline}</h2>
          <p className="text-slate-500">
            {faq.subheadline}{' '}
            <span className="text-[#1E40AF] font-medium">Can't find the answer? Contact our support team.</span>
          </p>
        </motion.div>

        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.03 }}
            >
              <FAQItemComponent
                q={item.q}
                a={item.a}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
