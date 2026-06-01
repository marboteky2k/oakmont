import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  MessageSquare, Search, Eye, CheckCircle, Clock,
  AlertCircle, XCircle, RefreshCw, Hash, Mail,
  Filter,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Skeleton } from '@/components/ui/Skeleton'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

type Ticket = {
  id: string
  ticket_number: string
  name: string
  email: string
  subject: string | null
  topic: string | null
  message: string
  source: string
  status: string
  reply: string | null
  replied_at: string | null
  created_at: string
}

const STATUS_CONFIG = {
  open:        { label: 'Open',        color: 'bg-blue-100 text-blue-700',   icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700', icon: Clock       },
  resolved:    { label: 'Resolved',    color: 'bg-green-100 text-green-700', icon: CheckCircle },
  closed:      { label: 'Closed',      color: 'bg-slate-100 text-slate-600', icon: XCircle     },
}

export default function AdminSupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<Ticket | null>(null)
  const [reply, setReply] = useState('')
  const [processing, setProcessing] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const loadTickets = async () => {
    setLoading(true)
    let query = supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') query = query.eq('status', statusFilter)

    const { data, error } = await query
    if (error) toast.error('Failed to load tickets')
    else setTickets((data ?? []) as Ticket[])
    setLoading(false)
  }

  useEffect(() => { loadTickets() }, [statusFilter])

  const openTicket = (t: Ticket) => {
    setViewing(t)
    setReply(t.reply ?? '')
  }

  const handleUpdateStatus = async (status: string) => {
    if (!viewing) return
    setProcessing(true)
    try {
      const update: Record<string, unknown> = { status }
      if (reply.trim()) {
        update.reply = reply.trim()
        update.replied_at = new Date().toISOString()
      }
      const { error } = await supabase
        .from('support_tickets')
        .update(update)
        .eq('id', viewing.id)
      if (error) throw error
      toast.success(`Ticket ${viewing.ticket_number} marked as ${status}`)
      setViewing(null)
      loadTickets()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const filtered = tickets.filter(t => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      t.ticket_number.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q) ||
      (t.subject ?? '').toLowerCase().includes(q) ||
      t.message.toLowerCase().includes(q)
    )
  })

  const counts = {
    all:        tickets.length,
    open:       tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved:   tickets.filter(t => t.status === 'resolved').length,
    closed:     tickets.filter(t => t.status === 'closed').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
          <p className="text-slate-500 text-sm mt-1">Manage customer support requests from the Support Center and Contact Us page</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadTickets}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${statusFilter === s ? 'bg-[#1E40AF] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-[#3B82F6]'}`}
          >
            {s === 'all' ? 'All' : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label ?? s}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${statusFilter === s ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {counts[s as keyof typeof counts] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket #, name, email, or message…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-[#3B82F6] transition-colors"
          />
        </div>
      </div>

      {/* Tickets table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                {['Ticket #', 'From', 'Subject / Topic', 'Source', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    No tickets found
                  </td>
                </tr>
              ) : (
                filtered.map(ticket => {
                  const cfg = STATUS_CONFIG[ticket.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.open
                  return (
                    <motion.tr
                      key={ticket.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Hash className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono font-bold text-sm text-[#1E40AF]">{ticket.ticket_number}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-900">{ticket.name}</p>
                        <p className="text-xs text-slate-400">{ticket.email}</p>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-sm text-slate-700 truncate">{ticket.subject || ticket.topic || '—'}</p>
                        <p className="text-xs text-slate-400 truncate">{ticket.message.slice(0, 60)}…</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${ticket.source === 'contact' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {ticket.source === 'contact' ? 'Contact Us' : 'Support'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.color}`}>
                          <cfg.icon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {format(new Date(ticket.created_at), 'MMM d, HH:mm')}
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="outline" size="sm" onClick={() => openTicket(ticket)}>
                          <Eye className="w-3.5 h-3.5" /> View
                        </Button>
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Ticket detail modal */}
      {viewing && (
        <Modal
          isOpen={!!viewing}
          onClose={() => setViewing(null)}
          title={`Ticket ${viewing.ticket_number}`}
          size="lg"
        >
          <div className="space-y-5">
            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">From</p>
                <p className="font-semibold text-slate-900">{viewing.name}</p>
                <a href={`mailto:${viewing.email}`} className="text-[#1E40AF] text-xs hover:underline">{viewing.email}</a>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 mb-1">Subject / Topic</p>
                <p className="font-semibold text-slate-900">{viewing.subject || viewing.topic || '—'}</p>
                <p className="text-xs text-slate-400">{viewing.source === 'contact' ? 'Contact Us page' : 'Support Center'}</p>
              </div>
            </div>

            {/* Message */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Message</p>
              <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {viewing.message}
              </div>
            </div>

            {/* Previous reply */}
            {viewing.reply && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Previous Reply</p>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {viewing.reply}
                </div>
                {viewing.replied_at && (
                  <p className="text-xs text-slate-400 mt-1">Sent {format(new Date(viewing.replied_at), 'MMM d, yyyy HH:mm')}</p>
                )}
              </div>
            )}

            {/* Reply box */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Add / Update Reply Note</p>
              <textarea
                rows={4}
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Type a reply or internal note…"
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 resize-none focus:outline-none focus:border-[#3B82F6] placeholder:text-slate-400 transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {viewing.status !== 'in_progress' && (
                <Button
                  variant="outline"
                  size="sm"
                  loading={processing}
                  onClick={() => handleUpdateStatus('in_progress')}
                >
                  <Clock className="w-3.5 h-3.5" /> Mark In Progress
                </Button>
              )}
              {viewing.status !== 'resolved' && (
                <Button
                  size="sm"
                  loading={processing}
                  onClick={() => handleUpdateStatus('resolved')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Mark Resolved
                </Button>
              )}
              {viewing.status !== 'closed' && (
                <Button
                  variant="outline"
                  size="sm"
                  loading={processing}
                  onClick={() => handleUpdateStatus('closed')}
                  className="text-slate-500"
                >
                  <XCircle className="w-3.5 h-3.5" /> Close Ticket
                </Button>
              )}
              <a href={`mailto:${viewing.email}?subject=Re: ${viewing.ticket_number} — ${viewing.subject || 'Support Request'}`} className="ml-auto">
                <Button variant="outline" size="sm">
                  <Mail className="w-3.5 h-3.5" /> Reply by Email
                </Button>
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
