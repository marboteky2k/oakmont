import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useCountUp } from '@/hooks/useCountUp'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import type { StatItem } from '@/types/settings'

function BigCounter({ label, value, suffix, prefix, delay }: {
  label: string; value: number; suffix: string; prefix: string; delay: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  const count = useCountUp(value, 2500, inView)
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="text-center"
    >
      <p className="text-5xl md:text-6xl font-black text-white mb-3 tabular-nums leading-none">
        {prefix}{Math.round(count).toLocaleString()}{suffix}
      </p>
      <p className="text-blue-200 font-medium text-sm md:text-base">{label}</p>
    </motion.div>
  )
}

export function StatsSection() {
  const { settings } = useSiteSettings()
  const { stats_bar } = settings

  return (
    <section className="py-24 bg-gradient-to-br from-[#0C1A4E] via-[#1E40AF] to-[#2563eb] relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.06] pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">{stats_bar.headline}</h2>
          <p className="text-blue-200 max-w-xl mx-auto">{stats_bar.subheadline}</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
          {(stats_bar.stats as StatItem[]).map((s, i) => (
            <BigCounter key={s.label} {...s} delay={i * 0.12} />
          ))}
        </div>
      </div>
    </section>
  )
}
