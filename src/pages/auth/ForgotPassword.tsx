import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { TrendingUp, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})
type FormData = z.infer<typeof schema>

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const { data: result, error } = await supabase.functions.invoke('send-password-reset', {
        body: { email: data.email },
      })
      if (error) throw error
      if (result?.error) throw new Error(result.error)
      setSent(true)
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1E40AF] via-[#2563eb] to-[#3B82F6] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] px-8 pt-8 pb-10 text-white text-center">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Reset password</h1>
            <p className="text-blue-100 text-sm mt-1">We'll send you a secure reset link</p>
          </div>

          <div className="px-8 py-8 -mt-4">
            {sent ? (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Reset link sent!</p>
                  <p className="text-sm text-slate-500 mt-1">
                    Check your inbox at <span className="font-medium text-slate-700">{getValues('email')}</span>
                  </p>
                </div>
                <Link to="/login">
                  <Button variant="outline" className="w-full" icon={<ArrowLeft className="w-4 h-4" />}>
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                <p className="text-sm text-slate-600 mb-4">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    leftIcon={<Mail className="w-4 h-4" />}
                    error={errors.email?.message}
                    autoComplete="email"
                    {...register('email')}
                  />
                  <Button type="submit" loading={loading} className="w-full" size="lg">
                    Send Reset Link
                  </Button>
                </form>
                <p className="text-center text-sm text-slate-500 mt-4">
                  <Link to="/login" className="text-[#1E40AF] hover:underline inline-flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" /> Back to Sign In
                  </Link>
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
