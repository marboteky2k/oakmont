import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { TrendingUp, ArrowRight, Mail, MapPin, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'

function scrollTo(id: string) {
  document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })
}

type FooterLink = { label: string; to: string; href?: undefined } | { label: string; href: string; to?: undefined }

const footerLinks: Record<string, FooterLink[]> = {
  Platform: [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'Copy Trading', to: '/copy-trading' },
    { label: 'Investment Plans', to: '/plans' },
    { label: 'Wallet', to: '/wallet' },
    { label: 'Affiliate Programme', to: '/affiliate' },
  ],
  Company: [
    { label: 'About Us', to: '/about' },
    { label: 'How It Works', href: '#about' },
    { label: 'Blog', to: '/blog' },
    { label: 'Careers', to: '/careers' },
  ],
  Support: [
    { label: 'FAQ', to: '/faq' },
    { label: 'Contact Us', to: '/contact' },
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
    { label: 'Cookie Policy', to: '/cookie-policy' },
  ],
}

export function LandingFooter() {
  const { settings } = useSiteSettings()
  const { brand } = settings

  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes('@')) { toast.error('Enter a valid email address'); return }
    setSubscribed(true)
    setEmail('')
    toast.success('You\'re subscribed to our newsletter!')
  }

  return (
    <footer className="bg-slate-950 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">

          {/* Brand + social + newsletter */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 mb-4 group w-fit">
              <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-lg flex-shrink-0"
                style={{ backgroundColor: brand.logo_url ? 'transparent' : '#1E40AF' }}>
                {brand.logo_url ? (
                  <img src={brand.logo_url} alt={brand.company_name} className="w-9 h-9 object-contain" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="text-white font-bold group-hover:text-blue-300 transition-colors">
                {brand.company_name.split(' ').slice(0, -1).join(' ')}{' '}
                <span className="text-[#3B82F6]">{brand.company_name.split(' ').slice(-1)[0]}</span>
              </span>
            </Link>

            <p className="text-sm leading-relaxed mb-6 max-w-xs">
              {brand.tagline}
            </p>

            <div className="flex items-center gap-3 mb-8">
              {/* Twitter/X */}
              <a href="#" aria-label="Twitter" className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-[#1E40AF] hover:text-white transition-all duration-200">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              {/* Telegram */}
              <a href={brand.telegram_url || '#'} target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-[#1E40AF] hover:text-white transition-all duration-200">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg>
              </a>
              {/* Instagram */}
              <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-[#1E40AF] hover:text-white transition-all duration-200">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" /></svg>
              </a>
            </div>

            {/* Address block */}
            <div className="mb-6 space-y-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#3B82F6] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  447 Broadway, 2nd Floor<br />
                  New York, NY 10013<br />
                  United States
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#3B82F6] flex-shrink-0" />
                <a
                  href="tel:+16092574786"
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  +1 609 257 4786
                </a>
              </div>
            </div>

            <div>
              <p className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#3B82F6]" />
                Newsletter
              </p>
              {subscribed ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-green-400 text-sm font-medium"
                >
                  ✓ You're subscribed! Thanks for joining.
                </motion.p>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 bg-slate-800 text-white text-sm px-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:border-[#3B82F6] placeholder:text-slate-500 transition-colors min-w-0"
                  />
                  <button
                    type="submit"
                    className="bg-[#1E40AF] hover:bg-blue-700 text-white px-3 py-2.5 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Platform links */}
          <div>
            <h4 className="text-white text-sm font-semibold mb-5">Platform</h4>
            <ul className="space-y-3">
              {footerLinks.Platform.map(link => (
                <li key={link.label}>
                  {'to' in link ? (
                    <Link to={link.to!} className="text-sm hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200">
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className="text-sm hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200" onClick={link.href!.startsWith('#') ? e => { e.preventDefault(); scrollTo(link.href!) } : undefined}>
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company + Support combined for grid fit */}
          <div className="space-y-8">
            <div>
              <h4 className="text-white text-sm font-semibold mb-5">Company</h4>
              <ul className="space-y-3">
                {footerLinks.Company.map(link => (
                  <li key={link.label}>
                    {'to' in link ? (
                      <Link to={link.to!} className="text-sm hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200">
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200"
                        onClick={link.href!.startsWith('#') ? e => { e.preventDefault(); scrollTo(link.href!) } : undefined}
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-5">Support</h4>
              <ul className="space-y-3">
                {footerLinks.Support.map(link => (
                  <li key={link.label}>
                    {'to' in link ? (
                      <Link to={link.to!} className="text-sm hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200">
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm hover:text-white transition-colors hover:translate-x-1 inline-block transform duration-200"
                        onClick={link.href!.startsWith('#') ? e => { e.preventDefault(); scrollTo(link.href!) } : undefined}
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            © {new Date().getFullYear()} {brand.company_name}. All rights reserved.{' '}
            <span className="text-slate-600">Trading involves risk of loss.</span>
          </p>
          <div className="flex items-center gap-5 text-xs">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link to="/cookie-policy" className="hover:text-white transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
