import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie, X, ChevronRight, Shield, BarChart2 } from 'lucide-react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'oakmont_cookie_consent'

type ConsentValue = 'all' | 'necessary' | null

function getStoredConsent(): ConsentValue {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'all' || v === 'necessary') return v
  } catch {
    // localStorage unavailable
  }
  return null
}

function storeConsent(value: 'all' | 'necessary') {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // ignore
  }
}

export function CookieBanner() {
  const [consent, setConsent] = useState<ConsentValue>(() => getStoredConsent())
  const [expanded, setExpanded] = useState(false)

  // Already consented — don't show
  if (consent !== null) return null

  function accept(value: 'all' | 'necessary') {
    storeConsent(value)
    setConsent(value)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 200 }}
        className="fixed bottom-4 left-4 right-4 z-[9999] max-w-2xl mx-auto"
        role="dialog"
        aria-label="Cookie consent"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
          {/* Top bar */}
          <div className="flex items-start gap-3 px-5 pt-5 pb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Cookie className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm">We use cookies</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                We use cookies to keep you logged in, remember preferences, and understand how you use the platform.
                See our{' '}
                <Link to="/cookie-policy" className="text-blue-600 hover:underline font-medium">
                  Cookie Policy
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-blue-600 hover:underline font-medium">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
            <button
              onClick={() => accept('necessary')}
              className="text-slate-300 hover:text-slate-500 transition-colors flex-shrink-0 mt-0.5"
              aria-label="Dismiss — necessary only"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Expandable detail */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-5 pb-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex items-start gap-2.5 bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-blue-800">Strictly Necessary</p>
                      <p className="text-xs text-blue-600 mt-0.5">Authentication, session security, CSRF. Always active.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <BarChart2 className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Analytics &amp; Functional</p>
                      <p className="text-xs text-slate-500 mt-0.5">Usage analytics, preferences, theme. Enabled with "Accept All".</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center gap-2.5 px-5 pb-5 pt-2 flex-wrap">
            <button
              onClick={() => accept('all')}
              className="flex-1 min-w-[120px] bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] text-white text-xs font-bold rounded-xl px-4 py-2.5 hover:opacity-90 transition-opacity shadow-sm"
            >
              Accept All
            </button>
            <button
              onClick={() => accept('necessary')}
              className="flex-1 min-w-[120px] border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl px-4 py-2.5 hover:bg-slate-50 transition-colors"
            >
              Necessary Only
            </button>
            <button
              onClick={() => setExpanded((p) => !p)}
              className="text-xs text-blue-500 hover:text-blue-700 transition-colors flex items-center gap-1 font-medium"
            >
              {expanded ? 'Hide details' : 'Learn more'}
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
