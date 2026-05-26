import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Search, CheckCircle, XCircle, DollarSign, Download, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import type { Transaction, TransactionType, TransactionStatus } from '@/types/database'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const PAGE_SIZE = 25

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'failed', 'cancelled']
const TYPE_FILTERS = ['all', 'deposit', 'withdrawal', 'profit', 'fee', 'copy_earning']

const EXPLORER: Record<string, string> = {
  BTC: 'https://blockstream.info/tx/',
  ETH: 'https://etherscan.io/tx/',
  USDT: 'https://etherscan.io/tx/',
}

function txTypeStyle(type: TransactionType) {
  switch (type) {
    case 'deposit': return 'bg-green-100 text-green-700'
    case 'withdrawal': return 'bg-red-100 text-red-700'
    case 'profit': return 'bg-blue-100 text-blue-700'
    case 'copy_earning': return 'bg-purple-100 text-purple-700'
    default: return 'bg-slate-100 text-slate-700'
  }
}

function exportCSV(txs: Transaction[]) {
  const header = 'ID,Type,Amount,Currency,Status,Network,TX Hash,Date'
  const rows = txs.map((t) =>
    [t.id, t.type, t.amount, t.currency, t.status, t.network ?? '', t.tx_hash ?? '', format(new Date(t.created_at), 'yyyy-MM-dd HH:mm')].join(','),
  )
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `transactions_${format(new Date(), 'yyyyMMdd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminTransactions() {
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [processing, setProcessing] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<Transaction | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const fetchTxs = async () => {
    setLoading(true)
    let query = supabase
      .from('transactions')
      .select('*, users(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(500)
    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    if (typeFilter !== 'all') query = query.eq('type', typeFilter)
    const { data } = await query
    setTxs((data ?? []) as any)
    setLoading(false)
  }

  useEffect(() => { setPage(1); fetchTxs() }, [statusFilter, typeFilter])

  const filtered = useMemo(() => {
    if (!search) return txs
    const q = search.toLowerCase()
    return txs.filter(
      (t) =>
        t.tx_hash?.toLowerCase().includes(q) ||
        t.note?.toLowerCase().includes(q) ||
        t.crypto_address?.toLowerCase().includes(q),
    )
  }, [txs, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  /**
   * Credit a wallet balance for a confirmed deposit.
   * Strategy:
   *   1. Try the `credit_wallet` SECURITY DEFINER RPC (atomic, bypasses RLS).
   *   2. If the function isn't deployed yet, fall back to a direct
   *      select-then-update (works as long as admin RLS allows it).
   * Either way, never calls .single() — uses array select to avoid the
   * "Cannot coerce to single JSON object" crash.
   */
  const creditWallet = async (userId: string, currency: string, amount: number) => {
    // ── Path A: RPC (preferred — requires credit_wallet fn in DB) ──
    const { error: rpcErr } = await supabase.rpc('credit_wallet', {
      p_user_id:  userId,
      p_currency: currency,
      p_amount:   amount,
    })

    if (!rpcErr) return // success

    // If error is "function not found", fall back to direct update
    const notFound =
      rpcErr.message.includes('Could not find') ||
      rpcErr.message.includes('schema cache') ||
      rpcErr.code === 'PGRST202'

    if (!notFound) throw new Error(rpcErr.message) // real error, surface it

    // ── Path B: direct select + update (no .single(), array-safe) ──
    const field =
      currency === 'BTC' ? 'balance_btc' :
      currency === 'ETH' ? 'balance_eth' :
      'balance_usdt'

    const { data: rows, error: selErr } = await supabase
      .from('wallets')
      .select(field)
      .eq('user_id', userId)

    if (selErr) throw new Error('Wallet read failed: ' + selErr.message)

    const current = Number((rows?.[0] as any)?.[field] ?? 0)
    const newBal  = current + amount

    if (rows && rows.length > 0) {
      // Row exists — update it
      const { error: updErr } = await supabase
        .from('wallets')
        .update({ [field]: newBal })
        .eq('user_id', userId)
      if (updErr) throw new Error('Wallet update failed: ' + updErr.message)
    } else {
      // Row missing — upsert with the deposit amount as starting balance
      const { error: upsertErr } = await supabase
        .from('wallets')
        .upsert({ user_id: userId, [field]: amount }, { onConflict: 'user_id' })
      if (upsertErr) throw new Error('Wallet upsert failed: ' + upsertErr.message)
    }
  }

  const approve = async (tx: Transaction) => {
    setProcessing(tx.id)
    try {
      if (tx.type === 'deposit') {
        // 1. Credit the wallet (atomic RPC or direct fallback)
        await creditWallet(tx.user_id, tx.currency, Number(tx.amount))

        // 2. Mark transaction confirmed
        const { error: txErr } = await supabase
          .from('transactions')
          .update({ status: 'confirmed' })
          .eq('id', tx.id)
        if (txErr) throw new Error(txErr.message)

        // 3. Notify the user
        await supabase.from('notifications').insert({
          user_id: tx.user_id,
          title:   'Deposit Confirmed ✅',
          message: `Your deposit of ${tx.amount} ${tx.currency} has been confirmed and credited to your wallet.`,
          type:    'success',
        })

        toast.success(`✅ ${tx.amount} ${tx.currency} credited to wallet`)
      } else {
        const { error } = await supabase
          .from('transactions')
          .update({ status: 'confirmed' })
          .eq('id', tx.id)
        if (error) throw new Error(error.message)
        toast.success('Transaction confirmed')
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Approval failed')
    } finally {
      setProcessing(null)
      fetchTxs()
    }
  }

  const reject = async () => {
    if (!rejectTarget) return
    setProcessing(rejectTarget.id)
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'failed', note: rejectReason || 'Rejected by admin' })
      .eq('id', rejectTarget.id)
    setProcessing(null)
    if (error) { toast.error(error.message); return }
    toast.success('Transaction rejected')
    setRejectTarget(null)
    setRejectReason('')
    fetchTxs()
  }

  const statusVariant = (s: string): any =>
    s === 'confirmed' ? 'success' : s === 'pending' ? 'warning' : 'danger'

  const explorerUrl = (tx: Transaction) =>
    tx.tx_hash ? (EXPLORER[tx.currency] ?? '') + tx.tx_hash : null

  const totalPending = txs.filter((t) => t.type === 'withdrawal' && t.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {filtered.length} records · {totalPending > 0 && <span className="text-orange-600 font-medium">{totalPending} withdrawal{totalPending > 1 ? 's' : ''} pending</span>}
          </p>
        </div>
        <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={() => exportCSV(filtered)}>
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <Input
          placeholder="Search by TX hash, address or note…"
          leftIcon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-medium text-slate-400 self-center">Status:</span>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
                statusFilter === s ? 'bg-[#1E40AF] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
              }`}
            >
              {s}
            </button>
          ))}
          <span className="text-xs font-medium text-slate-400 self-center ml-3">Type:</span>
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t); setPage(1) }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
                typeFilter === t ? 'bg-[#1E40AF] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['User', 'Type', 'Amount', 'Currency', 'TX Hash', 'Network', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(9)].map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-400">No transactions match these filters.</td>
                </tr>
              ) : (
                paginated.map((tx, i) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.015 }}
                    className="hover:bg-slate-50/60"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-xs font-medium text-slate-700 truncate max-w-[120px]">
                          {(tx as any).users?.full_name ?? '—'}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          {(tx as any).users?.email ?? ''}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg capitalize ${txTypeStyle(tx.type)}`}>
                        <DollarSign className="w-3 h-3" />
                        {tx.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{tx.amount}</td>
                    <td className="px-4 py-3"><Badge variant="info" size="sm">{tx.currency}</Badge></td>
                    <td className="px-4 py-3">
                      {tx.tx_hash ? (
                        <div className="flex items-center gap-1">
                          <code className="text-xs text-slate-600 font-mono max-w-[100px] truncate block">{tx.tx_hash}</code>
                          {explorerUrl(tx) && (
                            <a href={explorerUrl(tx)!} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 flex-shrink-0">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{tx.network ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(tx.status)} size="sm" className="capitalize">{tx.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {format(new Date(tx.created_at), 'MMM d, HH:mm')}
                    </td>
                    <td className="px-4 py-3">
                      {tx.status === 'pending' && (
                        <div className="flex gap-1 items-center">
                          <button
                            onClick={() => approve(tx)}
                            disabled={processing === tx.id}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50 text-xs font-medium"
                            title={tx.type === 'deposit' ? 'Confirm & credit wallet' : 'Approve'}
                          >
                            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            {tx.type === 'deposit' ? 'Credit' : 'Approve'}
                          </button>
                          <button
                            onClick={() => setRejectTarget(tx)}
                            disabled={processing === tx.id}
                            className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${pg === page ? 'bg-[#1E40AF] text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {pg}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Reject modal */}
      <Modal open={!!rejectTarget} onClose={() => { setRejectTarget(null); setRejectReason('') }} title="Reject Transaction">
        <div className="space-y-4">
          {rejectTarget && (
            <div className="bg-slate-50 rounded-xl p-4 text-sm">
              <p className="font-medium text-slate-700">{rejectTarget.type} · {rejectTarget.amount} {rejectTarget.currency}</p>
              <p className="text-slate-400 text-xs mt-0.5">{format(new Date(rejectTarget.created_at), 'MMMM d, yyyy HH:mm')}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1.5">Rejection Reason</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Explain why this transaction is rejected (visible to user)…"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setRejectTarget(null); setRejectReason('') }}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" loading={processing === rejectTarget?.id} onClick={reject}>
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
