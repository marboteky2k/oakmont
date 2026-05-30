import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Eye, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import type { KycDocument, User } from '@/types/database'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

type KycWithUser = KycDocument & { users?: User }

export default function AdminKYC() {
  const [docs, setDocs] = useState<KycWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<KycWithUser | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [statusFilter, setStatusFilter] = useState('pending')

  const fetchDocs = async () => {
    let query = supabase.from('kyc_documents').select('*, users(*)').order('created_at', { ascending: false })
    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    const { data } = await query
    setDocs((data ?? []) as KycWithUser[])
    setLoading(false)
  }

  useEffect(() => { setLoading(true); fetchDocs() }, [statusFilter])

  const handleApprove = async (doc: KycWithUser) => {
    setProcessing(true)
    try {
      const { error } = await supabase.functions.invoke('admin-approve-kyc', {
        body: { kycId: doc.id, userId: doc.user_id, action: 'approve' },
      })
      if (error) throw error
      // Send KYC approval email via Resend
      supabase.functions.invoke('send-kyc-notification', {
        body: { user_id: doc.user_id, status: 'approved' },
      }).catch(console.error)
      toast.success(`KYC approved for ${doc.users?.full_name}`)
      setViewing(null)
      fetchDocs()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (doc: KycWithUser) => {
    if (!rejectionReason) { toast.error('Please provide a rejection reason'); return }
    setProcessing(true)
    try {
      const { error } = await supabase.functions.invoke('admin-approve-kyc', {
        body: { kycId: doc.id, userId: doc.user_id, action: 'reject', reason: rejectionReason },
      })
      if (error) throw error
      // Send KYC rejection email via Resend
      supabase.functions.invoke('send-kyc-notification', {
        body: { user_id: doc.user_id, status: 'rejected', rejection_reason: rejectionReason },
      }).catch(console.error)
      toast.success(`KYC rejected for ${doc.users?.full_name}`)
      setViewing(null)
      setRejectionReason('')
      setShowRejectInput(false)
      fetchDocs()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const statusBtns = ['pending', 'approved', 'rejected', 'all']
  const statusVariant = (s: string): any =>
    s === 'approved' ? 'success' : s === 'pending' ? 'warning' : s === 'rejected' ? 'danger' : 'default'

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">KYC Review</h1>

      <div className="flex gap-2 flex-wrap">
        {statusBtns.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
              statusFilter === s ? 'bg-[#1E40AF] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-[#3B82F6]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)
        ) : docs.length === 0 ? (
          <div className="col-span-full">
            <Card className="text-center py-12">
              <Shield className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No {statusFilter} KYC submissions</p>
            </Card>
          </div>
        ) : (
          docs.map((doc, i) => (
            <motion.div key={doc.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card hover className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1E40AF] flex items-center justify-center text-white font-bold flex-shrink-0">
                    {doc.users?.full_name?.charAt(0) ?? 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{doc.users?.full_name ?? 'Unknown'}</p>
                    <p className="text-xs text-slate-500 truncate">{doc.users?.email}</p>
                  </div>
                  <Badge variant={statusVariant(doc.status)} size="sm" className="capitalize">{doc.status}</Badge>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <p><span className="font-medium">Document:</span> {doc.document_type?.replace('_', ' ')}</p>
                  <p><span className="font-medium">Submitted:</span> {format(new Date(doc.created_at), 'MMM d, yyyy HH:mm')}</p>
                  {doc.rejection_reason && (
                    <p className="text-red-600"><span className="font-medium">Reason:</span> {doc.rejection_reason}</p>
                  )}
                </div>

                <Button size="sm" variant="outline" onClick={() => setViewing(doc)}>
                  <Eye className="w-3.5 h-3.5" /> Review Documents
                </Button>

                {doc.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApprove(doc)} loading={processing} className="flex-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => { setViewing(doc); setShowRejectInput(true) }} className="flex-1">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* View documents modal */}
      <Modal open={!!viewing} onClose={() => { setViewing(null); setShowRejectInput(false); setRejectionReason('') }} title="KYC Documents" size="lg">
        {viewing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 rounded-xl p-4">
              <div><span className="text-slate-500">Name:</span> <span className="font-medium">{viewing.users?.full_name}</span></div>
              <div><span className="text-slate-500">Email:</span> <span className="font-medium">{viewing.users?.email}</span></div>
              <div><span className="text-slate-500">Document:</span> <span className="font-medium capitalize">{viewing.document_type?.replace('_', ' ')}</span></div>
              <div><span className="text-slate-500">Status:</span> <span className="font-medium capitalize">{viewing.status}</span></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {viewing.front_url && (
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1.5">Front</p>
                  <img src={viewing.front_url} alt="Front" className="w-full h-36 object-cover rounded-xl border border-slate-200" />
                </div>
              )}
              {viewing.back_url && (
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1.5">Back</p>
                  <img src={viewing.back_url} alt="Back" className="w-full h-36 object-cover rounded-xl border border-slate-200" />
                </div>
              )}
              {viewing.selfie_url && (
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-1.5">Selfie</p>
                  <img src={viewing.selfie_url} alt="Selfie" className="w-full h-36 object-cover rounded-xl border border-slate-200" />
                </div>
              )}
            </div>

            {showRejectInput && (
              <Input
                label="Rejection Reason"
                placeholder="Explain why the document was rejected..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
              />
            )}

            {viewing.status === 'pending' && (
              <div className="flex gap-3">
                <Button onClick={() => handleApprove(viewing)} loading={processing} className="flex-1">
                  <CheckCircle className="w-4 h-4" /> Approve
                </Button>
                {!showRejectInput ? (
                  <Button variant="danger" onClick={() => setShowRejectInput(true)} className="flex-1">
                    <XCircle className="w-4 h-4" /> Reject
                  </Button>
                ) : (
                  <Button variant="danger" onClick={() => handleReject(viewing)} loading={processing} className="flex-1">
                    Confirm Rejection
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
