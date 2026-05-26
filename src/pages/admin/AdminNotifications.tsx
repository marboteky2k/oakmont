import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Bell, Users, TrendingUp, User, Info, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/contexts/AuthContext'
import type { Notification, NotificationType } from '@/types/database'
import toast from 'react-hot-toast'

type Audience = 'specific' | 'all' | 'investors' | 'traders'

const AUDIENCE_OPTIONS: { value: Audience; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'specific', label: 'Specific User', icon: User },
  { value: 'all', label: 'All Users', icon: Users },
  { value: 'investors', label: 'All Investors', icon: TrendingUp },
  { value: 'traders', label: 'All Traders', icon: TrendingUp },
]

const TYPE_OPTIONS = [
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Success' },
  { value: 'warning', label: 'Warning' },
  { value: 'danger', label: 'Danger' },
]

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  danger: XCircle,
}

const TYPE_STYLE: Record<string, string> = {
  info: 'bg-blue-100 text-blue-600',
  success: 'bg-green-100 text-green-600',
  warning: 'bg-yellow-100 text-yellow-600',
  danger: 'bg-red-100 text-red-600',
}

const TYPE_BADGE: Record<string, any> = {
  info: 'info', success: 'success', warning: 'warning', danger: 'danger',
}

export default function AdminNotifications() {
  const { profile } = useAuth()
  const [audience, setAudience] = useState<Audience>('all')
  const [specificEmail, setSpecificEmail] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState<NotificationType>('info')
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState<Notification[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const fetchHistory = async () => {
    setLoadingHistory(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    setHistory(data ?? [])
    setLoadingHistory(false)
  }

  useEffect(() => { fetchHistory() }, [])

  const send = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required.')
      return
    }
    setSending(true)
    try {
      let userIds: string[] = []

      if (audience === 'specific') {
        if (!specificEmail.trim()) { toast.error('Enter a user email.'); setSending(false); return }
        const { data } = await supabase.from('users').select('id').eq('email', specificEmail.trim()).single()
        if (!data) { toast.error('User not found.'); setSending(false); return }
        userIds = [data.id]
      } else if (audience === 'all') {
        const { data } = await supabase.from('users').select('id')
        userIds = (data ?? []).map((u) => u.id)
      } else {
        const role = audience === 'investors' ? 'investor' : 'copy_trader'
        const { data } = await supabase.from('users').select('id').eq('role', role)
        userIds = (data ?? []).map((u) => u.id)
      }

      if (userIds.length === 0) {
        toast.error('No users found for this audience.')
        setSending(false)
        return
      }

      const rows = userIds.map((uid) => ({
        user_id: uid,
        title: title.trim(),
        message: message.trim(),
        type,
        is_read: false,
      }))

      // Insert in chunks of 100 to avoid payload limits
      for (let i = 0; i < rows.length; i += 100) {
        const { error } = await supabase.from('notifications').insert(rows.slice(i, i + 100))
        if (error) throw error
      }

      toast.success(`Notification sent to ${userIds.length} user${userIds.length > 1 ? 's' : ''}.`)
      setTitle('')
      setMessage('')
      setSpecificEmail('')
      fetchHistory()
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to send notification.')
    } finally {
      setSending(false)
    }
  }

  const TypeIcon = TYPE_ICON[type]

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Notification Manager</h1>
        <p className="text-slate-500 text-sm mt-1">Broadcast in-app notifications to users or specific segments.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Compose form */}
        <Card className="lg:col-span-3 space-y-5">
          <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-3">Compose Notification</h3>

          {/* Audience */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Send To</p>
            <div className="grid grid-cols-2 gap-2">
              {AUDIENCE_OPTIONS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setAudience(value)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                    audience === value
                      ? 'border-[#1E40AF] bg-blue-50 text-[#1E40AF]'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Specific email */}
          {audience === 'specific' && (
            <Input
              label="User Email"
              placeholder="user@example.com"
              type="email"
              value={specificEmail}
              onChange={(e) => setSpecificEmail(e.target.value)}
            />
          )}

          {/* Type */}
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Type"
              options={TYPE_OPTIONS}
              value={type}
              onChange={(e) => setType(e.target.value as NotificationType)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Preview</label>
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${TYPE_STYLE[type]}`}>
                <TypeIcon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium capitalize">{type}</span>
              </div>
            </div>
          </div>

          {/* Title */}
          <Input
            label="Title"
            placeholder="e.g. Platform Maintenance Notice"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {/* Message */}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Write the notification body…"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            />
            <p className="text-xs text-slate-400 text-right mt-0.5">{message.length} chars</p>
          </div>

          <Button
            className="w-full"
            icon={<Send className="w-4 h-4" />}
            loading={sending}
            onClick={send}
            disabled={!title || !message}
          >
            Send Notification
          </Button>
        </Card>

        {/* Preview card */}
        <div className="lg:col-span-2 space-y-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Live Preview</p>
          <div className={`rounded-2xl border p-4 ${TYPE_STYLE[type]} border-current/10`}>
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${TYPE_STYLE[type]}`}>
                <TypeIcon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{title || 'Notification Title'}</p>
                <p className="text-xs mt-0.5 opacity-80 leading-relaxed">
                  {message || 'Notification message will appear here…'}
                </p>
                <p className="text-xs mt-2 opacity-60">Just now</p>
              </div>
            </div>
          </div>

          <Card>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Audience</h4>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-slate-700">
                {AUDIENCE_OPTIONS.find((a) => a.value === audience)?.icon && (() => {
                  const Icon = AUDIENCE_OPTIONS.find((a) => a.value === audience)!.icon
                  return <Icon className="w-4 h-4 text-blue-500" />
                })()}
                <span className="font-medium">{AUDIENCE_OPTIONS.find((a) => a.value === audience)?.label}</span>
              </div>
              {audience === 'specific' && specificEmail && (
                <p className="text-xs text-slate-500 ml-6">{specificEmail}</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Notification history */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-900">Notification History</h3>
          <Badge variant="default" size="sm">{history.length} records</Badge>
        </div>

        {loadingHistory ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-10">
            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No notifications sent yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Type', 'Title', 'Message', 'User', 'Read', 'Sent'].map((h) => (
                    <th key={h} className="text-left pb-3 px-2 font-semibold text-slate-400 text-xs uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {history.map((n, i) => {
                  const Icon = TYPE_ICON[n.type] ?? Info
                  return (
                    <motion.tr key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-slate-50">
                      <td className="py-3 px-2">
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_STYLE[n.type]}`}>
                          <Icon className="w-3 h-3" />
                          {n.type}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-medium text-slate-800 max-w-[180px] truncate">{n.title}</td>
                      <td className="py-3 px-2 text-slate-500 max-w-[220px] truncate text-xs">{n.message}</td>
                      <td className="py-3 px-2 font-mono text-slate-400 text-xs">{n.user_id.slice(0, 8)}…</td>
                      <td className="py-3 px-2">
                        <Badge variant={n.is_read ? 'success' : 'default'} size="sm">
                          {n.is_read ? 'Read' : 'Unread'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-slate-400 text-xs whitespace-nowrap">
                        {format(parseISO(n.created_at), 'MMM d, HH:mm')}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
