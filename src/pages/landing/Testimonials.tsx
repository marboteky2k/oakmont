import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import type { Testimonial } from '@/types/settings'

const variants = {
  enter:  (dir: number) => ({ opacity: 0, x: dir * 80 }),
  center: { opacity: 1, x: 0 },
  exit:   (dir: number) => ({ opacity: 0, x: -dir * 80 }),
}

export function Testimonials() {
  const { settings } = useSiteSettings()
  const testimonials = settings.testimonials.items as Testimonial[]

  const [index,  setIndex]  = useState(0)
  const [dir,    setDir]    = useState(1)
  const [paused, setPaused] = useState(false)

  const next = () => {
    setDir(1)
    setIndex(i => (i + 1) % testimonials.length)
  }

  const prev = () => {
    setDir(-1)
    setIndex(i => (i - 1 + testimonials.length) % testimonials.length)
  }

  const goTo = (i: number) => {
    setDir(i > index ? 1 : -1)
    setIndex(i)
  }

  useEffect(() => {
    if (paused || testimonials.length === 0) return
    const id = setInterval(next, 5000)
    return () => clearInterval(id)
  }, [paused, testimonials.length])

  // Guard against empty testimonials or out-of-range index
  if (testimonials.length === 0) return null
  const safeIndex = index % testimonials.length
  const t = testimonials[safeIndex]

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-[#3B82F6] font-semibold text-sm uppercase tracking-wider mb-3">Testimonials</p>
          <h2 className="text-4xl font-bold text-slate-900 mb-4">What our investors say</h2>
          <p className="text-slate-500">Real stories from real investors generating returns on our platform.</p>
        </motion.div>

        <div
          className="max-w-3xl mx-auto"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative overflow-hidden min-h-[280px] flex items-center">
            <AnimatePresence mode="wait" custom={dir}>
              <motion.div
                key={safeIndex}
                custom={dir}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                className="bg-white rounded-3xl p-8 md:p-10 shadow-lg border border-slate-100 w-full"
              >
                <div className="flex items-center gap-0.5 mb-6">
                  {[...Array(t.stars)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <blockquote className="text-slate-700 text-lg leading-relaxed mb-8 italic">
                  "{t.quote}"
                </blockquote>

                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${t.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{t.name}</p>
                    <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span>{t.flag}</span>
                      {t.country}
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between mt-8">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`transition-all duration-300 rounded-full ${
                    i === safeIndex
                      ? 'w-6 h-2 bg-[#1E40AF]'
                      : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
