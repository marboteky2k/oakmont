import { useEffect, useState, useMemo } from 'react'
import { motion } from 'framer-motion'

import {
  MonthlyReturnsChart, WinLossDonutChart,
  EquityCurveChart, DrawdownChart, CopyPerformanceChart,
} from '@/components/charts'
import type { PeriodKey } from '@/components/charts'
import { format, parseISO, subMonths } from 'date-fns'
import { AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useTraderProfile } from '@/hooks/useTraderProfile'
import { formatPercent } from '@/lib/utils'
import type { TraderPerformance as TraderPerfRow } from '@/types/database'

function buildEquity(perf: TraderPerfRow[]) {
  let cum = 10000
  return perf.map((p) => {
    cum *= 1 + p.return_pct / 100
    return { label: format(parseISO(p.month + '-01'), 'MMM yy'), equity: parseFloat(cum.toFixed(2)) }
  })
}

function buildDrawdownKeyed(perf: TraderPerfRow[]) {
  let peak = 100, cum = 100
  return perf.map((p) => {
    cum *= 1 + p.return_pct / 100
    if (cum > peak) peak = cum
    const dd = ((cum - peak) / peak) * 100
    return { label: format(parseISO(p.month + '-01'), 'MMM yy'), drawdown: parseFloat(dd.toFixed(2)) }
  })
}

function buildCopyPerf(perf: TraderPerfRow[]) {
  let cumProfit = 0
  return perf.map((p) => {
    cumProfit += p.profit_usd
    return {
      label: format(parseISO(p.month + '-01'), 'MMM yy'),
      monthly: parseFloat(p.profit_usd.toFixed(2)),
      cumulative: parseFloat(cumProfit.toFixed(2)),
    }
  })
}

function toPeriodRecord<T>(all: TraderPerfRow[], mapper: (slice: TraderPerfRow[]) => T[]): Record<PeriodKey, T[]> {
  return {
    '1W': mapper(all.slice(-2)),
    '1M': mapper(all.slice(-3)),
    '3M': mapper(all.slice(-6)),
    '1Y': mapper(all.slice(-12)),
  }
}

// Generate synthetic data if no real performance records
function generateSyntheticPerf(monthlyReturnPct: number, winRate: number): TraderPerfRow[] {
  return Array.from({ length: 12 }, (_, i) => {
    const variance = (((i * 7 + 3) % 5) - 2) * 0.5
    const returnPct = parseFloat((monthlyReturnPct + variance).toFixed(2))
    const tradesCount = 18 + (i % 5) * 2
    const winCount = Math.round(tradesCount * (winRate / 100))
    const d = subMonths(new Date(2026, 4, 1), 11 - i)
    return {
      id: `synthetic-${i}`,
      trader_id: '',
      month: format(d, 'yyyy-MM'),
      return_pct: returnPct,
      trades_count: tradesCount,
      win_count: winCount,
      loss_count: tradesCount - winCount,
      profit_usd: parseFloat((returnPct * 1200).toFixed(2)),
      created_at: d.toISOString(),
    }
  })
}

export default function TraderPerformance() {
  const { trader, loading: traderLoading } = useTraderProfile()
  const [rawPerf, setRawPerf] = useState<TraderPerfRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!trader) return
    const fetch = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('trader_performance')
        .select('*')
        .eq('trader_id', trader.id)
        .order('month', { ascending: true })
        .limit(24)
      setRawPerf((data as TraderPerfRow[]) ?? [])
      setLoading(false)
    }
    fetch()
  }, [trader])

  // Full dataset (real or synthetic)
  const base = useMemo(() => {
    if (!trader) return []
    return rawPerf.length >= 2
      ? rawPerf
      : generateSyntheticPerf(trader.monthly_return_pct, trader.win_rate)
  }, [rawPerf, trader])

  // Aggregate stats (from last 12 months)
  const perf12 = useMemo(() => base.slice(-12), [base])
  const totalWins   = useMemo(() => perf12.reduce((s, p) => s + p.win_count, 0), [perf12])
  const totalLosses = useMemo(() => perf12.reduce((s, p) => s + p.loss_count, 0), [perf12])

  // Period-keyed datasets for each chart
  const monthlyReturnsData = useMemo(() => toPeriodRecord(base, (sl) =>
    sl.map(p => ({ label: format(parseISO(p.month + '-01'), 'MMM yy'), return: p.return_pct }))
  ), [base])

  const equityData = useMemo(() => toPeriodRecord(base, buildEquity), [base])

  const drawdownData = useMemo(() => toPeriodRecord(base, buildDrawdownKeyed), [base])

  const copyPerfData = useMemo(() => toPeriodRecord(base, buildCopyPerf), [base])
  const pieData = useMemo(
    () => [
      { name: 'Wins', value: totalWins },
      { name: 'Losses', value: totalLosses },
    ],
    [totalWins, totalLosses],
  )

  if (traderLoading) {
    return <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
  }

  if (!trader) {
    return (
      <Card>
        <div className="text-center py-16">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">Set up your trader profile first.</p>
          <Button onClick={() => (window.location.href = '/trader/profile')}>Set Up Profile</Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Performance Charts</h1>
        <p className="text-slate-500 text-sm mt-1">
          {rawPerf.length < 2 ? 'Showing projected data — sync real performance from your records.' : 'Based on your real trading history.'}
        </p>
      </div>

      {/* Row 1: Monthly Returns + Win/Loss */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlyReturnsChart data={monthlyReturnsData} loading={loading} height={210} />
        </div>
        <WinLossDonutChart
          wins={totalWins || 68}
          losses={totalLosses || 32}
          loading={loading}
          height={170}
        />
      </div>

      {/* Row 2: Equity Curve */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <EquityCurveChart data={equityData} loading={loading} title="Cumulative Equity Curve" height={220} />
      </motion.div>

      {/* Row 3: Drawdown + Copy Performance */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <DrawdownChart data={drawdownData} loading={loading} height={200} />
        <CopyPerformanceChart data={copyPerfData} loading={loading} title="Monthly P&L vs Cumulative" height={200} />
      </motion.div>

      {/* Monthly detail table */}
      <Card>
        <h3 className="font-semibold text-slate-900 mb-5">Monthly Detail</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {['Month', 'Return', 'Trades', 'Wins', 'Losses', 'Win Rate', 'Profit'].map((h) => (
                  <th key={h} className="text-left pb-3 px-2 font-semibold text-slate-400 text-xs uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[...perf12].reverse().map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="hover:bg-slate-50"
                >
                  <td className="py-3 px-2 font-medium text-slate-700">
                    {format(parseISO(p.month + '-01'), 'MMMM yyyy')}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`font-semibold ${p.return_pct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatPercent(p.return_pct)}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-slate-600">{p.trades_count}</td>
                  <td className="py-3 px-2 text-green-600">{p.win_count}</td>
                  <td className="py-3 px-2 text-red-500">{p.loss_count}</td>
                  <td className="py-3 px-2 text-slate-600">
                    {p.trades_count > 0 ? ((p.win_count / p.trades_count) * 100).toFixed(1) + '%' : '—'}
                  </td>
                  <td className="py-3 px-2">
                    <span className={`font-medium ${p.profit_usd >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {p.profit_usd >= 0 ? '+' : ''}${p.profit_usd.toFixed(2)}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
