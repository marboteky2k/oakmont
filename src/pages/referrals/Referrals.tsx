import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Gift, Copy, CheckCircle, Users, DollarSign, Share2, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

interface ReferredUser {
  id: string
  full_name: string
  created_at: string
  kyc_status: string
}

const commissionSteps = [
  { step: '1', title: 'Share your link', desc: 'Send your unique referral link to friends and contacts via any channel.' },
  { step: '2', title: 'They register & deposit', desc: 'Your referral creates an account and makes their first deposit.' },
  { step: '3', title: 'You earn 5%', desc: 'You automatically receive 5% commission credited to your wallet — instantly.' },
]

export default function Referrals() {
  const { profile } = useAuth()
  const [copied, setCopied] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [referrals, setReferrals] = useState<ReferredUser[]>([])
  const [loading, setLoading] = useState(true)

  const referralLink = `${window.location.origin}/register?ref=${profile?.referral_code ?? ''}`
  const earnings = (profile as any)?.referral_earnings ?? 0

  useEffect(() => {
    if (!profile?.referral_code) { setLoading(false); return }
    supabase.from('users' as any)
      .select('id, full_name, created_at, kyc_status')
      .eq('referred_by', profile.id)   // referred_by stores the referrer's UUID
      .order('created_at', { ascending: false })
      .then(({ data }: { data: any }) => {
        setReferrals(data ?? [])
        setLoading(false)
      })
  }, [profile])

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
    toast.success('Referral link copied!')
  }

  const copyCode = () => {
    if (!profile?.referral_code) return
    navigator.clipboard.writeText(profile.referral_code)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2500)
    toast.success('Referral code copied!')
  }

  const share = (platform: 'whatsapp' | 'telegram' | 'twitter') => {
    const text = `Join Oakmont Ridge Capital — professional forex copy trading & crypto investments. Use my referral link:`
    const urls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${referralLink}`)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${text} ${referralLink}`)}`,
    }
    window.open(urls[platform], '_blank')
  }

  const maskName = (name: string) => {
    if (!name) return '***'
    const parts = name.trim().split(' ')
    return parts.map((p, i) => i === 0 ? p.charAt(0) + '***' : p.charAt(0) + '**').join(' ')
  }

  const statCards = [
    { icon: Users, color: 'bg-blue-100 text-blue-600', value: referrals.length.toString(), label: 'Total Referred' },
    { icon: DollarSign, color: 'bg-green-100 text-green-600', value: formatCurrency(earnings), label: 'Total Earned' },
    { icon: Gift, color: 'bg-purple-100 text-purple-600', value: '5%', label: 'Commission Rate' },
    { icon: TrendingUp, color: 'bg-orange-100 text-orange-600', value: referrals.filter(r => r.kyc_status === 'verified').length.toString(), label: 'Verified Referrals' },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Referral Program</h1>
        <p className="text-slate-500 text-sm mt-1">Invite friends and earn 5% commission on their first deposit — credited instantly.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <Card className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl ${card.color} flex items-center justify-center flex-shrink-0`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-black text-slate-900 truncate">{card.value}</p>
                <p className="text-xs text-slate-500 truncate">{card.label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Referral link card */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <Share2 className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Your Referral Link</h3>
            <p className="text-xs text-slate-500">Share this link to earn commissions</p>
          </div>
        </div>

        {/* Link display */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-3">
          <span className="flex-1 text-sm text-slate-700 truncate font-mono">{referralLink}</span>
          <button
            onClick={copyLink}
            className="flex-shrink-0 text-[#3B82F6] hover:text-[#1E40AF] transition-colors p-0.5"
            title="Copy link"
          >
            {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        {/* Code display */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs text-slate-500">Referral code:</span>
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1">
            <code className="text-sm font-mono font-bold text-[#1E40AF]">{profile?.referral_code ?? '—'}</code>
            <button onClick={copyCode} className="text-blue-400 hover:text-blue-600 transition-colors">
              {codeCopied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Share buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => share('whatsapp')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[#25D366] text-white hover:bg-[#1ebe5a] transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12 2C6.486 2 2 6.486 2 12c0 1.86.5 3.604 1.37 5.115L2 22l4.984-1.305A9.937 9.937 0 0 0 12 22c5.514 0 10-4.486 10-10S17.514 2 12 2"/>
            </svg>
            WhatsApp
          </button>
          <button
            onClick={() => share('telegram')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[#2AABEE] text-white hover:bg-[#1d9bd6] transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Telegram
          </button>
          <button
            onClick={() => share('twitter')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-slate-900 text-white hover:bg-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            Twitter / X
          </button>
          <Button onClick={copyLink} size="sm" icon={<Copy className="w-4 h-4" />} variant="outline">
            Copy Link
          </Button>
        </div>
      </Card>

      {/* How it works */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-5">How it works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {commissionSteps.map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] text-white text-sm font-bold flex items-center justify-center flex-shrink-0 shadow-sm">
                {item.step}
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm mb-1">{item.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-5 pt-5 border-t border-slate-100 bg-blue-50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#1E40AF] flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1E40AF]">Commission Details</p>
              <p className="text-xs text-slate-600 mt-0.5">
                You earn <strong>5% of your referral's first deposit</strong>, credited automatically to your wallet.
                No minimum threshold — all commissions are paid immediately on confirmation.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Referrals table */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-slate-900">Your Referrals</h3>
          <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
            {referrals.length} total
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-14">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Gift className="w-7 h-7 text-slate-400" />
            </div>
            <p className="font-medium text-slate-700 mb-1">No referrals yet</p>
            <p className="text-slate-400 text-sm">Share your link above to start earning commissions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left pb-3 font-semibold text-slate-500 text-xs uppercase tracking-wide pr-4 pl-1">User</th>
                  <th className="text-left pb-3 font-semibold text-slate-500 text-xs uppercase tracking-wide pr-4">Date Joined</th>
                  <th className="text-left pb-3 font-semibold text-slate-500 text-xs uppercase tracking-wide pr-4">KYC</th>
                  <th className="text-right pb-3 font-semibold text-slate-500 text-xs uppercase tracking-wide pr-1">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {referrals.map((ref, i) => (
                  <motion.tr
                    key={ref.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <td className="py-3 pr-4 pl-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                          {ref.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                        <span className="font-medium text-slate-700">{maskName(ref.full_name ?? 'Unknown')}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-500">
                      {new Date(ref.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        ref.kyc_status === 'verified'
                          ? 'bg-green-100 text-green-700'
                          : ref.kyc_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {ref.kyc_status === 'verified' ? '✓ Verified' : ref.kyc_status === 'pending' ? 'Pending' : 'Unverified'}
                      </span>
                    </td>
                    <td className="py-3 text-right pr-1">
                      <span className={`font-semibold ${ref.kyc_status === 'verified' ? 'text-green-600' : 'text-slate-400'}`}>
                        {ref.kyc_status === 'verified' ? '5% paid' : 'Pending KYC'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
