import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Menu, X, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { useAuth } from '@/contexts/AuthContext'

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Copy Trading', href: '#traders' },
  { label: 'Investment Plans', href: '#plans' },
  { label: 'Markets', href: '#markets' },
  { label: 'About', href: '#about' },
  { label: 'FAQ', href: '#faq' },
]

function scrollTo(id: string) {
  document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })
}

export function LandingNav() {
  const { settings } = useSiteSettings()
  const { brand } = settings
  const { session, profile } = useAuth()
  const isLoggedIn = !!session
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Determine where "dashboard" takes the user based on their role
  const dashboardPath =
    profile?.role === 'super_admin' || profile?.role === 'admin'
      ? '/admin'
      : profile?.role === 'copy_trader'
      ? '/trader'
      : '/dashboard'

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <>
      <nav className={`sticky top-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? 'bg-white shadow-sm border-slate-100'
          : 'bg-white/95 backdrop-blur-md border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center shadow-md" style={{ backgroundColor: brand.logo_url ? 'transparent' : brand.primary_color }}>
                {brand.logo_url ? (
                  <img src={brand.logo_url} alt={brand.company_name} className="w-8 h-8 object-contain"
                    onError={e => { const el = e.target as HTMLImageElement; el.style.display = 'none'; el.nextElementSibling?.removeAttribute('style') }}
                  />
                ) : (
                  <TrendingUp className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="font-bold text-slate-900 text-sm">
                {brand.company_name.split(' ').slice(0, -1).join(' ')}{' '}
                <span style={{ color: brand.primary_color }}>
                  {brand.company_name.split(' ').slice(-1)[0]}
                </span>
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-7">
              {navLinks.map(link => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-slate-600 hover:text-[#1E40AF] transition-colors font-medium cursor-pointer"
                  onClick={e => { e.preventDefault(); scrollTo(link.href) }}
                >
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              {isLoggedIn ? (
                <Link to={dashboardPath}>
                  <Button size="sm" className="flex items-center gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm">Get Started</Button>
                  </Link>
                </>
              )}
            </div>

            <button
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              onClick={() => setIsOpen(v => !v)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setIsOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-white shadow-2xl md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center" style={{ backgroundColor: brand.logo_url ? 'transparent' : brand.primary_color }}>
                    {brand.logo_url ? (
                      <img src={brand.logo_url} alt={brand.company_name} className="w-7 h-7 object-contain" />
                    ) : (
                      <TrendingUp className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  <span className="font-bold text-xs text-slate-900">{brand.company_name}</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto py-3">
                {navLinks.map((link, i) => (
                  <motion.a
                    key={link.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    href={link.href}
                    className="flex items-center px-5 py-3.5 text-slate-700 hover:text-[#1E40AF] hover:bg-blue-50 transition-colors text-sm font-medium"
                    onClick={e => {
                      e.preventDefault()
                      setIsOpen(false)
                      setTimeout(() => scrollTo(link.href), 100)
                    }}
                  >
                    {link.label}
                  </motion.a>
                ))}
              </nav>

              <div className="p-5 border-t border-slate-100 space-y-2.5">
                {isLoggedIn ? (
                  <Link to={dashboardPath} onClick={() => setIsOpen(false)} className="block">
                    <Button className="w-full flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Go to Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsOpen(false)} className="block">
                      <Button variant="outline" className="w-full">Sign In</Button>
                    </Link>
                    <Link to="/register" onClick={() => setIsOpen(false)} className="block">
                      <Button className="w-full">Get Started Free</Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
