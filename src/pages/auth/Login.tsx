import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff, AlertTriangle, Clock, TrendingUp, MailCheck, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { useLoginRateLimit } from '@/hooks/useLoginRateLimit'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormData = z.infer<typeof schema>

const TESTIMONIALS = [
  {
    quote: "The platform's execution speed and analytics have completely transformed my trading strategy.",
    name: 'James R.',
    title: 'Professional Trader',
    initials: 'JR',
  },
  {
    quote: "Copy trading on Oakmont Ridge has given me consistent 12% monthly returns with minimal effort.",
    name: 'Sarah M.',
    title: 'Retail Investor',
    initials: 'SM',
  },
  {
    quote: "The transparency and institutional-grade tools are unmatched. Best platform I've ever used.",
    name: 'David K.',
    title: 'Portfolio Manager',
    initials: 'DK',
  },
]

export default function Login() {
  const { signIn, signInWithGoogle, session } = useAuth()
  const { settings: { brand } } = useSiteSettings()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname ?? '/dashboard'
  const prefillEmail = (location.state as any)?.email ?? ''

  // Already logged in → send to dashboard
  useEffect(() => {
    if (session) navigate(from, { replace: true })
  }, [session, from, navigate])

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [lockTimer, setLockTimer] = useState(0)
  const [testimonialIdx] = useState(() => Math.floor(Math.random() * TESTIMONIALS.length))
  const [unverifiedEmail, setUnverifiedEmail] = useState('')
  const [resendingVerification, setResendingVerification] = useState(false)

  const {
    isLocked, remainingSeconds, remainingAttempts,
    recordFailure, recordSuccess, checkLocked,
  } = useLoginRateLimit()

  useEffect(() => {
    if (!isLocked) return
    setLockTimer(remainingSeconds)
    const id = setInterval(() => {
      setLockTimer(t => {
        if (t <= 1) { clearInterval(id); window.location.reload(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [isLocked, remainingSeconds])

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: prefillEmail },
  })

  const resendVerification = async () => {
    if (!unverifiedEmail) return
    setResendingVerification(true)
    try {
      // Use Supabase's native resend — delivered via Supabase's own email service
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: unverifiedEmail,
        options: { emailRedirectTo: `${window.location.origin}/verify-email` },
      })
      if (error) throw error
      toast.success('Verification email sent! Check your inbox.')
    } catch (err: any) {
      toast.error(err.message ?? 'Unable to resend — please try again.')
    } finally {
      setResendingVerification(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    if (checkLocked()) {
      toast.error('Too many failed attempts. Please wait before trying again.')
      return
    }
    setUnverifiedEmail('')
    setLoading(true)
    try {
      await signIn(data.email, data.password)
      recordSuccess()
      toast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (err: any) {
      if ((err as any).code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail((err as any).email ?? data.email)
        // Don't record as a failure — not a wrong password
        return
      }
      const result = recordFailure()
      if (result.locked) {
        toast.error('Too many failed attempts. Account locked for 15 minutes.')
      } else if (result.remaining <= 2) {
        toast.error(`Incorrect credentials. ${result.remaining} attempt${result.remaining === 1 ? '' : 's'} remaining.`)
      } else {
        toast.error(err.message ?? 'Sign in failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err: any) {
      toast.error(err.message ?? 'Google sign in failed')
      setGoogleLoading(false)
    }
  }

  const formatLockTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const testimonial = TESTIMONIALS[testimonialIdx]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row"
        style={{ minHeight: 620 }}
      >
        {/* ── Left panel ─────────────────────────────────────────────── */}
        <div className="lg:w-[44%] bg-[#1E3A8A] flex flex-col p-10">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
              {brand.logo_url ? (
                <img
                  src={brand.logo_url}
                  alt={brand.company_name}
                  className="w-9 h-9 object-contain"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              ) : (
                <TrendingUp className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight group-hover:opacity-80 transition-opacity">
                {brand.company_name.split(' ').slice(0, -1).join(' ')}
              </p>
              <p className="text-blue-200 text-xs">
                {brand.company_name.split(' ').slice(-1)[0]}
              </p>
            </div>
          </Link>

          {/* Headline */}
          <div className="flex-1 flex flex-col justify-center mt-10 lg:mt-0">
            <h2 className="text-white text-3xl font-extrabold leading-tight mb-3">
              Master the<br />Markets
            </h2>
            <p className="text-blue-200 text-sm leading-relaxed">
              Institutional-grade tools and premium copy trading in one platform.
            </p>

            {/* Feature chips */}
            <div className="mt-8 space-y-2.5">
              {[
                '✦  Top-performing copy traders',
                '✦  Real-time portfolio analytics',
                '✦  Bank-level security & KYC',
              ].map(f => (
                <div key={f} className="flex items-center gap-2 text-blue-100 text-sm">
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 mt-8 border border-white/10">
            <div className="text-white/40 text-4xl font-serif leading-none mb-2">"</div>
            <p className="text-white/90 text-sm italic leading-relaxed">
              {testimonial.quote}
            </p>
            <div className="flex items-center gap-3 mt-4">
              <div className="w-8 h-8 rounded-full bg-blue-400/60 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {testimonial.initials}
              </div>
              <div>
                <p className="text-white text-xs font-semibold">{testimonial.name}</p>
                <p className="text-blue-300 text-xs">{testimonial.title}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right panel ────────────────────────────────────────────── */}
        <div className="lg:w-[56%] flex flex-col justify-center px-8 md:px-12 py-10">
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-slate-500 text-sm mt-1 mb-8">
            Sign in to access your dashboard and portfolio.
          </p>

          {/* Email not verified banner */}
          {unverifiedEmail && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4"
            >
              <div className="flex items-start gap-3">
                <MailCheck className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">Email not verified</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Check your inbox for the verification link sent to <strong>{unverifiedEmail}</strong>.
                  </p>
                </div>
              </div>
              <button
                onClick={resendVerification}
                disabled={resendingVerification}
                className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-700 border border-blue-300 rounded-lg py-2 hover:bg-blue-100 transition-colors disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resendingVerification ? 'animate-spin' : ''}`} />
                {resendingVerification ? 'Sending…' : 'Resend verification email'}
              </button>
            </motion.div>
          )}

          {/* Locked state */}
          {isLocked && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-4"
            >
              <Clock className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">Account temporarily locked</p>
                <p className="text-xs text-red-600 mt-0.5">
                  Try again in <span className="font-bold">{formatLockTime(lockTimer)}</span>
                </p>
              </div>
            </motion.div>
          )}

          {!isLocked && remainingAttempts <= 2 && remainingAttempts > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4"
            >
              <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-700">
                {remainingAttempts} sign-in attempt{remainingAttempts === 1 ? '' : 's'} remaining before lockout.
              </p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="investor@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              disabled={isLocked}
              autoComplete="email"
              {...register('email')}
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.password?.message}
              disabled={isLocked}
              autoComplete="current-password"
              {...register('password')}
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-[#1E40AF] focus:ring-[#3B82F6] w-3.5 h-3.5"
                />
                <span className="text-sm text-slate-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-[#1E40AF] hover:underline font-medium">
                Forgot Password?
              </Link>
            </div>

            <Button
              type="submit"
              loading={loading}
              disabled={isLocked}
              className="w-full !rounded-xl"
              size="lg"
            >
              Sign In
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-xs text-slate-400">Or continue with</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            loading={googleLoading}
            disabled={isLocked}
            className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 !rounded-xl"
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            }
          >
            Sign in with Google
          </Button>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#1E40AF] font-semibold hover:underline">
              Create one
            </Link>
          </p>

          <p className="text-center mt-4">
            <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              ← Back to homepage
            </Link>
          </p>
        </div>
      </motion.div>

    </div>
  )
}
