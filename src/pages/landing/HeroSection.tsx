import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useCountUp } from '@/hooks/useCountUp'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import type { HeroStat } from '@/types/settings'

// SVG candlestick data — decorative, not editable
const candleData = [
  { x: 30,  open: 178, close: 162, high: 157, low: 184 },
  { x: 72,  open: 162, close: 175, high: 159, low: 178 },
  { x: 114, open: 168, close: 150, high: 146, low: 172 },
  { x: 156, open: 148, close: 132, high: 128, low: 153 },
  { x: 198, open: 134, close: 118, high: 114, low: 138 },
  { x: 240, open: 115, close: 128, high: 111, low: 132 },
  { x: 282, open: 122, close: 94,  high: 90,  low: 126 },
  { x: 324, open: 90,  close: 66,  high: 62,  low: 94  },
]

const closePts = candleData.map(c => [c.x, c.close] as [number, number])
const linePath = closePts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ')
const areaPath = `${linePath} L 324 230 L 30 230 Z`

const volumeHeights = [7, 5, 9, 12, 8, 6, 14, 10]

function StatCounter({
  value, label, suffix, prefix, delay,
}: { value: number; label: string; suffix: string; prefix: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  const count = useCountUp(value, 2200, inView)
  return (
    <motion.div
      ref={ref}
      className="text-center"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <p className="text-3xl md:text-4xl font-black text-white tabular-nums">
        {prefix}{Math.round(count).toLocaleString()}{suffix}
      </p>
      <p className="text-blue-200 text-sm mt-1 font-medium">{label}</p>
    </motion.div>
  )
}

function FloatingChart() {
  return (
    <motion.div
      animate={{ y: [0, -14, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      className="relative w-full max-w-md mx-auto lg:mx-0"
    >
      <div className="bg-white/[0.08] backdrop-blur-md rounded-2xl border border-white/20 p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white font-semibold text-sm">Portfolio Performance</p>
            <p className="text-blue-300 text-xs mt-0.5">All traders · Live</p>
          </div>
          <div className="text-right">
            <p className="text-green-400 font-bold text-lg">+24.8%</p>
            <p className="text-blue-300 text-xs mt-0.5">This month</p>
          </div>
        </div>

        <svg viewBox="0 0 364 245" className="w-full">
          <defs>
            <linearGradient id="heroAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#60A5FA" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[80, 130, 180].map(y => (
            <line
              key={y} x1="8" y1={y} x2="356" y2={y}
              stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="4 4"
            />
          ))}

          <motion.path
            d={areaPath}
            fill="url(#heroAreaGrad)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          />

          <motion.path
            d={linePath}
            fill="none"
            stroke="#60A5FA"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: 'easeOut', delay: 0.4 }}
          />

          {candleData.map((c, i) => {
            const bull = c.close < c.open
            const bodyTop = Math.min(c.open, c.close)
            const bodyH = Math.max(Math.abs(c.close - c.open), 4)
            const color = bull ? '#4ADE80' : '#F87171'
            return (
              <motion.g
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.12 }}
              >
                <line x1={c.x} y1={c.high} x2={c.x} y2={c.low} stroke={color} strokeWidth="1.5" />
                <rect x={c.x - 7} y={bodyTop} width="14" height={bodyH} rx="2" fill={color} fillOpacity="0.9" />
              </motion.g>
            )
          })}

          {candleData.map((c, i) => {
            const bull = c.close < c.open
            return (
              <motion.rect
                key={`v${i}`}
                x={c.x - 6} y={232 - volumeHeights[i]}
                width="12" height={volumeHeights[i]}
                rx="1.5"
                fill={bull ? '#4ADE80' : '#F87171'}
                fillOpacity="0.4"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                style={{ transformOrigin: `${c.x}px 232px` }}
                transition={{ delay: 1.6 + i * 0.08 }}
              />
            )
          })}

          <motion.circle
            cx={324} cy={66} r={4}
            fill="#60A5FA"
            animate={{ r: [4, 8, 4], opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </svg>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2, duration: 0.5 }}
        className="absolute -top-3 -right-3 bg-white rounded-xl px-3 py-2 shadow-2xl border border-slate-100"
      >
        <p className="text-xs text-slate-500">BTC/USD</p>
        <p className="text-slate-900 font-bold text-sm">
          $67,420 <span className="text-green-500 text-xs font-semibold">+2.4%</span>
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.3, duration: 0.5 }}
        className="absolute -bottom-3 -left-3 bg-white rounded-xl px-3 py-2 shadow-2xl border border-slate-100"
      >
        <p className="text-xs text-slate-500">Marcus Chen</p>
        <p className="text-slate-900 font-bold text-sm">
          Win Rate <span className="text-[#1E40AF] font-bold">91%</span>
        </p>
      </motion.div>
    </motion.div>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export function HeroSection() {
  const { settings } = useSiteSettings()
  const { hero } = settings

  // Split headline at the period to apply gradient to second sentence
  const headlineParts = hero.headline.split('. ')
  const headlineFirst  = headlineParts[0] ? headlineParts[0] + '.' : ''
  const headlineSecond = headlineParts.slice(1).join('. ')

  return (
    <section id="home" className="relative overflow-hidden bg-gradient-to-br from-[#0C1A4E] via-[#1E40AF] to-[#2563eb] min-h-screen flex flex-col">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/15 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-900/30 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="relative flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20 items-center w-full">

          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.13 } } }}
          >
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2.5 bg-white/15 rounded-full px-4 py-2 text-sm mb-7 border border-white/20 backdrop-blur-sm"
            >
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
              <span className="text-blue-50">{hero.badge_text}</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl sm:text-5xl xl:text-6xl font-extrabold leading-[1.06] tracking-tight text-white mb-6"
            >
              {headlineFirst}{' '}
              {headlineSecond && (
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-cyan-300">
                  {headlineSecond}
                </span>
              )}
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg text-blue-100 mb-10 leading-relaxed max-w-xl">
              {hero.subheadline}
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap gap-4">
              <Link to="/register">
                <Button
                  size="lg"
                  className="bg-white text-[#1E40AF] hover:bg-blue-50 shadow-2xl font-bold px-8 h-12"
                >
                  {hero.cta_primary} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <button
                onClick={() => document.querySelector('#traders')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-8 h-12 rounded-xl border-2 border-white/40 text-white hover:bg-white/10 transition-colors text-sm font-semibold"
              >
                {hero.cta_secondary}
              </button>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-5 mt-8">
              {hero.trust_points.map(text => (
                <div key={text} className="flex items-center gap-1.5 text-xs text-blue-200">
                  <svg className="w-3.5 h-3.5 text-green-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {text}
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
            className="hidden lg:flex justify-center"
          >
            <FloatingChart />
          </motion.div>
        </div>
      </div>

      <div className="relative border-t border-white/10 bg-black/15 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
          {(hero.stats as HeroStat[]).map((s, i) => (
            <StatCounter key={s.label} {...s} delay={0.7 + i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  )
}
