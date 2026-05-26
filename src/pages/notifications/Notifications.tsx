import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { timeAgo } from '@/lib/utils'
import type { Notification } from '@/types/database'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const typeConfig = {
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-100' },
  success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-100' },
  danger: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100' },
}

export default function Notifications() {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchNotifs = async () => {
    if (!profile) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
    setNotifications(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    fetchNotifs()
    if (!profile) return
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        payload => {
          setNotifications(prev => [payload.new as Notification, ...prev])
          toast.success((payload.new as Notification).title)
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [profile])

  const markAllRead = async () => {
    if (!profile) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-slate-500 mt-1">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </Button>
        )}
      </div>

      <Card padding="none">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n, i) => {
              const { icon: Icon, color, bg } = typeConfig[n.type]
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    'flex items-start gap-4 p-4 transition-colors cursor-pointer',
                    !n.is_read ? 'bg-blue-50/50 hover:bg-blue-50' : 'hover:bg-slate-50'
                  )}
                  onClick={() => !n.is_read && markRead(n.id)}
                >
                  <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-medium', n.is_read ? 'text-slate-700' : 'text-slate-900')}>
                        {n.title}
                      </p>
                      <span className="text-xs text-slate-400 flex-shrink-0">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                  </div>
                  {!n.is_read && (
                    <div className="w-2 h-2 rounded-full bg-[#3B82F6] flex-shrink-0 mt-2" />
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
