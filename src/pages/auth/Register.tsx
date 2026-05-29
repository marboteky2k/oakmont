import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User, Mail, Lock, Eye, EyeOff, Phone, CheckCircle, TrendingUp,
  Globe, ChevronRight, ChevronLeft, Shield, Info, BarChart3, Target,
  RefreshCw,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useSiteSettings } from '@/contexts/SiteSettingsContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

// ─── Zod schemas ─────────────────────────────────────────────
const step1Schema = z.object({
  fullName: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(7, 'Enter a valid phone number'),
})
const step2Schema = z.object({
  country: z.string().min(1, 'Please select your country'),
  experience: z.string().min(1, 'Please select your experience level'),
  goals: z.string().min(1, 'Please select your primary goal'),
  assets: z.string().min(1, 'Please select your primary interest'),
})
const step3Schema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
  mathAnswer: z.string().min(1, 'Please answer the security question'),
  agreeTerms: z.boolean().refine(v => v, 'You must accept the terms'),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>
type Step3Data = z.infer<typeof step3Schema>

// ─── Static data ─────────────────────────────────────────────
const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Argentina','Australia','Austria','Bangladesh',
  'Belgium','Brazil','Canada','Chile','China','Colombia','Czech Republic','Denmark',
  'Egypt','Ethiopia','Finland','France','Germany','Ghana','Greece','Hong Kong',
  'Hungary','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Japan',
  'Jordan','Kenya','Kuwait','Malaysia','Mexico','Morocco','Netherlands','New Zealand',
  'Nigeria','Norway','Pakistan','Philippines','Poland','Portugal','Qatar','Romania',
  'Russia','Saudi Arabia','Singapore','South Africa','South Korea','Spain','Sweden',
  'Switzerland','Taiwan','Thailand','Turkey','UAE','Uganda','Ukraine',
  'United Kingdom','United States','Vietnam','Zimbabwe',
]

const EXPERIENCE_OPTIONS = [
  { value: 'experienced', label: 'Yes, I have experience with stocks, forex and crypto trading' },
  { value: 'some',        label: 'I have some experience with stocks, forex and crypto trading' },
  { value: 'novice',      label: 'I am a complete novice in stocks, forex and crypto trading' },
]

const GOAL_OPTIONS = [
  'Build long-term wealth',
  'Generate passive income',
  'Save for retirement',
  'Short-term trading profits',
  'Diversify my portfolio',
  'Protect against inflation',
  'Fund a major purchase',
]

const ASSET_OPTIONS = [
  'Cryptocurrencies (BTC, ETH, etc.)',
  'Forex / Currency pairs',
  'Stocks & Equities',
  'Commodities (Gold, Oil, etc.)',
  'ETFs & Index Funds',
  'Copy Trading',
  'Automated / Bot Trading',
]

const PASSWORD_REQS = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter',  test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number',            test: (p: string) => /[0-9]/.test(p) },
]

function generateMath() {
  const ops = ['+', '-', '×'] as const
  const op = ops[Math.floor(Math.random() * ops.length)]
  let a = Math.floor(Math.random() * 12) + 1
  let b = Math.floor(Math.random() * 12) + 1
  if (op === '-' && b > a) [a, b] = [b, a]
  const answer = op === '+' ? a + b : op === '-' ? a - b : a * b
  return { question: `${a} ${op} ${b} = ?`, answer: String(answer) }
}

const STEPS = [
  { label: 'Personal Info', icon: User },
  { label: 'Preferences',   icon: Target },
  { label: 'Security',      icon: Shield },
]

const PANEL_CONTENT = [
  {
    headline: 'Welcome to\nOakmont Ridge',
    sub: 'Create your investor profile in 3 simple steps and start your journey.',
    step: 'Step 1 of 3 — Personal Information',
  },
  {
    headline: 'Tailor Your\nExperience',
    sub: 'We use your preferences to match you with the best strategies and tools.',
    step: 'Step 2 of 3 — Preferences & Goals',
  },
  {
    headline: 'Secure Your\nAccount',
    sub: 'Your password and security settings keep your investments safe 24/7.',
    step: 'Step 3 of 3 — Password & Verification',
  },
]

