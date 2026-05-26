import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Smartphone, Shield, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { challengeAndVerifyMfa, getMfaFactors } from '@/lib/mfa'
import toast from 'react-hot-toast'

interface MfaChallengeModalProps {
  open: boolean
  onClose: () => void
  onVerified: () => void
  reason?: string
}

export function MfaChallengeModal({ open, onClose, onVerified, reason }: MfaChallengeModalProps) {
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')

  const handleVerify = async () => {
    if (code.length !== 6) { setError('Enter the 6-digit code'); return }
    setVerifying(true)
    setError('')
    try {
      const factors = await getMfaFactors()
      const verified = factors.find(f => f.status === 'verified')
      if (!verified) throw new Error('No MFA factor found')

      await challengeAndVerifyMfa(verified.id, code)
      setCode('')
      onVerified()
    } catch (err: any) {
      setError(err.message?.includes('Invalid') ? 'Incorrect code. Try again.' : err.message)
    } finally {
      setVerifying(false)
    }
  }

  const handleCodeChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 6)
    setCode(cleaned)
    setError('')
    if (cleaned.length === 6) {
      // Auto-submit on 6 digits
      setTimeout(() => {
        const input = document.getElementById('mfa-code-input') as HTMLInputElement | null
        if (input) input.blur()
      }, 50)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1E40AF] to-[#3B82F6] px-6 pt-6 pb-8 text-white text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">Two-Factor Authentication</h3>
              {reason && <p className="text-blue-100 text-sm mt-1">{reason}</p>}
            </div>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/15 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="px-6 py-6 -mt-2">
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-slate-600 text-sm mb-4">
                  <Smartphone className="w-4 h-4 text-[#3B82F6]" />
                  Open your authenticator app and enter the 6-digit code.
                </div>

                {/* Code input — large digit display */}
                <div className="relative mb-4">
                  <input
                    id="mfa-code-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    value={code}
                    onChange={e => handleCodeChange(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && code.length === 6 && handleVerify()}
                    maxLength={6}
                    className="sr-only"
                  />
                  <div
                    className="flex gap-2 justify-center cursor-text"
                    onClick={() => document.getElementById('mfa-code-input')?.focus()}
                  >
                    {Array.from({ length: 6 }, (_, i) => (
                      <div
                        key={i}
                        className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all ${
                          i === code.length
                            ? 'border-[#3B82F6] bg-blue-50'
                            : code[i]
                            ? 'border-slate-300 bg-slate-50'
                            : 'border-slate-200'
                        }`}
                      >
                        {code[i] ?? ''}
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-500 text-center mb-3"
                  >
                    {error}
                  </motion.p>
                )}

                <Button
                  onClick={handleVerify}
                  loading={verifying}
                  disabled={code.length !== 6}
                  className="w-full"
                  size="lg"
                >
                  <Shield className="w-4 h-4" /> Verify
                </Button>

                <p className="text-xs text-slate-400 text-center mt-3">
                  Having trouble? Make sure your device time is synchronized.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
