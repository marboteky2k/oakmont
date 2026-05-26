import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { Download, TrendingUp, Users, DollarSign, Award } from 'lucide-react'
import { format, subMonths, startOfMonth } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatPercent } from '@/lib/utils'
import type { CopyTrader, InvestmentPlan } from '@/types/database'

const TOOLTIP = {
  contentStyle: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12 },
}

const BAR_COLORS = ['#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE']

// Build deterministic 12-month revenue data
function buildRevenueData() {
  return Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(new Date(2026, 4, 1), 11 - i)
    const base = 3000 + i * 400
    const variance = (((i * 7 + 3) % 5) - 2) * 200
    return {
      month: format(d, 'MMM yy'),
      revenue: Math.round(base + variance),
      deposits: Math.round((base + variance) * 14),
      users: 80 + i * 38 + (i % 3) * 12,
    }
  })
}

const REVENUE_DATA = buildRevenueData()

type ReportTab = 'revenue' | 'users' | 'traders' | 'plans'

const TABS: { key: ReportTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'revenue', label: 'Revenue', icon: DollarSign },
  { key: 'users', label: 'User Acquisition', icon: Users },
  { key: 'traders', label: 'Top Traders', icon: TrendingUp },
  { key: 'plans', label: 'Investment Plans', icon: Award },
]

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return
  const header = Object.keys(data[0]).join(',')
  const rows = data.map((row) => Object.values(row).map(String).join(','))
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}_${format(new Date(), 'yyyyMMdd')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AdminReports() {
  const [tab, setTab] = useState<ReportTab>('revenue')
  const [traders, setTraders] = useState<CopyTrader[]>([])
  const [plans, setPlans] = useState<(InvestmentPlan & { investment_count?: number })[]>([])
  const [loadingLive, setLoadingLive] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      setLoadingLive(true)
      const [tradersRes, plansRes] = await Promise.all([
        supabase.from('copy_traders').select('*').order('total_return_pct', { ascending: false }).limit(10),
        supabase.from('investment_plans').select('*').order('roi_percentage', { ascending: false }),
      ])
      setTraders((tradersRes.data ?? []) as CopyTrader[])
      setPlans((plansRes.data ?? []) as InvestmentPlan[])
      setLoadingLive(false)
    }
    fetch()
  }, [])

  const totalRevenue = useMemo(() => REVENUE_DATA.reduce((s, d) => s + d.revenue, 0), [])
  const totalDeposits = useMemo(() => REVENUE_DATA.reduce((s, d) => s + d.deposits, 0), [])
  const latestUsers = REVENUE_DATA[REVENUE_DATA.length - 1]?.users ?? 0

  const summaryCards = [
    { label: 'Annual Revenue', value: formatCurrency(totalRevenue), color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Total Deposits', value: formatCurrency(totalDeposits), color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Total Users', value: latestUsers.toLocaleString(), color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Traders', value: traders.filter((t) => t.is_active).length.toString(), color: 'text-orange-600', bg: 'bg-orange-50' },
  ]

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="text-slate-500 text-sm mt-1">Platform analytics and performance data.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={<Download className="w-4 h-4" />}
          onClick={() => {
            if (tab === 'revenue') downloadCSV(REVENUE_DATA as any, 'revenue_report')
            else if (tab === 'traders') downloadCSV(traders.map((t) => ({ name: t.display_name, win_rate: t.win_rate, monthly_return: t.monthly_return_pct, followers: t.followers_count, aum: t.assets_under_management })), 'traders_report')
            else if (tab === 'plans') downloadCSV(plans.map((p) => ({ name: p.name, roi: p.roi_percentage, days: p.period_days, min: p.min_amount, max: p.max_amount })), 'plans_report')
          }}
        >
          Export CSV
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card>
              <p className="text-xs text-slate-400 mb-1">{c.label}</p>
              <p className={`text-xl font-black ${c.color}`}>{c.value}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Revenue Report */}
      {tab === 'revenue' && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-slate-900">Monthly Revenue</h3>
                <p className="text-xs text-slate-400">Platform fees collected per month</p>
              </div>
              <Badge variant="info" size="sm">12 months</Badge>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={REVENUE_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                <Tooltip {...TOOLTIP} formatter={(v: unknown) => formatCurrency(v as number)} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} name="Revenue" maxBarSize={36}>
                  {REVENUE_DATA.map((_, i) => <Cell key={i} fill={i === REVENUE_DATA.length - 1 ? '#1E40AF' : '#93C5FD'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card padding="none">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Monthly Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['Month', 'Revenue', 'Deposits', 'Revenue Margin'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[...REVENUE_DATA].reverse().map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-700">{row.month}</td>
                      <td className="px-4 py-3 text-green-600 font-semibold">{formatCurrency(row.revenue)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatCurrency(row.deposits)}</td>
                      <td className="px-4 py-3 text-slate-500">{((row.revenue / row.deposits) * 100).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* User Acquisition */}
      {tab === 'users' && (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-semibold text-slate-900">User Growth</h3>
                <p className="text-xs text-slate-400">Cumulative registered users</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={REVENUE_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP} />
                <Line type="monotone" dataKey="users" stroke="#1E40AF" strokeWidth={2.5} dot={false} name="Users" />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card padding="none">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Monthly New Users</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['Month', 'Total Users', 'New Users (Est.)', 'Growth'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[...REVENUE_DATA].reverse().map((row, i, arr) => {
                    const prev = arr[i + 1]?.users ?? 0
                    const newUsers = row.users - prev
                    const growth = prev > 0 ? ((newUsers / prev) * 100).toFixed(1) : '—'
                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-700">{row.month}</td>
                        <td className="px-4 py-3 text-slate-600">{row.users.toLocaleString()}</td>
                        <td className="px-4 py-3 text-blue-600 font-semibold">+{newUsers.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          {growth !== '—' && (
                            <span className="text-green-600 font-medium text-xs">+{growth}%</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Top Traders */}
      {tab === 'traders' && (
        <Card padding="none">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Top Performing Traders</h3>
            <Badge variant="info" size="sm">{traders.length} total</Badge>
          </div>
          {loadingLive ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['#', 'Trader', 'Style', 'Win Rate', 'Monthly ROI', 'Total ROI', 'Followers', 'AUM', 'Status'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {traders.map((t, i) => (
                    <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-orange-400' : 'bg-slate-200 text-slate-600'}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {t.avatar_url ? (
                            <img src={t.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 text-xs font-bold">
                              {t.display_name?.charAt(0) ?? 'T'}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-800">{t.display_name}</p>
                            {t.is_verified && <span className="text-xs text-blue-600">✓ Verified</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 capitalize">{t.trading_style?.replace('_', ' ')}</td>
                      <td className="px-4 py-3 font-semibold text-green-600">{t.win_rate.toFixed(1)}%</td>
                      <td className="px-4 py-3 font-semibold text-blue-600">{formatPercent(t.monthly_return_pct)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatPercent(t.total_return_pct)}</td>
                      <td className="px-4 py-3 text-slate-600">{t.followers_count.toLocaleString()}</td>
                      <td className="px-4 py-3 text-slate-600">{formatCurrency(t.assets_under_management)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={t.is_active ? 'success' : 'danger'} size="sm">
                          {t.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Investment Plans */}
      {tab === 'plans' && (
        <Card padding="none">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Investment Plans Performance</h3>
            <Badge variant="info" size="sm">{plans.length} plans</Badge>
          </div>
          {loadingLive ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['Plan', 'ROI %', 'Duration', 'Min', 'Max', 'Risk', 'Status'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {plans.map((p, i) => (
                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{p.description}</p>
                      </td>
                      <td className="px-4 py-3 font-bold text-green-600 text-base">{p.roi_percentage}%</td>
                      <td className="px-4 py-3 text-slate-600">{p.period_days} days</td>
                      <td className="px-4 py-3 text-slate-600">{formatCurrency(p.min_amount)}</td>
                      <td className="px-4 py-3 text-slate-600">{formatCurrency(p.max_amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${p.risk_level === 'low' ? 'bg-green-100 text-green-700' : p.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {p.risk_level}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={p.is_active ? 'success' : 'danger'} size="sm">
                          {p.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ROI comparison bar */}
          {!loadingLive && plans.length > 0 && (
            <div className="p-5 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">ROI Comparison</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={plans.map((p) => ({ name: p.name, roi: p.roi_percentage }))} layout="vertical" margin={{ top: 0, right: 20, left: 60, bottom: 0 }}>
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip {...TOOLTIP} formatter={(v: unknown) => [`${v}%`, 'ROI']} />
                  <Bar dataKey="roi" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {plans.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
