import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, TrendingUp, ArrowUpFromLine } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { invokeFunction } from '@/lib/functions'
import { Button } from '@/components/ui/Button'

interface WithdrawalDetails {
  amount: number
  currency: string
  address: string
  network?: string
}

export default function VerifyWithdrawal() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'verifying' | 'success' | 'already_verified' | 'error'>('verifying')
  const [errorMsg, setErrorMsg] = useState('')
  const [withdrawal, setWithdrawal] = useState<WithdrawalDetails | null>(null)

  useEffect(() => {
    if (!token) {
      setErrorMsg('No confirmation token found in the link.')
      setStatus('error')
      return
    }

    let cancelled = false
    const verify = async () => {
      try {
        const data = await invokeFunction<{ already_verified?: boolean; withdrawal?: WithdrawalDetails }>('verify-withdrawal-token', { token })
        if (cancelled) return

        if (data?.already_verified) {
          setStatus('already_verified')
          return
        }

        setWithdrawal(data.withdrawal ?? null)
        setStatus('success')
      } catch (err: any) {
        if (!cancelled) {
          setErrorMsg(err.message)
          setStatus('error')
        }
      }
    }

    verify()
    return () => { cancelled = true }
  }, [token])

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
          <h1 className="text-xl font-bold">Withdrawal Confirmation</h1>
          <p className="text-blue-200 text-sm mt-1">Oakmont Ridge Capital</p>
        </div>

        {/* Content */}
        <div className="px-8 py-8 -mt-4">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 text-center space-y-4">

            {/* Verifying */}
            {status === 'verifying' && (
              <>
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
                  <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
                </div>
                <p className="font-semibold text-slate-900 text-lg">Confirming withdrawal…</p>
                <p className="text-sm text-slate-500">Please wait a moment.</p>
              </>
            )}

            {/* Success */}
            {status === 'success' && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-lg">Withdrawal Confirmed!</p>
                  <p className="text-sm text-slate-500 mt-1">Your request has been submitted for processing.</p>
                </div>

                {withdrawal && (
                  <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2 text-sm">
                    {[
                      ['Amount', `${Number(withdrawal.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 })} ${withdrawal.currency}`],
                      ['Currency', withdrawal.currency],
                      ['Destination', withdrawal.address],
                      ...(withdrawal.network ? [['Network', withdrawal.network]] : []),
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3">
                        <span className="text-slate-400">{k}</span>
                        <span className="font-medium text-slate-800 text-right break-all max-w-[220px]">{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-xs text-green-700">
                    Your withdrawal is now pending admin processing. Funds are typically released within <strong>24 hours</strong>.
                  </p>
                </div>

                <Link to="/dashboard">
                  <Button className="w-full">
                    <ArrowUpFromLine className="w-4 h-4" /> Go to Dashboard
                  </Button>
                </Link>
              </motion.div>
            )}

            {/* Already verified */}
            {status === 'already_verified' && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-blue-500" />
                </div>
                <p className="font-semibold text-slate-900 text-lg">Already confirmed</p>
                <p className="text-sm text-slate-500">This withdrawal has already been confirmed and is being processed.</p>
                <Link to="/wallet">
                  <Button variant="outline" className="w-full">View Wallet</Button>
                </Link>
              </motion.div>
            )}

            {/* Error */}
            {status === 'error' && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-lg">Confirmation failed</p>
                  <p className="text-sm text-slate-500 mt-1">{errorMsg}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs text-amber-700">
                    Confirmation links expire after <strong>30 minutes</strong>. If your link expired, submit a new withdrawal request from your wallet.
                  </p>
                </div>
                <Link to="/wallet">
                  <Button className="w-full">Go to Wallet</Button>
                </Link>
              </motion.div>
            )}

          </div>
        </div>
      </motion.div>
    </div>
  )
}
