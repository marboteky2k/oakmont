import { useState } from 'react'
import { Menu, Bell, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { Link } from 'react-router-dom'

interface TopbarProps {
  onMenuClick: () => void
  title?: string
}

export function Topbar({ onMenuClick, title }: TopbarProps) {
  const { profile } = useAuth()
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-100 px-4 md:px-6 py-3">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5 text-slate-600" />
        </button>

        {title && (
          <h1 className="text-lg font-semibold text-slate-900 hidden md:block">{title}</h1>
        )}

        <div className="flex-1" />

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-2 w-64">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            placeholder="Search..."
            className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none flex-1"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(v => !v)}
            className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
              >
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <p className="font-semibold text-slate-900 text-sm">Notifications</p>
                  <Link to="/notifications" className="text-xs text-[#3B82F6] hover:underline" onClick={() => setNotifOpen(false)}>
                    View all
                  </Link>
                </div>
                <div className="p-4 text-center text-sm text-slate-500">
                  No new notifications
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <Link to="/settings" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#1E40AF] flex items-center justify-center text-white text-xs font-bold">
            {profile?.full_name?.charAt(0) ?? 'U'}
          </div>
        </Link>
      </div>
    </header>
  )
}
