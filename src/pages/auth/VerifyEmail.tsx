import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MailCheck, RefreshCw, CheckCircle, XCircle, TrendingUp, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

// ── Token-verification mode ───────────────────────────────────────────────
// Shown when the user clicks the link in their email (?token=xxx).
function TokenVerifier({ token }: { token: string }) {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [errorMsg, setErrorMsg] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    let cancelled = false
    const verify = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('verify-email-token', {
          body: { token },
        })
        if (cancelled) return
        if (error || data?.error) throw new Error(data?.error ?? error?.message ?? 'Verification failed')
        setEmail(data.email ?? '')
        setStatus('success')
        toast.success('Email verified! Welcome to Oakmont Ridge Capital.')
        // Redirect to KYC after 2.5 seconds
        setTimeout(() => {
          if (!cancelled) navigate('/kyc', { replace: true })
        }, 2500)
      } catch (err: any) {
        if (!cancelled) {
          setErrorMsg(err.message)
          setStatus('error')
        }
      }
    }
    verify()
    return () => { cancelled = true }
  }, [token, navigate])

  return (
    <div className="text-center space-y-4">
      {status === 'verifying' && (
        <>
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
            <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
          </div>
          <p className="font-semibold text-slate-900 text-lg">Verifying your email…</p>
          <p className="text-sm text-slate-500">Please wait a moment.</p>
        </>
      )}

      {status === 'success' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-lg">Email verified! ✓</p>
            {email && <p className="text-sm text-slate-500 mt-1">{email}</p>}
            <p className="text-sm text-green-600 mt-2 font-medium">Redirecting to identity verification…</p>
          </div>
          <Button className="w-full" onClick={() => navigate('/kyc', { replace: true })}>
            Continue to KYC Verification
          </Button>
        </motion.div>
      )}

      {status === 'error' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-lg">Verification failed</p>
            <p className="text-sm text-slate-500 mt-1">{errorMsg}</p>
          </div>
          <Link to="/verify-email">
            <Button variant="outline" className="w-full">Request a new verification link</Button>
          </Link>
          <Link to="/login" className="block text-sm text-[#1E40AF] hover:underline font-medium">
            Back to Sign In
          </Link>
        </motion.div>
      )}
    </div>
  )
}

// ── Check-inbox mode ──────────────────────────────────────────────────────
// Shown right after registration, no token in URL.
function CheckInbox({ email }: { email: string }) {
  const { profile } = useAuth()
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const resendEmail = async () => {
    if (cooldown > 0) return
    if (!profile) {
      toast.error('Please sign in to resend the verification email.')
      return
    }
    setResending(true)
    try {
      const { data, error } = await supabase.functions.invoke('send-verification')
      if (error || data?.error) throw new Error(data?.error ?? error?.message ?? 'Failed to resend')
      if (data?.already_verified) {
        toast.success('Your email is already verified!')
        return
      }
      setResent(true)
      setCooldown(60)
      toast.success('Verification email resent!')
      const id = setInterval(() => {
        setCooldown(c => { if (c <= 1) { clearInterval(id); return 0 } return c - 1 })
      }, 1000)
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to resend verification email')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
          {resent
            ? <CheckCircle className="w-8 h-8 text-green-500" />
            : <MailCheck className="w-8 h-8 text-[#3B82F6]" />}
        </div>
        <p className="font-semibold text-slate-900 text-lg">Check your inbox</p>
        {email && (
          <p className="text-sm text-slate-500 mt-1">
            A verification link was sent to{' '}
            <span className="font-medium text-slate-700 break-all">{email}</span>
          </p>
        )}
        <p className="text-sm text-slate-500 mt-1.5">
          Click the link in the email to activate your account and proceed to KYC.
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1.5">
        <p className="text-xs font-semibold text-amber-800 mb-2">Tips if you don't see the email:</p>
        {[
          'Check your spam or junk folder',
          'The link expires after 24 hours',
          'Add noreply@oakmontridgecapital.com to your contacts',
          'Contact support if you still don\'t receive it',
        ].map(tip => (
          <p key={tip} className="text-xs text-amber-700 flex items-start gap-1.5">
            <span className="text-amber-500 font-bold mt-0.5">·</span> {tip}
          </p>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={resendEmail}
        loading={resending}
        disabled={cooldown > 0}
        className="w-full"
      >
        <RefreshCw className="w-4 h-4" />
        {cooldown > 0 ? `Resend in ${cooldown}s` : resent ? 'Resend again' : 'Resend verification email'}
      </Button>

      <div className="text-center space-y-2">
        <Link to="/dashboard" className="block text-sm text-slate-500 hover:text-slate-700 transition-colors">
          Continue to dashboard →
        </Link>
        <Link to="/login" className="block text-sm text-[#1E40AF] font-medium hover:underline">
          Back to Sign In
        </Link>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────
export default function VerifyEmail() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const email = (location.state as any)?.email ?? ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E40AF] via-[#2563eb] to-[#3B82F6] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] px-8 pt-8 pb-10 text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold">
            {token ? 'Verifying your email' : 'Verify your email'}
          </h1>
          <p className="text-blue-200 text-sm mt-1">Oakmont Ridge Capital</p>
        </div>

        {/* Content card */}
        <div className="px-8 py-8 -mt-4">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
            {token
              ? <TokenVerifier token={token} />
              : <CheckInbox email={email} />
            }
          </div>
        </div>
      </motion.div>
    </div>
  )
}
