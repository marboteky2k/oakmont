import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, TrendingUp, Search, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { getStatusColor, timeAgo } from '@/lib/utils'
import type { Transaction } from '@/types/database'
import { format } from 'date-fns'

const typeIcon = (type: string) => {
  switch (type) {
    case 'deposit': return { icon: ArrowDownRight, bg: 'bg-green-100', color: 'text-green-600' }
    case 'withdrawal': return { icon: ArrowUpRight, bg: 'bg-red-100', color: 'text-red-600' }
    default: return { icon: TrendingUp, bg: 'bg-blue-100', color: 'text-blue-600' }
  }
}

export default function Transactions() {
  const { profile } = useAuth()
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    if (!profile) return
    supabase.from('transactions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setTxs(data ?? [])
        setLoading(false)
      })
  }, [profile])

  const filtered = txs.filter(tx => {
    const matchSearch = tx.tx_hash?.toLowerCase().includes(search.toLowerCase()) ||
      tx.note?.toLowerCase().includes(search.toLowerCase()) ||
      tx.type.includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || tx.type === typeFilter
    return matchSearch && matchType
  })

  const types = ['all', 'deposit', 'withdrawal', 'profit', 'fee', 'copy_earning']

  const statusVariant = (s: string): any => {
    switch (s) {
      case 'confirmed': return 'success'
      case 'pending': return 'warning'
      case 'failed': case 'cancelled': return 'danger'
      default: return 'default'
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search by hash or note..."
          leftIcon={<Search className="w-4 h-4" />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2 flex-wrap">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all capitalize ${
                typeFilter === t
                  ? 'bg-[#1E40AF] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-[#3B82F6]'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <Card padding="none">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No transactions found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((tx, i) => {
              const { icon: Icon, bg, color } = typeIcon(tx.type)
              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 capitalize">{tx.type.replace('_', ' ')}</p>
                    {tx.tx_hash && (
                      <p className="text-xs text-slate-400 font-mono truncate mt-0.5">{tx.tx_hash}</p>
                    )}
                    {tx.note && <p className="text-xs text-slate-500 truncate">{tx.note}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">{format(new Date(tx.created_at), 'MMM d, yyyy HH:mm')}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${tx.type === 'withdrawal' || tx.type === 'fee' ? 'text-red-600' : 'text-green-600'}`}>
                      {tx.type === 'withdrawal' || tx.type === 'fee' ? '-' : '+'}{tx.amount} {tx.currency}
                    </p>
                    <Badge variant={statusVariant(tx.status)} size="sm" className="mt-1">
                      {tx.status}
                    </Badge>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
