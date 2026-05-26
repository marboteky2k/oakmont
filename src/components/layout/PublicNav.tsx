import { Link } from 'react-router-dom'
import { TrendingUp, ArrowLeft } from 'lucide-react'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'

interface PublicNavProps {
  /** Show a "← Back" link instead of / alongside the logo */
  showBack?: boolean
  backLabel?: string
  backTo?: string
}

/**
 * Minimal nav bar used on all standalone public pages
 * (Privacy, Terms, Blog, Careers, Contact, etc.)
 * Logo always links to homepage.
 */
export function PublicNav({ showBack = true, backLabel = 'Home', backTo = '/' }: PublicNavProps) {
  const { settings } = useSiteSettings()
  const { brand } = settings

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
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
            <span className="font-bold text-slate-900 text-sm group-hover:opacity-80 transition-opacity">
              {brand.company_name.split(' ').slice(0, -1).join(' ')}{' '}
              <span style={{ color: brand.primary_color || '#1E40AF' }}>
                {brand.company_name.split(' ').slice(-1)[0]}
              </span>
            </span>
          </Link>

          {/* Back link */}
          {showBack && (
            <Link
              to={backTo}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1E40AF] transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {backLabel}
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
