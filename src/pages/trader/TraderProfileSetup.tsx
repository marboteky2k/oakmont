import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { motion } from 'framer-motion'
import {
  User, Camera, Save, Shield, Award, TrendingUp, Users, CheckCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useTraderProfile } from '@/hooks/useTraderProfile'
import { useAuth } from '@/contexts/AuthContext'
import { getRiskColor } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { TradingStyle, RiskLevel } from '@/types/database'

const STYLES: { value: TradingStyle; label: string }[] = [
  { value: 'scalping', label: 'Scalping' },
  { value: 'swing', label: 'Swing' },
  { value: 'day_trading', label: 'Day Trading' },
  { value: 'position', label: 'Position' },
]

const RISKS: { value: RiskLevel; label: string; desc: string }[] = [
  { value: 'low', label: 'Low', desc: '< 5% drawdown target' },
  { value: 'medium', label: 'Medium', desc: '5–15% drawdown range' },
  { value: 'high', label: 'High', desc: '> 15% drawdown possible' },
]

interface FormState {
  display_name: string
  bio: string
  trading_style: TradingStyle
  risk_level: RiskLevel
  performance_fee: number
  min_copy_amount: number
}

export default function TraderProfileSetup() {
  const { trader, loading: traderLoading, refresh } = useTraderProfile()
  const { profile } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormState>({
    display_name: '',
    bio: '',
    trading_style: 'swing',
    risk_level: 'medium',
    performance_fee: 10,
    min_copy_amount: 100,
  })
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>()
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [isNew, setIsNew] = useState(false)

  // Populate form from trader
  useEffect(() => {
    if (trader) {
      setForm({
        display_name: trader.display_name ?? '',
        bio: trader.bio ?? '',
        trading_style: trader.trading_style ?? 'swing',
        risk_level: trader.risk_level ?? 'medium',
        performance_fee: trader.performance_fee ?? 10,
        min_copy_amount: trader.min_copy_amount ?? 100,
      })
      setAvatarUrl(trader.avatar_url)
      setIsNew(false)
    } else if (!traderLoading) {
      setIsNew(true)
      // Default display name from user profile
      setForm((f) => ({ ...f, display_name: profile?.full_name ?? '' }))
    }
  }, [trader, traderLoading, profile])

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2 MB.')
      return
    }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `traders/${profile.id}/avatar.${ext}`
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (upErr) {
      toast.error('Upload failed: ' + upErr.message)
      setUploading(false)
      return
    }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    setAvatarUrl(urlData.publicUrl)
    setUploading(false)
    toast.success('Avatar updated.')
  }

  const handleSave = async () => {
    if (!profile) return
    if (!form.display_name.trim()) {
      toast.error('Display name is required.')
      return
    }
    if (form.performance_fee < 0 || form.performance_fee > 50) {
      toast.error('Performance fee must be between 0% and 50%.')
      return
    }
    if (form.min_copy_amount < 10) {
      toast.error('Minimum copy amount must be at least $10.')
      return
    }
    setSaving(true)
    const payload = {
      ...form,
      user_id: profile.id,
      avatar_url: avatarUrl ?? null,
    }

    let error
    if (isNew || !trader) {
      ;({ error } = await supabase.from('copy_traders').insert(payload))
    } else {
      ;({ error } = await supabase
        .from('copy_traders')
        .update(payload)
        .eq('id', trader.id))
    }

    setSaving(false)
    if (error) {
      toast.error('Failed to save: ' + error.message)
      return
    }
    toast.success(isNew ? 'Trader profile created!' : 'Profile updated successfully.')
    await refresh()
    setIsNew(false)
  }

  if (traderLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[640px] bg-slate-100 rounded-2xl animate-pulse" />
        <div className="h-[640px] bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {isNew ? 'Create Trader Profile' : 'Profile Setup'}
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {isNew
            ? 'Set up your public profile to start accepting copy investors.'
            : 'Update your public profile — changes are visible to investors immediately.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Edit form */}
        <Card className="space-y-5">
          <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-3">Profile Details</h3>

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="avatar"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-100"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-500" />
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[#1E40AF] hover:bg-[#1d3a9e] flex items-center justify-center text-white shadow-md transition-colors"
              >
                {uploading ? (
                  <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">Profile photo</p>
              <p className="text-xs text-slate-400">JPG, PNG or WebP · max 2 MB</p>
              <button onClick={() => fileRef.current?.click()} className="text-xs text-blue-600 hover:text-blue-800 mt-1 font-medium">
                Change photo
              </button>
            </div>
          </div>

          {/* Display name */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Display Name *</label>
            <input
              type="text"
              value={form.display_name}
              onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              placeholder="e.g. Alex Morgan FX"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={3}
              placeholder="Tell investors about your trading background, strategy and experience…"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            />
            <p className="text-xs text-slate-400 text-right mt-0.5">{form.bio.length}/300</p>
          </div>

          {/* Trading style */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-2 block">Trading Style</label>
            <div className="grid grid-cols-2 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setForm((f) => ({ ...f, trading_style: s.value }))}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                    form.trading_style === s.value
                      ? 'border-[#1E40AF] bg-blue-50 text-[#1E40AF]'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Risk level */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-2 block">Risk Level</label>
            <div className="grid grid-cols-3 gap-2">
              {RISKS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setForm((f) => ({ ...f, risk_level: r.value }))}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border transition-all text-left ${
                    form.risk_level === r.value
                      ? 'border-[#1E40AF] bg-blue-50 text-[#1E40AF]'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className="block font-semibold">{r.label}</span>
                  <span className="text-xs opacity-70">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Fee + Min amount */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Performance Fee (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={50}
                  step={0.5}
                  value={form.performance_fee}
                  onChange={(e) => setForm((f) => ({ ...f, performance_fee: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">0%–50%</p>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Min Copy Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  min={10}
                  step={10}
                  value={form.min_copy_amount}
                  onChange={(e) => setForm((f) => ({ ...f, min_copy_amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pl-7 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Min $10</p>
            </div>
          </div>

          <Button className="w-full" icon={<Save className="w-4 h-4" />} loading={saving} onClick={handleSave}>
            {isNew ? 'Create Profile' : 'Save Changes'}
          </Button>
        </Card>

        {/* Live preview card */}
        <div className="sticky top-6">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Live Preview</p>
          <motion.div
            layout
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            {/* Card header */}
            <div className="bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] p-6">
              <div className="flex items-center gap-4">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="avatar"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white/30"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                    <User className="w-8 h-8 text-white/70" />
                  </div>
                )}
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight">
                    {form.display_name || 'Your Name'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full capitalize">
                      {form.trading_style.replace('_', ' ')}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRiskColor(form.risk_level)}`}>
                      {form.risk_level} risk
                    </span>
                  </div>
                </div>
              </div>
              {form.bio && (
                <p className="text-blue-100 text-xs mt-4 leading-relaxed line-clamp-3">
                  {form.bio}
                </p>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-px bg-slate-100">
              {[
                { label: 'Monthly ROI', value: `${trader?.monthly_return_pct?.toFixed(2) ?? '—'}%`, icon: TrendingUp, color: 'text-green-600' },
                { label: 'Win Rate', value: `${trader?.win_rate?.toFixed(1) ?? '—'}%`, icon: Award, color: 'text-blue-600' },
                { label: 'Followers', value: trader?.followers_count?.toString() ?? '0', icon: Users, color: 'text-purple-600' },
                { label: 'Perf. Fee', value: `${form.performance_fee}%`, icon: Shield, color: 'text-orange-600' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white p-4 flex items-center gap-3">
                  <stat.icon className={`w-5 h-5 ${stat.color} flex-shrink-0`} />
                  <div>
                    <p className="text-sm font-bold text-slate-800">{stat.value}</p>
                    <p className="text-xs text-slate-400">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 flex items-center justify-between border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-400">Min copy amount</p>
                <p className="text-sm font-bold text-slate-700">${form.min_copy_amount.toLocaleString()}</p>
              </div>
              {trader?.is_verified && (
                <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Verified
                </div>
              )}
              <div className="px-4 py-2 bg-[#1E40AF] text-white text-sm font-semibold rounded-xl opacity-60 cursor-not-allowed">
                Copy Trader
              </div>
            </div>
          </motion.div>

          {trader && (
            <p className="text-xs text-slate-400 text-center mt-3">
              ✓ Profile is {trader.is_active ? 'live and visible' : 'inactive'} to investors
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