// ─── Select field wrapper ─────────────────────────────────────
function SelectField({
  label, icon: Icon, error, children, ...rest
}: {
  label: string; icon: React.ElementType; error?: string; children: React.ReactNode
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <select
          {...rest}
          className={`w-full pl-9 pr-8 py-2.5 border rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors appearance-none ${
            error ? 'border-red-400 focus:ring-red-400' : 'border-slate-200 focus:ring-[#3B82F6] focus:border-transparent'
          }`}
        >
          {children}
        </select>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}

export default function Register() {
  const { signUp, signIn, session } = useAuth()
  const { settings: { brand } } = useSiteSettings()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const refCode = searchParams.get('ref') ?? ''

  useEffect(() => {
    if (session) navigate('/dashboard', { replace: true })
  }, [session, navigate])

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [watchedPassword, setWatchedPassword] = useState('')
  const [math, setMath] = useState(generateMath)

  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null)

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) })
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) })
  const form3 = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: { referralCode: refCode },
  })

  const onStep1 = (data: Step1Data) => { setStep1Data(data); setStep(2) }
  const onStep2 = (data: Step2Data) => { setStep2Data(data); setStep(3) }

  const onStep3 = async (data: Step3Data) => {
    if (data.mathAnswer.trim() !== math.answer) {
      toast.error('Incorrect answer — please try again')
      setMath(generateMath())
      form3.setValue('mathAnswer', '')
      return
    }
    if (!step1Data || !step2Data) return
    setLoading(true)
    try {
      await signUp(step1Data.email, data.password, step1Data.fullName, {
        phone: step1Data.phone,
        country: step2Data.country,
        referralCode: data.referralCode,
        investmentExperience: step2Data.experience,
        investmentGoals: step2Data.goals,
        assetInterests: step2Data.assets,
      })

      // Auto sign-in so the user is authenticated before we send the verification email.
      // The DB trigger auto-confirms the auth session so signIn works right away.
      try {
        await signIn(step1Data.email, data.password)
        // Send the Resend verification email (requires auth JWT)
        supabase.functions.invoke('send-verification').catch(() => {})
        toast.success('Account created! Check your email to verify your address.')
        navigate('/verify-email', { state: { email: step1Data.email } })
      } catch {
        // Sign-in failed for some transient reason — send to login as fallback.
        toast.success('Account created! Sign in to continue.')
        navigate('/login', { state: { email: step1Data.email } })
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const panel = PANEL_CONTENT[step - 1]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 flex items-center justify-center p-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row"
      >
        {/* ── Left panel ─────────────────────────────────────────────── */}
        <div className="lg:w-[38%] bg-[#1E3A8A] flex flex-col p-10 flex-shrink-0">
          <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center overflow-hidden flex-shrink-0">
              {brand.logo_url ? (
                <img src={brand.logo_url} alt={brand.company_name} className="w-9 h-9 object-contain"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              ) : (
                <TrendingUp className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight group-hover:opacity-80 transition-opacity">
                {brand.company_name.split(' ').slice(0, -1).join(' ')}
              </p>
              <p className="text-blue-200 text-xs">{brand.company_name.split(' ').slice(-1)[0]}</p>
            </div>
          </Link>

          {/* Step indicators */}
          <div className="mt-10 flex flex-col gap-2.5">
            {STEPS.map((s, i) => {
              const idx = i + 1
              const done = step > idx
              const active = step === idx
              return (
                <div key={s.label} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${active ? 'bg-white/15' : done ? 'opacity-80' : 'opacity-40'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold transition-all text-xs ${
                    done ? 'bg-green-400 text-white' : active ? 'bg-white text-[#1E3A8A]' : 'bg-white/20 text-white'
                  }`}>
                    {done ? <CheckCircle className="w-4 h-4" /> : idx}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-tight">{s.label}</p>
                    {active && <p className="text-blue-300 text-xs mt-0.5">{panel.step}</p>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Animated headline */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="mt-auto pt-10"
            >
              <h2 className="text-white text-2xl font-extrabold leading-tight mb-2 whitespace-pre-line">{panel.headline}</h2>
              <p className="text-blue-200 text-sm leading-relaxed">{panel.sub}</p>
            </motion.div>
          </AnimatePresence>

          {/* Progress bar */}
          <div className="mt-8">
            <div className="flex justify-between text-blue-300 text-xs mb-1.5">
              <span>Progress</span><span>{Math.round((step / 3) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                animate={{ width: `${(step / 3) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </div>

        {/* ── Right panel ────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-center px-8 md:px-12 py-10 overflow-y-auto max-h-screen">
          <AnimatePresence mode="wait">

            {/* ── STEP 1 — Personal Info ── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                <h1 className="text-2xl font-bold text-slate-900">Personal Information</h1>
                <p className="text-slate-500 text-sm mt-1 mb-6">Tell us about yourself to get started.</p>

                <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-4">
                  <Input
                    label="Full Name *"
                    placeholder="John Doe"
                    leftIcon={<User className="w-4 h-4" />}
                    error={form1.formState.errors.fullName?.message}
                    autoComplete="name"
                    {...form1.register('fullName')}
                  />
                  <Input
                    label="Email Address *"
                    type="email"
                    placeholder="your.email@example.com"
                    leftIcon={<Mail className="w-4 h-4" />}
                    error={form1.formState.errors.email?.message}
                    autoComplete="email"
                    {...form1.register('email')}
                  />
                  <Input
                    label="Phone Number *"
                    type="tel"
                    placeholder="+1 (555) 123-0000"
                    leftIcon={<Phone className="w-4 h-4" />}
                    error={form1.formState.errors.phone?.message}
                    autoComplete="tel"
                    {...form1.register('phone')}
                  />

                  <Button type="submit" className="w-full !rounded-xl mt-2" size="lg">
                    Continue <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </form>

                <p className="text-center text-sm text-slate-500 mt-5">
                  Already have an account?{' '}
                  <Link to="/login" className="text-[#1E40AF] font-semibold hover:underline">Sign in</Link>
                </p>
                <p className="text-center mt-3">
                  <Link to="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">← Back to homepage</Link>
                </p>
              </motion.div>
            )}

            {/* ── STEP 2 — Preferences ── */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                <h1 className="text-2xl font-bold text-slate-900">Preferences &amp; Goals</h1>
                <p className="text-slate-500 text-sm mt-1 mb-5">Help us personalise your experience.</p>

                <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-4">
                  <SelectField
                    label="Country *"
                    icon={Globe}
                    error={form2.formState.errors.country?.message}
                    defaultValue=""
                    {...form2.register('country')}
                  >
                    <option value="" disabled>Select your country</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </SelectField>

                  {/* Experience — radio cards */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Have you invested before? <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                      {EXPERIENCE_OPTIONS.map(opt => (
                        <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          form2.watch('experience') === opt.value
                            ? 'border-[#1E40AF] bg-blue-50 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}>
                          <input
                            type="radio"
                            value={opt.value}
                            {...form2.register('experience')}
                            className="mt-0.5 accent-[#1E40AF] flex-shrink-0"
                          />
                          <span className="text-sm text-slate-700 leading-snug">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                    {form2.formState.errors.experience && (
                      <p className="text-xs text-red-500 mt-1">{form2.formState.errors.experience.message}</p>
                    )}
                  </div>

                  <SelectField
                    label="Why do you want to invest? *"
                    icon={Target}
                    error={form2.formState.errors.goals?.message}
                    defaultValue=""
                    {...form2.register('goals')}
                  >
                    <option value="" disabled>Select your primary goal</option>
                    {GOAL_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </SelectField>

                  <SelectField
                    label="Which asset classes interest you most? *"
                    icon={BarChart3}
                    error={form2.formState.errors.assets?.message}
                    defaultValue=""
                    {...form2.register('assets')}
                  >
                    <option value="" disabled>Select your primary interest</option>
                    {ASSET_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                  </SelectField>

                  {/* Info banner */}
                  <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3.5">
                    <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-blue-800">Regional &amp; Preference Information</p>
                      <p className="text-xs text-blue-600 mt-0.5 leading-relaxed">
                        Your location and preferences help us tailor features, ensure compliance, and provide optimal trading conditions.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-1">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 !rounded-xl">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <Button type="submit" className="flex-1 !rounded-xl" size="lg">
                      Continue <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── STEP 3 — Password + Math captcha ── */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
                <h1 className="text-2xl font-bold text-slate-900">Password &amp; Security</h1>
                <p className="text-slate-500 text-sm mt-1 mb-5">Create a strong password and verify you're human.</p>

                <form onSubmit={form3.handleSubmit(onStep3)} className="space-y-4">
                  {/* Password */}
                  <div className="space-y-1.5">
                    <Input
                      label="Password *"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      leftIcon={<Lock className="w-4 h-4" />}
                      rightIcon={
                        <button type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                      error={form3.formState.errors.password?.message}
                      autoComplete="new-password"
                      {...form3.register('password', { onChange: e => setWatchedPassword(e.target.value) })}
                    />
                    {watchedPassword.length > 0 && (
                      <div className="flex gap-3 flex-wrap">
                        {PASSWORD_REQS.map(req => {
                          const met = req.test(watchedPassword)
                          return (
                            <span key={req.label} className={`flex items-center gap-1 text-xs ${met ? 'text-green-600' : 'text-slate-400'}`}>
                              <CheckCircle className={`w-3 h-3 ${met ? 'text-green-500' : 'text-slate-300'}`} />
                              {req.label}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  <Input
                    label="Confirm Password *"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    leftIcon={<Lock className="w-4 h-4" />}
                    error={form3.formState.errors.confirmPassword?.message}
                    autoComplete="new-password"
                    {...form3.register('confirmPassword')}
                  />

                  {/* Referral code */}
                  {refCode ? (
                    <Input label="Referral Code" value={refCode} disabled hint="Referral code applied" {...form3.register('referralCode')} />
                  ) : (
                    <Input label="Referral Code (optional)" placeholder="Enter referral code" {...form3.register('referralCode')} />
                  )}

                  {/* Math CAPTCHA */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-slate-700">
                        Security Verification <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => { setMath(generateMath()); form3.setValue('mathAnswer', '') }}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-[#1E40AF] transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" /> New question
                      </button>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 font-mono font-bold text-slate-900 text-lg text-center select-none tracking-wider">
                        {math.question}
                      </div>
                      <div className="w-28 flex-shrink-0">
                        <Input
                          placeholder="Answer"
                          type="number"
                          error={form3.formState.errors.mathAnswer?.message}
                          {...form3.register('mathAnswer')}
                        />
                      </div>
                    </div>
                    {form3.formState.errors.mathAnswer && (
                      <p className="text-xs text-red-500 mt-1">{form3.formState.errors.mathAnswer.message}</p>
                    )}
                  </div>

                  {/* Terms */}
                  <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded border-slate-300 text-[#1E40AF] focus:ring-[#3B82F6] w-3.5 h-3.5 flex-shrink-0"
                      {...form3.register('agreeTerms')}
                    />
                    <span className="text-xs text-slate-600 leading-relaxed">
                      I agree to the{' '}
                      <Link to="/terms" target="_blank" className="text-[#1E40AF] underline">Terms of Service</Link>{' '}
                      and{' '}
                      <Link to="/privacy" target="_blank" className="text-[#1E40AF] underline">Privacy Policy</Link>
                    </span>
                  </label>
                  {form3.formState.errors.agreeTerms && (
                    <p className="text-xs text-red-500">{form3.formState.errors.agreeTerms.message}</p>
                  )}

                  <div className="flex gap-3 pt-1">
                    <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 !rounded-xl">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <Button type="submit" loading={loading} className="flex-1 !rounded-xl" size="lg">
                      Create Account
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
