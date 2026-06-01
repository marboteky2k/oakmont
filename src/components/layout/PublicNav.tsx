import { Link, useLocation } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'

interface PublicNavProps {
  /** @deprecated – ignored; nav now shows links instead of a back button */
  showBack?: boolean
  backLabel?: string
  backTo?: string
}

const NAV_LINKS = [
  { label: 'About', to: '/about' },
  { label: 'Plans', to: '/plans' },
  { label: 'FAQ', to: '/faq' },
  { label: 'Affiliate', to: '/affiliate' },
  { label: 'Contact', to: '/contact' },
]

/**
 * Nav bar used on all standalone public pages.
 * Logo links to homepage; right side shows page links + login/register CTAs.
 */
export function PublicNav(_props: PublicNavProps) {
  const { settings } = useSiteSettings()
  const { brand } = settings
  const location = useLocation()

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 gap-4">
          {/* Logo → Homepage */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div
              className="w-8 h-8 rounded-xl overflow-hidden flex items-center justify-center shadow-sm"
              style={{ backgroundColor: brand.logo_url ? 'transparent' : brand.primary_color || '#1E40AF' }}
            >
              {brand.logo_url ? (
                <img
                  src={brand.logo_url}
                  alt={brand.company_name}
                  className="w-8 h-8 object-contain"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <TrendingUp className="w-4 h-4 text-white" />
              )}
            </div>
            <span className="font-bold text-slate-900 text-sm group-hover:opacity-80 transition-opacity hidden sm:block">
              {brand.company_name.split(' ').slice(0, -1).join(' ')}{' '}
              <span style={{ color: brand.primary_color || '#1E40AF' }}>
                {brand.company_name.split(' ').slice(-1)[0]}
              </span>
            </span>
          </Link>

          {/* Centre nav links – hidden on small screens */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'text-[#1E40AF] bg-blue-50'
                    : 'text-slate-600 hover:text-[#1E40AF] hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right CTA */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 hover:text-[#1E40AF] transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-sm font-bold text-white px-4 py-1.5 rounded-xl transition-colors"
              style={{ backgroundColor: brand.primary_color || '#1E40AF' }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
