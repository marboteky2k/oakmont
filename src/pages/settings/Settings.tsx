import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Lock, Shield, Copy, CheckCircle, Smartphone, AlertTriangle,
  Trash2, QrCode, Bell, Monitor, Globe, LogOut
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  getMfaFactors, enrollMfa, verifyMfaEnrollment, unenrollMfa
} from '@/lib/mfa'
import type { MfaFactor } from '@/lib/mfa'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface NotifPrefs {
  email: Record<string, boolean>
  inapp: Record<string, boolean>
}

const NOTIF_TYPES = [
  { key: 'deposit',    label: 'Deposit Confirmed',    desc: 'When a deposit is approved' },
  { key: 'withdrawal', label: 'Withdrawal Processed', desc: 'When a withdrawal is completed' },
  { key: 'profit',     label: 'Profit Credited',      desc: 'When trading profits are credited' },
  { key: 'investment', label: 'Investment Matured',   desc: 'When an investment plan matures' },
  { key: 'referral',   label: 'Referral Bonus',       desc: 'When referral commission is earned' },
  { key: 'security',   label: 'Security Alerts',      desc: 'Logins from new devices or locations' },
]

const defaultNotifPrefs: NotifPrefs = {
  email: Object.fromEntries(NOTIF_TYPES.map(t => [t.key, true])),
  inapp: Object.fromEntries(NOTIF_TYPES.map(t => [t.key, true])),
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-[#1E40AF]' : 'bg-slate-200'}`}
      style={{ height: '22px', width: '40px' }}
    >
      <span className={`absolute top-0.5 left-0.5 w-[18px] h-[18px] bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0'}`} />
    </button>
  )
}

