import { useEffect, useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Search, UserCheck, UserX, DollarSign, ChevronLeft, ChevronRight,
  Download, Trash2, Shield, RefreshCw, Eye, X, Plus, Minus,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, getStatusColor } from '@/lib/utils'
import type { User, UserRole } from '@/types/database'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const PAGE_SIZE = 20

interface UserWithWallet extends User {
  balance?: number
}

const ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'investor', label: 'Investor' },
  { value: 'copy_trader', label: 'Copy Trader' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
]

const KYC_OPTIONS = [
  { value: 'all', label: 'All KYC' },
  { value: 'verified', label: 'Verified' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Suspended' },
]

function exportCSV(users: User[]) {
  const header = 'Name,Email,Role,KYC,Status,Joined'
  const rows = users.map((u) =>
    [u.full_name, u.email, u.role, u.kyc_status, u.is_active ? 'Active' : 'Suspended', format(new Date(u.created_at), 'yyyy-MM-dd')].join(','),
  )
  const csv = [header, ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `users_${format(new Date(), 'yyyyMMdd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithWallet[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [kycFilter, setKycFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<User | null>(null)         // for detail modal
  const [creditUser, setCreditUser] = useState<User | null>(null)     // for credit/debit modal
  const [creditAmount, setCreditAmount] = useState('')
  const [creditCurrency, setCreditCurrency] = useState('USDT')
  const [creditMode, setCreditMode] = useState<'credit' | 'debit'>('credit')
  const [crediting, setCrediting] = useState(false)
  const [bulk, setBulk] = useState<Set<string>>(new Set())
  const [changing, setChanging] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('investor')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    setUsers((data ?? []) as UserWithWallet[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const filtered = useMemo(() => {
    let list = users
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((u) => u.full_name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    }
    if (roleFilter !== 'all') list = list.filter((u) => u.role === roleFilter)
    if (kycFilter !== 'all') list = list.filter((u) => u.kyc_status === kycFilter)
    if (statusFilter === 'active') list = list.filter((u) => u.is_active)
    if (statusFilter === 'inactive') list = list.filter((u) => !u.is_active)
    return list
  }, [users, search, roleFilter, kycFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const toggleActive = async (user: User) => {
    setChanging(user.id)
    await supabase.from('users').update({ is_active: !user.is_active }).eq('id', user.id)
    toast.success(`User ${user.is_active ? 'suspended' : 'activated'}`)
    setChanging(null)
    fetchUsers()
  }

  const bulkSuspend = async () => {
    if (bulk.size === 0) return
    await supabase.from('users').update({ is_active: false }).in('id', [...bulk])
    toast.success(`${bulk.size} user(s) suspended`)
    setBulk(new Set())
    fetchUsers()
  }

  const changeRole = async () => {
    if (!selected) return
    setChanging(selected.id)
    await supabase.from('users').update({ role: newRole }).eq('id', selected.id)
    toast.success(`Role updated to ${newRole.replace('_', ' ')}`)
    setChanging(null)
    setSelected(null)
    fetchUsers()
  }

  const creditWallet = async () => {
    if (!creditUser || !creditAmount) return
    const amt = parseFloat(creditAmount)
    if (isNaN(amt) || amt <= 0) { toast.error('Enter a valid amount.'); return }
    setCrediting(true)
    try {
      const col = creditCurrency === 'USDT' ? 'balance_usdt' : creditCurrency === 'BTC' ? 'balance_btc' : 'balance_eth'
      const { data: walletData } = await supabase.from('wallets').select(col).eq('user_id', creditUser.id).single()
      const current = (walletData as any)?.[col] ?? 0
      const next = creditMode === 'credit' ? current + amt : Math.max(0, current - amt)
      await supabase.from('wallets').update({ [col]: next }).eq('user_id', creditUser.id)
      // Log transaction
      await supabase.from('transactions').insert({
        user_id: creditUser.id,
        type: creditMode === 'credit' ? 'deposit' : 'withdrawal',
        amount: amt,
        currency: creditCurrency,
        status: 'confirmed',
        note: `Admin manual ${creditMode}`,
      })
      toast.success(`${creditMode === 'credit' ? 'Credited' : 'Debited'} ${amt} ${creditCurrency}`)
      setCreditUser(null)
      setCreditAmount('')
    } catch {
      toast.error('Operation failed.')
    } finally {
      setCrediting(false)
    }
  }

  const toggleBulk = (id: string) => {
    setBulk((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAllOnPage = () => {
    const pageIds = paginated.map((u) => u.id)
    const allSelected = pageIds.every((id) => bulk.has(id))
    setBulk((prev) => {
      const next = new Set(prev)
      if (allSelected) { pageIds.forEach((id) => next.delete(id)) }
      else { pageIds.forEach((id) => next.add(id)) }
      return next
    })
  }

  const kycBadge = (s: string) => s === 'verified' ? 'success' : s === 'pending' ? 'warning' : 'danger'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">{filtered.length} of {users.length} users</p>
        </div>
        <div className="flex gap-2">
          {bulk.size > 0 && (
            <Button variant="danger" size="sm" onClick={bulkSuspend} icon={<UserX className="w-4 h-4" />}>
              Suspend {bulk.size}
            </Button>
          )}
          <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={() => exportCSV(filtered)}>
            Export CSV
          </Button>
          <Button size="sm" icon={<RefreshCw className="w-4 h-4" />} variant="ghost" onClick={fetchUsers}>Refresh</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Input
          placeholder="Search name or email…"
          leftIcon={<Search className="w-4 h-4" />}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
        <Select
          options={ROLE_OPTIONS}
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }}
        />
        <Select
          options={KYC_OPTIONS}
          value={kycFilter}
          onChange={(e) => { setKycFilter(e.target.value); setPage(1) }}
        />
        <Select
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
        />
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300"
                    checked={paginated.length > 0 && paginated.every((u) => bulk.has(u.id))}
                    onChange={toggleAllOnPage}
                  />
                </th>
                {['User', 'Role', 'KYC', 'Status', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(7)].map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">No users match these filters.</td>
                </tr>
              ) : (
                paginated.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300"
                        checked={bulk.has(user.id)}
                        onChange={() => toggleBulk(user.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {user.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">{user.full_name ?? '—'}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-slate-600 capitalize">
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={kycBadge(user.kyc_status) as any} size="sm" className="capitalize">
                        {user.kyc_status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={user.is_active ? 'success' : 'danger'} size="sm">
                        {user.is_active ? 'Active' : 'Suspended'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                      {format(new Date(user.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => { setSelected(user); setNewRole(user.role) }}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { setCreditUser(user); setCreditMode('credit') }}
                          className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors"
                          title="Credit / Debit Wallet"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => toggleActive(user)}
                          disabled={changing === user.id}
                          className={`p-1.5 rounded-lg transition-colors ${user.is_active ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                          title={user.is_active ? 'Suspend' : 'Activate'}
                        >
                          {user.is_active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      </div>
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
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pg = i + 1
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${pg === page ? 'bg-[#1E40AF] text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {pg}
                  </button>
                )
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* User Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="User Profile" size="lg">
        {selected && (
          <div className="space-y-5">
            {/* Basic info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1E40AF] to-[#3B82F6] flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                {selected.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900">{selected.full_name}</p>
                <p className="text-sm text-slate-500">{selected.email}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant={selected.is_active ? 'success' : 'danger'} size="sm">
                    {selected.is_active ? 'Active' : 'Suspended'}
                  </Badge>
                  <Badge variant="info" size="sm" className="capitalize">{selected.role.replace('_', ' ')}</Badge>
                  <Badge variant={kycBadge(selected.kyc_status) as any} size="sm" className="capitalize">{selected.kyc_status}</Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 mb-0.5">User ID</p>
                <p className="font-mono text-slate-700 text-xs break-all">{selected.id}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 mb-0.5">Joined</p>
                <p className="font-medium text-slate-700">{format(new Date(selected.created_at), 'MMMM d, yyyy')}</p>
              </div>
              {selected.phone && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-400 mb-0.5">Phone</p>
                  <p className="font-medium text-slate-700">{selected.phone}</p>
                </div>
              )}
              {selected.referral_code && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs text-slate-400 mb-0.5">Referral Code</p>
                  <p className="font-mono font-medium text-slate-700">{selected.referral_code}</p>
                </div>
              )}
            </div>

            {/* Change role */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Change Role</p>
              <div className="flex gap-2">
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  {ROLE_OPTIONS.filter((o) => o.value !== 'all').map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  icon={<Shield className="w-4 h-4" />}
                  loading={changing === selected.id}
                  onClick={changeRole}
                  variant="outline"
                >
                  Update Role
                </Button>
              </div>
            </div>

            {/* Admin notes */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Admin Notes</p>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                placeholder="Internal notes about this user (not visible to user)…"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              />
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              <Button
                size="sm"
                variant={selected.is_active ? 'danger' : 'secondary'}
                icon={selected.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                onClick={() => { toggleActive(selected); setSelected(null) }}
              >
                {selected.is_active ? 'Suspend User' : 'Activate User'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                icon={<DollarSign className="w-4 h-4" />}
                onClick={() => { setCreditUser(selected); setSelected(null) }}
              >
                Credit / Debit Wallet
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Credit / Debit modal */}
      <Modal open={!!creditUser} onClose={() => setCreditUser(null)} title={`Wallet — ${creditUser?.full_name}`}>
        <div className="space-y-4">
          <div className="bg-blue-50 rounded-xl p-3 text-xs text-slate-600">
            Manually adjust this user's wallet balance. This action is logged.
          </div>
          {/* Credit / Debit toggle */}
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            {(['credit', 'debit'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setCreditMode(m)}
                className={`flex-1 py-2.5 text-sm font-semibold capitalize transition-colors ${creditMode === m ? (m === 'credit' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-white text-slate-400 hover:bg-slate-50'}`}
              >
                {m === 'credit' ? <Plus className="w-4 h-4 inline mr-1" /> : <Minus className="w-4 h-4 inline mr-1" />}
                {m}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <Input
              label="Amount"
              type="number"
              placeholder="0.00"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Currency</label>
              <select
                value={creditCurrency}
                onChange={(e) => setCreditCurrency(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-300 focus:border-transparent"
              >
                <option value="USDT">USDT</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setCreditUser(null)} className="flex-1">Cancel</Button>
            <Button
              onClick={creditWallet}
              loading={crediting}
              variant={creditMode === 'credit' ? 'primary' : 'danger'}
              className="flex-1"
            >
              {creditMode === 'credit' ? 'Credit Wallet' : 'Debit Wallet'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
