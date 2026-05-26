import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, TrendingUp, Wallet, Bell, Settings,
  LayoutGrid, Users, CreditCard,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

// Investor quick-access tabs (most important 5)
const investorTabs = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Home'     },
  { to: '/investments',  icon: TrendingUp,      label: 'Invest'   },
  { to: '/wallet',       icon: Wallet,          label: 'Wallet'   },
  { to: '/notifications',icon: Bell,            label: 'Alerts'   },
  { to: '/settings',     icon: Settings,        label: 'Settings' },
]

const traderTabs = [
  { to: '/trader',            icon: LayoutDashboard, label: 'Overview'  },
  { to: '/trader/trades',     icon: TrendingUp,      label: 'Trades'    },
  { to: '/trader/followers',  icon: Users,           label: 'Followers' },
  { to: '/notifications',     icon: Bell,            label: 'Alerts'    },
  { to: '/settings',          icon: Settings,        label: 'Settings'  },
]

const adminTabs = [
  { to: '/admin',             icon: LayoutGrid,  label: 'Overview' },
  { to: '/admin/users',       icon: Users,       label: 'Users'    },
  { to: '/admin/transactions',icon: CreditCard,  label: 'Txns'     },
  { to: '/admin/kyc',         icon: TrendingUp,  label: 'KYC'      },
  { to: '/admin/settings',    icon: Settings,    label: 'Settings' },
]

export function MobileBottomNav() {
  const { profile } = useAuth()

  const tabs =
    profile?.role === 'super_admin' || profile?.role === 'admin'
      ? adminTabs
      : profile?.role === 'copy_trader'
      ? traderTabs
      : investorTabs

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)] safe-area-bottom">
      <div className="flex items-stretch">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard' || to === '/admin' || to === '/trader'}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors min-h-[56px]',
                isActive ? 'text-[#1E40AF]' : 'text-slate-400 hover:text-slate-600'
              )
            }
          >
            {({ isActive }) => (
              <>
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={cn(
                    'w-10 h-6 flex items-center justify-center rounded-full transition-colors',
                    isActive ? 'bg-blue-50' : ''
                  )}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                <span className={cn(
                  'text-[10px] font-medium leading-none',
                  isActive ? 'text-[#1E40AF]' : 'text-slate-400'
                )}>
                  {label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute top-0 h-0.5 w-8 bg-[#1E40AF] rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
