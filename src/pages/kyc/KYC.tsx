import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Upload, CheckCircle, XCircle, Clock, AlertCircle,
  User, FileText, Eye, ChevronRight, ChevronLeft
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import type { KycDocument } from '@/types/database'
import toast from 'react-hot-toast'

const statusConfig = {
  pending:  { icon: Clock,        color: 'text-yellow-600', bg: 'bg-yellow-50',  border: 'border-yellow-200', badge: 'warning' as const, label: 'Under Review' },
  approved: { icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50',   border: 'border-green-200',  badge: 'success' as const, label: 'Verified' },
  rejected: { icon: XCircle,      color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-200',    badge: 'danger' as const,  label: 'Rejected' },
}

const steps = [
  { num: 1, icon: User,     label: 'Personal Info',    desc: 'Your basic details' },
  { num: 2, icon: FileText, label: 'Documents',        desc: 'Upload your ID' },
  { num: 3, icon: Eye,      label: 'Review & Submit',  desc: 'Confirm and send' },
]

function UploadBox({
  label, required, file, onFile,
}: { label: string; required: boolean; file: File | null; onFile: (f: File | null) => void }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </p>
      <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-5 cursor-pointer transition-all ${
        file ? 'border-green-300 bg-green-50' : 'border-slate-200 hover:border-[#3B82F6] hover:bg-blue-50/30'
      }`}>
        <input
          type="file"
          accept="image/*,.pdf"
          className="hidden"
          onChange={e => onFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-1" />
            <p className="text-sm font-medium text-slate-900">{file.name}</p>
            <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB · Click to replace</p>
          </div>
        ) : (
          <>
            <Upload className="w-7 h-7 text-slate-400" />
            <p className="text-sm text-slate-500">Click to upload or drag & drop</p>
            <p className="text-xs text-slate-400">JPG, PNG or PDF · max 10 MB</p>
          </>
        )}
      </label>
    </div>
  )
}

export default function KYC() {
  const { profile, refreshProfile } = useAuth()
  const [doc, setDoc] = useState<KycDocument | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)

  // Step 1 — personal info
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]  = useState('')
  const [dob, setDob]            = useState('')
  const [nationality, setNationality] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [city, setCity]          = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry]    = useState('')

  // Step 2 — documents
  const [docType, setDocType] = useState('passport')
  const [front, setFront]     = useState<File | null>(null)
  const [back, setBack]       = useState<File | null>(null)
  const [selfie, setSelfie]   = useState<File | null>(null)

  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const nameParts = profile?.full_name?.split(' ') ?? []
    setFirstName(nameParts[0] ?? '')
    setLastName(nameParts.slice(1).join(' '))
  }, [profile])

  useEffect(() => {
    if (!profile) return
    supabase.from('kyc_documents')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(({ data }) => {
        setDoc(data)
        setLoading(false)
      })
  }, [profile])

  const validateStep1 = () => {
    if (!firstName || !lastName) { toast.error('Enter your full name'); return false }
    if (!dob) { toast.error('Enter your date of birth'); return false }
    if (!nationality) { toast.error('Enter your nationality'); return false }
    if (!streetAddress || !city || !country) { toast.error('Complete your address'); return false }
    return true
  }

  const validateStep2 = () => {
    if (!front) { toast.error('Upload the front of your document'); return false }
    if (!selfie) { toast.error('Upload a selfie with your document'); return false }
    return true
  }

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep(s => Math.min(3, s + 1))
  }

  const prevStep = () => setStep(s => Math.max(1, s - 1))

  const uploadFile = async (file: File, path: string) => {
    const { error } = await supabase.storage.from('kyc').upload(path, file, { upsert: true })
    if (error) throw error
    const { data: { publicUrl } } = supabase.storage.from('kyc').getPublicUrl(path)
    return publicUrl
  }

  const handleSubmit = async () => {
    if (!profile || !front || !selfie) { toast.error('Missing required documents'); return }
    setSubmitting(true)
    try {
      const uid = profile.id
      const ts = Date.now()
      const frontUrl  = await uploadFile(front,  `${uid}/front-${ts}`)
      const selfieUrl = await uploadFile(selfie, `${uid}/selfie-${ts}`)
      let backUrl: string | undefined
      if (back) backUrl = await uploadFile(back, `${uid}/back-${ts}`)

      const { error } = await supabase.from('kyc_documents').insert({
        user_id: uid,
        document_type: docType as any,
        front_url: frontUrl,
        back_url: backUrl,
        selfie_url: selfieUrl,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      if (error) throw error

      await supabase.functions.invoke('send-notification', {
        body: { userId: uid, title: 'KYC Submitted', message: 'Your documents are under review.', type: 'info' },
      })

      toast.success('KYC submitted for review! We\'ll notify you within 24 hours.')
      refreshProfile()

      const { data } = await supabase.from('kyc_documents').select('*')
        .eq('user_id', uid).order('created_at', { ascending: false }).limit(1).single()
      setDoc(data)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const kycStatus = profile?.kyc_status ?? 'not_started'
  const isVerified = kycStatus === 'verified'
  const sc = statusConfig[doc?.status ?? 'pending']
  const StatusIcon = sc.icon

  if (loading) {
    return <div className="max-w-2xl space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
    </div>
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">KYC Verification</h1>
        <p className="text-slate-500 text-sm mt-1">Verify your identity to unlock full platform features.</p>
      </div>

      {/* Current status banner */}
      {doc && (
        <Card className={`border ${sc.border}`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${sc.bg} flex items-center justify-center flex-shrink-0`}>
              <StatusIcon className={`w-7 h-7 ${sc.color}`} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-900">KYC Status</p>
              <p className="text-sm text-slate-500 mt-0.5">
                {doc.status === 'approved' ? 'Your account is fully verified. All platform features are unlocked.' :
                 doc.status === 'pending'  ? 'Your documents are under review. Typically completed within 24 hours.' :
                 'Your verification was rejected. Please review the reason and re-submit.'}
              </p>
            </div>
            <Badge variant={sc.badge} size="md">{sc.label}</Badge>
          </div>
          {doc.rejection_reason && (
            <div className="mt-4 bg-red-50 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                <span className="font-semibold">Rejection reason:</span> {doc.rejection_reason}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Benefits */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-3">Why verify?</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            'Unlock unlimited withdrawals',
            'Access all investment plans',
            'Higher copy trading limits ($10,000+)',
            'Enhanced account security',
            'Referral commission payouts',
            'Priority customer support',
          ].map(b => (
            <div key={b} className="flex items-center gap-2 text-sm text-slate-700">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              {b}
            </div>
          ))}
        </div>
      </Card>

      {/* Step-flow (only when not verified) */}
      {!isVerified && (
        <Card>
          {/* Stepper */}
          <div className="flex items-center mb-8">
            {steps.map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm transition-all ${
                    step > s.num  ? 'bg-green-500 text-white' :
                    step === s.num ? 'bg-[#1E40AF] text-white shadow-lg shadow-blue-200' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    {step > s.num ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-4 h-4" />}
                  </div>
                  <p className={`text-xs font-medium mt-1.5 whitespace-nowrap ${step >= s.num ? 'text-slate-800' : 'text-slate-400'}`}>
                    {s.label}
                  </p>
                  <p className="text-xs text-slate-400 hidden sm:block">{s.desc}</p>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 mb-6 rounded-full transition-all ${step > s.num ? 'bg-green-400' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* ── Step 1: Personal Info ── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <h3 className="font-semibold text-slate-900 text-lg">Personal Information</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" />
                  <Input label="Last Name"  value={lastName}  onChange={e => setLastName(e.target.value)}  placeholder="Doe" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Date of Birth" type="date" value={dob} onChange={e => setDob(e.target.value)} />
                  <Input label="Nationality" value={nationality} onChange={e => setNationality(e.target.value)} placeholder="e.g. American" />
                </div>
                <Input label="Street Address" value={streetAddress} onChange={e => setStreetAddress(e.target.value)} placeholder="123 Main Street, Apt 4B" />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="City" value={city} onChange={e => setCity(e.target.value)} placeholder="New York" />
                  <Input label="Postal Code" value={postalCode} onChange={e => setPostalCode(e.target.value)} placeholder="10001" />
                </div>
                <Input label="Country" value={country} onChange={e => setCountry(e.target.value)} placeholder="United States" />
              </motion.div>
            )}

            {/* ── Step 2: Document Upload ── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <h3 className="font-semibold text-slate-900 text-lg">Identity Documents</h3>
                <Select
                  label="Document Type"
                  options={[
                    { value: 'passport',         label: 'Passport' },
                    { value: 'national_id',      label: 'National ID Card' },
                    { value: 'drivers_license',  label: "Driver's License" },
                  ]}
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                />
                <UploadBox label="Front of Document" required={true}  file={front}  onFile={setFront} />
                <UploadBox label="Back of Document"  required={false} file={back}   onFile={setBack} />
                <UploadBox label="Selfie Holding Document" required={true}  file={selfie} onFile={setSelfie} />

                <div className="flex items-start gap-2 bg-blue-50 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    Ensure documents are <strong>clearly readable</strong>, not expired, and match your personal details entered in step 1. Photos must not be blurry or cropped.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Review & Submit ── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <h3 className="font-semibold text-slate-900 text-lg">Review & Submit</h3>
                <p className="text-sm text-slate-500">Please review your information before submitting for verification.</p>

                {/* Personal info summary */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                  <p className="font-semibold text-slate-700 flex items-center gap-2 mb-3">
                    <User className="w-4 h-4" /> Personal Details
                  </p>
                  {[
                    ['Full Name', `${firstName} ${lastName}`],
                    ['Date of Birth', dob],
                    ['Nationality', nationality],
                    ['Address', `${streetAddress}, ${city}${postalCode ? ` ${postalCode}` : ''}, ${country}`],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <span className="text-slate-400">{k}</span>
                      <span className="font-medium text-slate-900 text-right">{v}</span>
                    </div>
                  ))}
                </div>

                {/* Document summary */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                  <p className="font-semibold text-slate-700 flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4" /> Documents
                  </p>
                  {[
                    ['Document Type', docType.replace('_', ' ')],
                    ['Front',  front?.name  ?? '—'],
                    ['Back',   back?.name   ?? 'Not provided'],
                    ['Selfie', selfie?.name ?? '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <span className="text-slate-400">{k}</span>
                      <span className={`font-medium text-right truncate max-w-[180px] ${v === '—' ? 'text-red-500' : 'text-slate-900'}`}>{v}</span>
                    </div>
                  ))}
                </div>

                {(!front || !selfie) && (
                  <div className="flex items-start gap-2 bg-red-50 rounded-xl p-3">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">
                      <strong>Missing required documents.</strong> Go back and upload the front of your document and a selfie.
                    </p>
                  </div>
                )}

                <div className="flex items-start gap-2 bg-yellow-50 rounded-xl p-3">
                  <Shield className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-700">
                    Your data is encrypted and processed securely. By submitting, you confirm all information is accurate and belongs to you.
                  </p>
                </div>

                <Button
                  onClick={handleSubmit}
                  loading={submitting}
                  disabled={!front || !selfie}
                  className="w-full"
                  size="lg"
                >
                  <Shield className="w-4 h-4" /> Submit for Verification
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
              icon={<ChevronLeft className="w-4 h-4" />}
            >
              Back
            </Button>
            {step < 3 && (
              <Button onClick={nextStep} icon={<ChevronRight className="w-4 h-4" />}>
                Next Step
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
