import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, TrendingUp, Wallet, BarChart3, Users, Settings,
  LogOut, Bell, ChevronRight, CreditCard, FileText,
  UserCheck, Database, Gift, Headphones, DollarSign, LineChart,
  Send, BarChart2, Lock, Sparkles, Activity, Bot, Link2, MessageCircle, CandlestickChart, Zap, History,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications'
import { cn } from '@/lib/utils'
import type { BrandSettings } from '@/types/settings'
import type { User } from '@/types/database'

// ── Nav definitions ───────────────────────────────────────────────────────────

type NavItem = { to: string; icon: React.ComponentType<{ className?: string }>; label: string; badge?: number }

const investorNav: NavItem[] = [
  { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/copy-trading',   icon: TrendingUp,      label: 'Copy Trading' },
  { to: '/investments',    icon: BarChart3,        label: 'Investments' },
  { to: '/markets',        icon: Activity,         label: 'Markets' },
  { to: '/trading',        icon: CandlestickChart, label: 'Live Trading' },
  { to: '/trade-history',  icon: History,          label: 'Trade History' },
  { to: '/bot-trading',    icon: Bot,              label: 'Bot Trading' },
  { to: '/exchanges',      icon: Link2,            label: 'Exchanges' },
  { to: '/wallet',         icon: Wallet,           label: 'Wallet' },
  { to: '/transactions',   icon: CreditCard,       label: 'Transactions' },
  { to: '/referrals',      icon: Gift,             label: 'Referrals' },
  { to: '/kyc',            icon: UserCheck,        label: 'KYC Verification' },
  { to: '/notifications',  icon: Bell,             label: 'Notifications' },
  { to: '/settings',       icon: Settings,         label: 'Settings' },
  { to: '/support',        icon: Headphones,       label: 'Support' },
]

const traderNav: NavItem[] = [
  { to: '/trader',             icon: LayoutDashboard, label: 'Overview' },
  { to: '/trader/performance', icon: BarChart3,        label: 'My Performance' },
  { to: '/trader/trades',      icon: TrendingUp,       label: 'Open Trades' },
  { to: '/trader/followers',   icon: DollarSign,       label: 'Followers & Earnings' },
  { to: '/markets',            icon: Activity,         label: 'Markets' },
  { to: '/trading',            icon: CandlestickChart, label: 'Live Trading' },
  { to: '/trade-history',      icon: History,          label: 'Trade History' },
  { to: '/trader/profile',     icon: UserCheck,        label: 'Profile Setup' },
  { to: '/notifications',      icon: Bell,             label: 'Notifications' },
  { to: '/settings',           icon: Settings,         label: 'Settings' },
]

const adminNavBase: NavItem[] = [
  { to: '/admin',                 icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/users',           icon: Users,           label: 'User Management' },
  { to: '/admin/traders',         icon: TrendingUp,      label: 'Copy Traders' },
  { to: '/admin/investments',     icon: BarChart3,        label: 'Investment Plans' },
  { to: '/admin/transactions',    icon: CreditCard,       label: 'Transactions' },
  { to: '/admin/kyc',             icon: UserCheck,        label: 'KYC Review' },
  { to: '/admin/signals',         icon: LineChart,        label: 'Trade Signals' },
  { to: '/admin/wallets',         icon: Database,         label: 'Crypto Wallets' },
  { to: '/admin/markets',         icon: Activity,             label: 'Markets Config' },
  { to: '/trading',               icon: CandlestickChart,     label: 'Live Trading' },
  { to: '/admin/live-trades',     icon: Zap,                  label: 'Trade Monitor' },
  { to: '/admin/bot-monitor',     icon: Bot,                  label: 'Bot Monitor' },
  { to: '/admin/exchange-monitor',icon: Link2,            label: 'Exchange Monitor' },
  { to: '/admin/chat',            icon: MessageCircle,    label: 'Live Chat' },
  { to: '/admin/notifications',   icon: Send,             label: 'Notifications' },
  { to: '/admin/audit',           icon: FileText,         label: 'Audit Logs' },
  { to: '/admin/reports',         icon: BarChart2,        label: 'Reports' },
  { to: '/admin/profit-engine',   icon: Sparkles,         label: 'Profit Engine' },
]

const adminNavSuperAdmin: NavItem[] = [
  ...adminNavBase,
  { to: '/admin/settings', icon: Lock, label: 'Site Settings' },
]

function getAdminNav(role: string): NavItem[] {
  return role === 'super_admin' ? adminNavSuperAdmin : adminNavBase
}

// ── SidebarContent (top-level component — NOT defined inside Sidebar) ─────────
// Defining this OUTSIDE Sidebar is critical: if defined inside, React creates a
// new function reference on every render, breaking hook identity and causing
// "Rendered more hooks than during the previous render".

interface SidebarContentProps {
  brand:        BrandSettings
  profile:      User | null
  navItems:     NavItem[]
  onClose:      () => void
  onSignOut:    () => void
  unreadCount:  number
}

function SidebarContent({ brand, profile, navItems, onClose, onSignOut, unreadCount }: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">

      {/* Logo → Homepage */}
      <div className="px-6 py-5 border-b border-blue-700/30">
        <NavLink to="/" className="flex items-center gap-3 group" onClick={onClose}>
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
            {brand.logo_url ? (
              <img
                src={brand.logo_url}
                alt={brand.company_name}
                className="w-8 h-8 object-contain"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            ) : (
              <TrendingUp className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight group-hover:opacity-80 transition-opacity">
              {brand.company_name.split(' ').slice(0, -1).join(' ') || 'Oakmont Ridge'}
            </p>
            <p className="text-blue-200 text-xs">
              {brand.company_name.split(' ').slice(-1)[0] || 'Capital'}
            </p>
          </div>
        </NavLink>
      </div>

      {/* Profile chip */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/10">
          <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {profile?.full_name?.charAt(0) ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-medium truncate">{profile?.full_name ?? 'User'}</p>
            <p className="text-blue-200 text-xs capitalize truncate">{profile?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          // Notifications link gets the unread badge
          const isNotifLink = to === '/notifications'
          const badge = isNotifLink && unreadCount > 0 ? unreadCount : 0
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard' || to === '/admin' || to === '/trader'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group',
                  isActive
                    ? 'bg-white text-[#1E40AF] shadow-sm'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Icon with optional badge dot */}
                  <span className="relative flex-shrink-0">
                    <Icon className={cn('w-4 h-4', isActive ? 'text-[#1E40AF]' : 'text-blue-200 group-hover:text-white')} />
                    {badge > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </span>
                  <span className="flex-1">{label}</span>
                  {/* Show unread count next to label too (when not active) */}
                  {badge > 0 && !isActive && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-tight">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3 h-3 text-[#3B82F6]" />}
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-4 py-4 border-t border-blue-700/30">
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-100 hover:bg-red-500/20 hover:text-red-200 transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  )
}

// ── Sidebar shell ─────────────────────────────────────────────────────────────

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { profile, signOut } = useAuth()
  const { settings } = useSiteSettings()
  const navigate = useNavigate()
  const unreadCount = useUnreadNotifications(profile?.id)

  const navItems: NavItem[] =
    profile?.role === 'super_admin' || profile?.role === 'admin'
      ? getAdminNav(profile.role)
      : profile?.role === 'copy_trader'
      ? traderNav
      : investorNav

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const contentProps: SidebarContentProps = {
    brand:       settings.brand,
    profile,
    navItems,
    onClose,
    onSignOut:   handleSignOut,
    unreadCount,
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 bg-gradient-to-b from-[#1E40AF] to-[#1e3a8a] h-screen sticky top-0">
        <SidebarContent {...contentProps} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-full w-64 bg-gradient-to-b from-[#1E40AF] to-[#1e3a8a] lg:hidden"
            >
              <SidebarContent {...contentProps} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
