import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, Headphones, ChevronDown, Bot } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { generateAIReply, typingDelay } from '@/lib/aiChat'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  message: string
  is_admin: boolean
  is_ai: boolean
  is_read: boolean
  created_at: string
}

const QUICK_QUESTIONS = [
  'How do I make a deposit?',
  'When will my withdrawal arrive?',
  'How does copy trading work?',
  'I need help with KYC verification',
]

export function ChatWidget() {
  const { profile } = useAuth()
  const { settings } = useSiteSettings()
  const { brand } = settings

  // ── All state & refs ──────────────────────────────────────────
  // MUST be declared unconditionally before any early return.
  const [open, setOpen]             = useState(false)
  const [messages, setMessages]     = useState<Message[]>([])
  const [input, setInput]           = useState('')
  const [sending, setSending]       = useState(false)
  const [isAiTyping, setIsAiTyping] = useState(false)
  const [hasUnread, setHasUnread]   = useState(false)
  const [started, setStarted]       = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  // ── All effects ───────────────────────────────────────────────
  // MUST also be declared unconditionally — effects guard against
  // null profile internally so they're safe to run even before login.

  // Load messages + subscribe to realtime
  useEffect(() => {
    if (!profile) return

    supabase
      .from('chat_messages')
      .select('id, message, is_admin, is_ai, is_read, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => {
        if (!data) return
        setMessages(data as Message[])
        setStarted(data.length > 0)
        setHasUnread(data.some(m => m.is_admin && !m.is_read))
      })

    const channel = supabase
      .channel(`chat:${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `user_id=eq.${profile.id}` },
        payload => {
          const msg = payload.new as Message
          setMessages(prev => [...prev, msg])
          if (msg.is_admin) setHasUnread(true)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [profile?.id])

  // Scroll to bottom on new messages or typing indicator
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isAiTyping])

  // Mark admin messages as read when chat is opened
  useEffect(() => {
    if (!open || !hasUnread || !profile) return
    supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('user_id', profile.id)
      .eq('is_admin', true)
      .eq('is_read', false)
      .then(() => setHasUnread(false))
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Early return AFTER all hooks ──────────────────────────────
  // Placing this guard here (not before the hooks above) ensures React
  // always calls the same number of hooks on every render.
  if (!profile || profile.role === 'super_admin' || profile.role === 'admin') return null

  // ── Handlers (plain functions — not hooks) ────────────────────

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || !profile) return
    setSending(true)
    setInput('')
    setStarted(true)

    const { error } = await supabase.from('chat_messages').insert({
      user_id: profile.id,
      message: msg,
      is_admin: false,
      is_ai: false,
    })
    setSending(false)

    if (error) {
      console.error('Chat error:', error)
      setTimeout(() => inputRef.current?.focus(), 50)
      return
    }

    // AI reply
    const reply = generateAIReply(msg)
    const delay = typingDelay(reply)
    setIsAiTyping(true)
    await new Promise(res => setTimeout(res, delay))
    setIsAiTyping(false)

    const { error: rpcError } = await supabase.rpc('insert_ai_chat_reply', {
      p_user_id: profile.id,
      p_message: reply,
    })
    if (rpcError) console.error('AI reply error:', rpcError)

    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // ── JSX ───────────────────────────────────────────────────────
  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-40">
        <AnimatePresence>
          {!open && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => setOpen(true)}
              className="relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white"
              style={{ backgroundColor: brand.primary_color || '#1E40AF' }}
            >
              <MessageCircle className="w-6 h-6" />
              {hasUnread && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white animate-bounce">
                  !
                </span>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-100"
            style={{ height: 520 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 text-white flex-shrink-0" style={{ backgroundColor: brand.primary_color || '#1E40AF' }}>
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm leading-tight">{brand.company_name} Support</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  <p className="text-xs text-white/80">AI assistant · replies instantly</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/50">
              {/* Welcome message */}
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: brand.primary_color || '#1E40AF' }}>
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm border border-slate-100 max-w-[80%]">
                  <p className="text-xs font-semibold mb-0.5" style={{ color: brand.primary_color || '#1E40AF' }}>
                    AI Assistant
                  </p>
                  <p className="text-sm text-slate-700">
                    Hi {profile.full_name?.split(' ')[0] ?? 'there'}! 👋 How can we help you today?
                  </p>
                </div>
              </div>

              {/* Quick questions */}
              {!started && (
                <div className="space-y-1.5">
                  {QUICK_QUESTIONS.map(q => (
                    <button
                      key={q}
                      onClick={() => sendMessage(q)}
                      className="block w-full text-left text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:text-[#1E40AF] transition-all text-slate-600"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Message list */}
              {messages.map(msg => (
                <div key={msg.id} className={cn('flex', msg.is_admin ? 'items-start gap-2' : 'justify-end')}>
                  {msg.is_admin && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: msg.is_ai ? '#7C3AED' : (brand.primary_color || '#1E40AF') }}>
                      {msg.is_ai
                        ? <Bot className="w-3.5 h-3.5 text-white" />
                        : <Headphones className="w-3.5 h-3.5 text-white" />
                      }
                    </div>
                  )}
                  <div className={cn(
                    'max-w-[78%] px-3.5 py-2.5 rounded-2xl shadow-sm',
                    msg.is_admin
                      ? 'bg-white border border-slate-100 rounded-tl-sm'
                      : 'text-white rounded-tr-sm'
                  )}
                    style={!msg.is_admin ? { backgroundColor: brand.primary_color || '#1E40AF' } : {}}
                  >
                    {msg.is_admin && (
                      <p className="text-xs font-semibold mb-0.5"
                        style={{ color: msg.is_ai ? '#7C3AED' : (brand.primary_color || '#1E40AF') }}>
                        {msg.is_ai ? 'AI Assistant' : 'Support Agent'}
                      </p>
                    )}
                    <p className={cn('text-sm break-words whitespace-pre-line', msg.is_admin ? 'text-slate-700' : 'text-white')}>
                      {msg.message}
                    </p>
                    <p className={cn('text-[10px] mt-1 text-right', msg.is_admin ? 'text-slate-400' : 'text-white/60')}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}

              {/* AI typing indicator */}
              {isAiTyping && (
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-slate-100">
                    <p className="text-xs font-semibold mb-1.5 text-purple-600">AI Assistant</p>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-3 py-3 border-t border-slate-100 bg-white flex-shrink-0">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Type a message…"
                maxLength={500}
                disabled={sending || isAiTyping}
                className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:border-transparent disabled:opacity-60"
                style={{ '--tw-ring-color': brand.primary_color || '#1E40AF' } as any}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || sending || isAiTyping}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                style={{ backgroundColor: brand.primary_color || '#1E40AF' }}
              >
                {sending
                  ? <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                  : <Send className="w-3.5 h-3.5" />
                }
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
