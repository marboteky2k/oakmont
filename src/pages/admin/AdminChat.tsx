import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  MessageCircle, Send, RefreshCw, Search, CheckCircle,
  User, Headphones, Bot, Trash2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { timeAgo } from '@/lib/utils'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ChatMessage {
  id: string
  user_id: string
  message: string
  is_admin: boolean
  is_ai: boolean
  is_read: boolean
  created_at: string
}

interface Conversation {
  user_id: string
  full_name: string
  email: string
  last_message: string
  last_time: string
  unread_count: number
  total_messages: number
}

export default function AdminChat() {
  const { profile } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadConversations = async () => {
    setLoading(true)
    // Get all chat messages with user info
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        user_id, message, is_admin, is_read, created_at,
        user:users(full_name, email)
      `)
      .order('created_at', { ascending: false })

    if (error) { toast.error(error.message); setLoading(false); return }

    // Group by user_id
    const convMap = new Map<string, Conversation>()
    for (const row of (data ?? []) as any[]) {
      const uid = row.user_id
      if (!convMap.has(uid)) {
        convMap.set(uid, {
          user_id: uid,
          full_name: row.user?.full_name ?? 'Unknown',
          email: row.user?.email ?? '',
          last_message: row.message,
          last_time: row.created_at,
          unread_count: (!row.is_admin && !row.is_read) ? 1 : 0,
          total_messages: 1,
        })
      } else {
        const c = convMap.get(uid)!
        if (!row.is_admin && !row.is_read) c.unread_count++
        c.total_messages++
      }
    }

    setConversations(Array.from(convMap.values()))
    setLoading(false)
  }

  const loadMessages = async (userId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('id, user_id, message, is_admin, is_ai, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    setMessages((data ?? []) as ChatMessage[])

    // Mark user messages as read
    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_admin', false)
      .eq('is_read', false)

    // Update local unread count
    setConversations(prev => prev.map(c =>
      c.user_id === userId ? { ...c, unread_count: 0 } : c
    ))
  }

  useEffect(() => { loadConversations() }, [])

  useEffect(() => {
    if (selectedUserId) loadMessages(selectedUserId)
  }, [selectedUserId])

  // Realtime subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel('admin-chat')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      }, payload => {
        const msg = payload.new as ChatMessage
        // Update conversation list
        setConversations(prev => {
          const existing = prev.find(c => c.user_id === msg.user_id)
          if (existing) {
            return prev.map(c => c.user_id === msg.user_id ? {
              ...c,
              last_message: msg.message,
              last_time: msg.created_at,
              unread_count: (!msg.is_admin && selectedUserId !== msg.user_id) ? c.unread_count + 1 : c.unread_count,
            } : c)
          }
          return prev // new user — reload conversations
        })
        // Append to active chat
        if (msg.user_id === selectedUserId) {
          setMessages(prev => [...prev, msg])
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [selectedUserId])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendReply = async () => {
    const msg = reply.trim()
    if (!msg || !selectedUserId || !profile) return
    setSending(true)
    setReply('')
    const { error } = await supabase.from('chat_messages').insert({
      user_id: selectedUserId,
      message: msg,
      is_admin: true,
      is_read: true,
    })
    if (error) { toast.error(error.message); setReply(msg) }
    setSending(false)
  }

  const deleteMessage = async (messageId: string) => {
    if (!window.confirm('Delete this message?')) return
    const { error } = await supabase.from('chat_messages').delete().eq('id', messageId)
    if (error) { toast.error('Failed to delete message'); return }
    setMessages(prev => prev.filter(m => m.id !== messageId))
    toast.success('Message deleted')
  }

  const filtered = conversations.filter(c =>
    !search ||
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  const selectedConv = conversations.find(c => c.user_id === selectedUserId)

  const formatTime = (ts: string) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live Support Chat</h1>
          <p className="text-sm text-slate-500 mt-1">Respond to user support messages in real time.</p>
        </div>
        <button onClick={loadConversations} className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#1E40AF] transition-colors px-3 py-1.5 rounded-xl border border-slate-200 bg-white">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[680px]">
        {/* Conversation list */}
        <Card padding="none" className="flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search users…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-[#1E40AF] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">No conversations yet</div>
            ) : (
              filtered.map(conv => (
                <button
                  key={conv.user_id}
                  onClick={() => setSelectedUserId(conv.user_id)}
                  className={cn(
                    'w-full text-left px-4 py-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3',
                    selectedUserId === conv.user_id && 'bg-blue-50 border-l-2 border-[#1E40AF]'
                  )}
                >
                  <div className="w-9 h-9 rounded-full bg-[#1E40AF] flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                    {conv.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-semibold text-slate-900 text-sm truncate">{conv.full_name}</p>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">{timeAgo(conv.last_time)}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{conv.last_message}</p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="w-5 h-5 bg-red-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {conv.unread_count}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          <div className="px-4 py-2 border-t border-slate-100 text-xs text-slate-400">
            {filtered.length} conversation{filtered.length !== 1 ? 's' : ''}
          </div>
        </Card>

        {/* Chat thread */}
        <Card padding="none" className="lg:col-span-2 flex flex-col overflow-hidden">
          {!selectedUserId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-[#1E40AF]" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">Select a conversation</h3>
              <p className="text-sm text-slate-500 max-w-xs">
                Choose a user from the left panel to view their messages and send a reply.
              </p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-[#1E40AF] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {selectedConv?.full_name?.charAt(0) ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{selectedConv?.full_name}</p>
                  <p className="text-xs text-slate-400 truncate">{selectedConv?.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 border border-purple-100 px-2 py-1 rounded-full">
                    <Bot className="w-3 h-3" /> AI Active
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Active
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50/40">
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn('flex', msg.is_admin ? 'justify-end items-end gap-2' : 'items-start gap-2')}
                    onMouseEnter={(e) => {
                      if (msg.is_admin) {
                        const btn = e.currentTarget.querySelector('[data-delete-btn]')
                        if (btn) btn.classList.remove('opacity-0', 'pointer-events-none')
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (msg.is_admin) {
                        const btn = e.currentTarget.querySelector('[data-delete-btn]')
                        if (btn) btn.classList.add('opacity-0', 'pointer-events-none')
                      }
                    }}
                  >
                    {!msg.is_admin && (
                      <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                    )}
                    <div className={cn(
                      'max-w-[75%] px-3.5 py-2.5 rounded-2xl',
                      msg.is_admin && msg.is_ai
                        ? 'bg-purple-600 text-white rounded-tr-sm'
                        : msg.is_admin
                        ? 'bg-[#1E40AF] text-white rounded-tr-sm'
                        : 'bg-white border border-slate-100 rounded-tl-sm shadow-sm'
                    )}>
                      {msg.is_admin && msg.is_ai && (
                        <p className="text-[10px] font-semibold text-purple-200 mb-0.5 flex items-center gap-1">
                          <Bot className="w-3 h-3" /> AI Assistant
                        </p>
                      )}
                      <p className={cn('text-sm break-words whitespace-pre-line', msg.is_admin ? 'text-white' : 'text-slate-700')}>
                        {msg.message}
                      </p>
                      <p className={cn('text-[10px] mt-1 text-right', msg.is_admin ? 'text-white/60' : 'text-slate-400')}>
                        {formatTime(msg.created_at)}
                        {msg.is_admin && !msg.is_ai && ' · You'}
                        {msg.is_ai && ' · AI'}
                      </p>
                    </div>
                    {msg.is_admin && (
                      <div className="flex items-center gap-1">
                        <button
                          data-delete-btn
                          onClick={() => deleteMessage(msg.id)}
                          className="opacity-0 pointer-events-none transition-opacity w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-500/20 text-red-500"
                          title="Delete message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                          msg.is_ai ? 'bg-purple-600' : 'bg-[#1E40AF]'
                        )}>
                          {msg.is_ai
                            ? <Bot className="w-3.5 h-3.5 text-white" />
                            : <Headphones className="w-3.5 h-3.5 text-white" />
                          }
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
                {messages.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">No messages yet</div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Reply input */}
              <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-100 bg-white flex-shrink-0">
                <input
                  type="text"
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendReply())}
                  placeholder={`Reply to ${selectedConv?.full_name?.split(' ')[0] ?? 'user'}…`}
                  className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E40AF]/20 focus:border-[#1E40AF]"
                />
                <button
                  onClick={sendReply}
                  disabled={!reply.trim() || sending}
                  className="w-9 h-9 rounded-xl bg-[#1E40AF] flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-blue-700 flex-shrink-0"
                >
                  {sending
                    ? <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                    : <Send className="w-3.5 h-3.5" />
                  }
                </button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
