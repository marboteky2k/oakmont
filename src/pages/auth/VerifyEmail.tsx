import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MailCheck, RefreshCw, CheckCircle, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function VerifyEmail() {
  const location = useLocation()
  const navigate = useNavigate()
  const email = (location.state as any)?.email ?? ''
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // Check if user has verified and arrived here via redirect
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
        toast.success('Email verified! Welcome to Oakmont Ridge.')
        navigate('/dashboard')
      }
    })
    return () => subscription.unsubscribe()
  }, [navigate])

  const resendEmail = async () => {
    if (!email || cooldown > 0) return
    setResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      })
      if (error) throw error
      setResent(true)
      setCooldown(60)
      toast.success('Verification email resent!')
      const id = setInterval(() => {
        setCooldown(c => { if (c <= 1) { clearInterval(id); return 0 } return c - 1 })
      }, 1000)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E40AF] via-[#2563eb] to-[#3B82F6] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] px-8 pt-8 pb-10 text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Verify your email</h1>
        </div>

        <div className="px-8 py-8 -mt-4">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
              {resent
                ? <CheckCircle className="w-8 h-8 text-green-500" />
                : <MailCheck className="w-8 h-8 text-[#3B82F6]" />}
            </div>

            <div>
              <p className="font-semibold text-slate-900 text-lg">Check your inbox</p>
              {email && (
                <p className="text-sm text-slate-500 mt-1">
                  We sent a verification link to{' '}
                  <span className="font-medium text-slate-700">{email}</span>
                </p>
              )}
              <p className="text-sm text-slate-500 mt-2">
                Click the link in the email to activate your account.
              </p>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 text-left space-y-1.5">
              {[
                "Check your spam/junk folder",
                "The link expires after 24 hours",
                "Contact support if you don't receive it",
              ].map(tip => (
                <p key={tip} className="text-xs text-slate-600 flex items-start gap-1.5">
                  <span className="text-[#3B82F6] font-bold mt-0.5">·</span> {tip}
                </p>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={resendEmail}
              loading={resending}
              disabled={cooldown > 0}
              className="w-full"
              icon={<RefreshCw className="w-4 h-4" />}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : resent ? 'Resend email' : 'Resend verification email'}
            </Button>

            <p className="text-sm text-slate-500">
              <Link to="/login" className="text-[#1E40AF] font-medium hover:underline">
                Back to Sign In
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