function SectionHeader({ icon: Icon, iconColor, title }: { icon: typeof User; iconColor: string; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-9 h-9 rounded-xl ${iconColor} flex items-center justify-center`}>
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
    </div>
  )
}

export default function Settings() {
  const { profile, refreshProfile, signOut } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [phone, setPhone]       = useState(profile?.phone ?? '')
  const [saving, setSaving]     = useState(false)
  const [newPw, setNewPw]       = useState('')
  const [changingPw, setChangingPw] = useState(false)
  const [copied, setCopied]     = useState(false)

  // MFA state
  const [mfaFactors, setMfaFactors] = useState<MfaFactor[]>([])
  const [loadingMfa, setLoadingMfa] = useState(true)
  const [enrolling, setEnrolling]   = useState(false)
  const [qrCode, setQrCode]         = useState('')
  const [secret, setSecret]         = useState('')
  const [factorId, setFactorId]     = useState('')
  const [totpCode, setTotpCode]     = useState('')
  const [verifyingTotp, setVerifyingTotp] = useState(false)
  const [unenrolling, setUnenrolling]     = useState(false)

  // Notification prefs
  const prefsKey = `notif_prefs_${profile?.id ?? 'anon'}`
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(() => {
    try {
      const stored = localStorage.getItem(prefsKey)
      return stored ? JSON.parse(stored) : defaultNotifPrefs
    } catch { return defaultNotifPrefs }
  })

  // Sessions
  const [session, setSession] = useState<any>(null)
  const [revokingAll, setRevokingAll] = useState(false)

  const loadMfaFactors = async () => {
    try {
      const factors = await getMfaFactors()
      setMfaFactors(factors)
    } catch {
      setMfaFactors([])
    } finally {
      setLoadingMfa(false)
    }
  }

  useEffect(() => {
    loadMfaFactors()
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
  }, [])

  const saveProfile = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const { error } = await supabase.from('users').update({ full_name: fullName, phone }).eq('id', profile.id)
      if (error) throw error
      await refreshProfile()
      toast.success('Profile updated!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (!newPw || newPw.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (!/[A-Z]/.test(newPw)) { toast.error('Password must contain an uppercase letter'); return }
    if (!/[0-9]/.test(newPw)) { toast.error('Password must contain a number'); return }
    setChangingPw(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) throw error
      toast.success('Password updated!')
      setNewPw('')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setChangingPw(false)
    }
  }

  const copyReferral = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(`${window.location.origin}/register?ref=${profile.referral_code}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
      toast.success('Referral link copied!')
    }
  }

  const startEnrollMfa = async () => {
    setEnrolling(true)
    try {
      const { qrCode: qr, secret: sec, factorId: fid } = await enrollMfa()
      setQrCode(qr)
      setSecret(sec)
      setFactorId(fid)
    } catch (err: any) {
      toast.error(err.message)
      setEnrolling(false)
    }
  }

  const confirmEnrollment = async () => {
    if (totpCode.length !== 6) { toast.error('Enter the 6-digit code'); return }
    setVerifyingTotp(true)
    try {
      await verifyMfaEnrollment(factorId, totpCode)
      toast.success('Two-factor authentication enabled!')
      setEnrolling(false); setQrCode(''); setSecret(''); setTotpCode('')
      await loadMfaFactors()
    } catch (err: any) {
      toast.error(err.message?.includes('Invalid') ? 'Incorrect code. Try again.' : err.message)
    } finally {
      setVerifyingTotp(false)
    }
  }

  const removeMfa = async (id: string) => {
    setUnenrolling(true)
    try {
      await unenrollMfa(id)
      toast.success('Two-factor authentication removed')
      await loadMfaFactors()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setUnenrolling(false)
    }
  }

  const updateNotifPref = (channel: 'email' | 'inapp', key: string, val: boolean) => {
    const next = { ...notifPrefs, [channel]: { ...notifPrefs[channel], [key]: val } }
    setNotifPrefs(next)
    localStorage.setItem(prefsKey, JSON.stringify(next))
  }

  const revokeAllSessions = async () => {
    setRevokingAll(true)
    try {
      await supabase.auth.signOut({ scope: 'global' })
      toast.success('All sessions revoked. Please sign in again.')
      signOut()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setRevokingAll(false)
    }
  }

  const verifiedFactor = mfaFactors.find(f => f.status === 'verified')
  const hasMfa = !!verifiedFactor

  // Detect device info from user agent
  const ua = navigator.userAgent
  const deviceName = /Mobile|Android|iPhone/.test(ua) ? 'Mobile device' : 'Desktop browser'
  const browserName = /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : /Edge/.test(ua) ? 'Edge' : 'Browser'

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      {/* ── Profile ── */}
      <Card>
        <SectionHeader icon={User} iconColor="bg-blue-100 text-blue-600" title="Profile Information" />
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] flex items-center justify-center text-white text-2xl font-bold shadow-sm">
              {profile?.full_name?.charAt(0) ?? 'U'}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{profile?.full_name}</p>
              <p className="text-sm text-slate-500">{profile?.email}</p>
              <p className="text-xs text-slate-400 capitalize mt-0.5">{profile?.role?.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" value={fullName.split(' ')[0]} onChange={e => setFullName(`${e.target.value} ${fullName.split(' ').slice(1).join(' ')}`)} />
            <Input label="Last Name"  value={fullName.split(' ').slice(1).join(' ')} onChange={e => setFullName(`${fullName.split(' ')[0]} ${e.target.value}`)} />
          </div>
          <Input label="Email Address" value={profile?.email ?? ''} disabled hint="Contact support to change your email" />
          <Input label="Phone Number" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
          <Button onClick={saveProfile} loading={saving}>Save Changes</Button>
        </div>
      </Card>

      {/* ── Password ── */}
      <Card>
        <SectionHeader icon={Lock} iconColor="bg-red-100 text-red-600" title="Change Password" />
        <div className="space-y-4">
          <Input
            label="New Password"
            type="password"
            placeholder="Min. 8 chars, 1 uppercase, 1 number"
            value={newPw}
            onChange={e => setNewPw(e.target.value)}
            hint="Must be at least 8 characters with one uppercase letter and one number"
          />
          <Button onClick={changePassword} loading={changingPw} variant="outline" icon={<Lock className="w-4 h-4" />}>
            Update Password
          </Button>
        </div>
      </Card>

      {/* ── Two-Factor Auth ── */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Two-Factor Authentication</h3>
            <p className="text-xs text-slate-500 mt-0.5">Adds an extra layer of security to your account</p>
          </div>
          {hasMfa && <Badge variant="success" size="md">Enabled</Badge>}
        </div>

        {loadingMfa ? (
          <div className="h-8 animate-pulse bg-slate-100 rounded-lg" />
        ) : hasMfa ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">Authenticator App Connected</p>
                <p className="text-xs text-green-600">Required for withdrawals and sensitive actions</p>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-yellow-50 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-700">
                Removing 2FA will reduce your account security and disable withdrawals.
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={() => removeMfa(verifiedFactor!.id)} loading={unenrolling} icon={<Trash2 className="w-3.5 h-3.5" />}>
              Remove 2FA
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4">
              <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">Protect your account</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  Enable 2FA to secure withdrawals and account changes. Use Google Authenticator, Authy, or any TOTP app.
                </p>
              </div>
            </div>

            {!enrolling ? (
              <Button onClick={startEnrollMfa} icon={<QrCode className="w-4 h-4" />}>
                Enable Two-Factor Authentication
              </Button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-slate-700 mb-3">Step 1: Scan this QR code with your authenticator app</p>
                  {qrCode && (
                    <div className="flex justify-center mb-3">
                      <img src={qrCode} alt="MFA QR Code" className="w-40 h-40 rounded-xl border border-slate-200" />
                    </div>
                  )}
                  <div className="bg-white rounded-lg border border-slate-200 p-2.5">
                    <p className="text-xs text-slate-500 mb-1">Or enter this secret manually:</p>
                    <code className="text-xs font-mono text-slate-700 break-all">{secret}</code>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm font-medium text-slate-700 mb-3">Step 2: Enter the 6-digit code from your app</p>
                  <div className="flex gap-3">
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      value={totpCode}
                      onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="text-center text-2xl font-mono tracking-widest"
                    />
                    <Button onClick={confirmEnrollment} loading={verifyingTotp} disabled={totpCode.length !== 6}>Verify</Button>
                  </div>
                </div>

                <button
                  onClick={() => { setEnrolling(false); setQrCode(''); setSecret(''); setTotpCode('') }}
                  className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Cancel setup
                </button>
              </motion.div>
            )}
          </div>
        )}
      </Card>

      {/* ── Notification Preferences ── */}
      <Card>
        <SectionHeader icon={Bell} iconColor="bg-yellow-100 text-yellow-600" title="Notification Preferences" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left pb-3 font-medium text-slate-500 pr-6">Notification</th>
                <th className="text-center pb-3 font-medium text-slate-500 px-4">Email</th>
                <th className="text-center pb-3 font-medium text-slate-500 px-4">In-App</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {NOTIF_TYPES.map(nt => (
                <tr key={nt.key} className="hover:bg-slate-50/50">
                  <td className="py-3 pr-6">
                    <p className="font-medium text-slate-900">{nt.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{nt.desc}</p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center">
                      <Toggle
                        checked={notifPrefs.email[nt.key] ?? true}
                        onChange={v => updateNotifPref('email', nt.key, v)}
                      />
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex justify-center">
                      <Toggle
                        checked={notifPrefs.inapp[nt.key] ?? true}
                        onChange={v => updateNotifPref('inapp', nt.key, v)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Active Sessions ── */}
      <Card>
        <SectionHeader icon={Monitor} iconColor="bg-indigo-100 text-indigo-600" title="Active Sessions" />

        {session ? (
          <div className="space-y-3">
            {/* Current session */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                <Globe className="w-5 h-5 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-slate-900 text-sm">{browserName} on {deviceName}</p>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Current</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {navigator.platform || 'Unknown OS'} · Active now ·{' '}
                  {session.expires_at
                    ? `Expires ${format(new Date(session.expires_at * 1000), 'MMM d, yyyy')}`
                    : 'Session active'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-3">
              <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">
                If you don't recognize a device or location, revoke all sessions immediately and change your password.
              </p>
            </div>

            <Button
              variant="danger"
              size="sm"
              onClick={revokeAllSessions}
              loading={revokingAll}
              icon={<LogOut className="w-3.5 h-3.5" />}
            >
              Sign Out All Devices
            </Button>
          </div>
        ) : (
          <div className="text-center py-6">
            <Monitor className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">Loading session info...</p>
          </div>
        )}
      </Card>

      {/* ── Referral ── */}
      <Card>
        <SectionHeader icon={Shield} iconColor="bg-green-100 text-green-600" title="Referral Program" />
        <p className="text-sm text-slate-600 mb-4">
          Earn <strong>5% commission</strong> on every deposit your referrals make. View full stats on the{' '}
          <a href="/referrals" className="text-[#3B82F6] hover:underline">Referrals page</a>.
        </p>
        <div className="bg-slate-50 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-2">Your Referral Code</p>
          <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-3 py-2.5">
            <code className="flex-1 text-sm font-mono font-bold text-slate-900">{profile?.referral_code ?? '—'}</code>
            <button onClick={copyReferral} className="text-[#3B82F6] hover:text-[#1E40AF] transition-colors">
              {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2 break-all">
            Share: {window.location.origin}/register?ref={profile?.referral_code}
          </p>
        </div>
      </Card>
    </div>
  )
}
