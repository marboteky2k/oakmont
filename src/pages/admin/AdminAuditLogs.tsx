import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { FileText, Search, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import type { AuditLog } from '@/types/database'
import { format, parseISO, startOfDay, subDays } from 'date-fns'

const DATE_FILTERS = [
  { value: 'all', label: 'All Time' },
  { value: '1', label: 'Last 24h' },
  { value: '7', label: 'Last 7d' },
  { value: '30', label: 'Last 30d' },
]

function exportCSV(logs: AuditLog[]) {
  const header = 'Admin,Action,Target Type,Target ID,IP,Date'
  const rows = logs.map((l) =>
    [(l.users as any)?.full_name ?? 'System', l.action, l.target_type, l.target_id, l.ip_address ?? '', format(parseISO(l.created_at), 'yyyy-MM-dd HH:mm')].join(','),
  )
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `audit_logs_${format(new Date(), 'yyyyMMdd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const ACTION_COLOR: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  approve: 'bg-emerald-100 text-emerald-700',
  reject: 'bg-orange-100 text-orange-700',
  suspend: 'bg-yellow-100 text-yellow-700',
  credit: 'bg-purple-100 text-purple-700',
}

function actionColor(action: string): string {
  const key = Object.keys(ACTION_COLOR).find((k) => action.toLowerCase().includes(k))
  return key ? ACTION_COLOR[key] : 'bg-slate-100 text-slate-600'
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('')

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('audit_logs')
        .select('*, users(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(500)
      setLogs((data ?? []) as AuditLog[])
      setLoading(false)
    }
    fetch()
  }, [])

  const uniqueActions = useMemo(() => {
    const set = new Set(logs.map((l) => l.action))
    return Array.from(set).sort()
  }, [logs])

  const filtered = useMemo(() => {
    let list = logs
    // Date filter
    if (dateFilter !== 'all') {
      const days = parseInt(dateFilter)
      const cutoff = startOfDay(subDays(new Date(), days)).toISOString()
      list = list.filter((l) => l.created_at >= cutoff)
    }
    // Action filter
    if (actionFilter) list = list.filter((l) => l.action === actionFilter)
    // Search
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (l) =>
          (l.users as any)?.full_name?.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.target_type?.toLowerCase().includes(q) ||
          l.target_id?.toLowerCase().includes(q),
      )
    }
    return list
  }, [logs, search, dateFilter, actionFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
          <p className="text-slate-500 text-sm mt-0.5">Immutable record of all admin actions</p>
        </div>
        <button
          onClick={() => exportCSV(filtered)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <Input
            placeholder="Search admin, action, target…"
            leftIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Date filter */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {DATE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setDateFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${dateFilter === f.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {/* Action filter */}
        {uniqueActions.length > 0 && (
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          >
            <option value="">All Actions</option>
            {uniqueActions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        )}
      </div>

      {/* Count */}
      <div className="text-xs text-slate-400">
        Showing {filtered.length} of {logs.length} entries
      </div>

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {['Admin', 'Action', 'Target', 'Details', 'IP Address', 'Timestamp'].map((h) => (
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
                    {[...Array(6)].map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">No audit logs match these filters.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((log, i) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.01 }}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-slate-900">{(log.users as any)?.full_name ?? 'System'}</p>
                      <p className="text-xs text-slate-400">{(log.users as any)?.email ?? ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-slate-700 capitalize">{log.target_type?.replace('_', ' ')}</p>
                      <p className="text-xs text-slate-400 font-mono">{log.target_id?.slice(0, 12)}…</p>
                    </td>
                    <td className="px-4 py-3 max-w-[180px]">
                      {log.details ? (
                        <p className="text-xs text-slate-500 truncate" title={JSON.stringify(log.details)}>
                          {JSON.stringify(log.details).slice(0, 60)}…
                        </p>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                      {log.ip_address ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                      {format(parseISO(log.created_at), 'MMM d, HH:mm:ss')}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
