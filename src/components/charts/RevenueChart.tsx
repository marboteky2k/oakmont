import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ChartContainer } from './ChartContainer'
import { formatCurrency } from '@/lib/utils'
import type { PeriodKey } from './shared'
import { PERIODS, BLUE } from './shared'

const DEMO: Record<PeriodKey, { label: string; revenue: number; fees: number }[]> = {
  '1W': [
    { label: 'Mon', revenue: 820,  fees: 420 },
    { label: 'Tue', revenue: 950,  fees: 510 },
    { label: 'Wed', revenue: 1100, fees: 600 },
    { label: 'Thu', revenue: 890,  fees: 470 },
    { label: 'Fri', revenue: 1340, fees: 720 },
    { label: 'Sat', revenue: 680,  fees: 340 },
    { label: 'Sun', revenue: 540,  fees: 280 },
  ],
  '1M': [
    { label: 'Wk 1', revenue: 4200, fees: 2100 },
    { label: 'Wk 2', revenue: 5100, fees: 2600 },
    { label: 'Wk 3', revenue: 5800, fees: 3000 },
    { label: 'Wk 4', revenue: 4900, fees: 2500 },
  ],
  '3M': [
    { label: 'Feb', revenue: 14200, fees: 7100 },
    { label: 'Mar', revenue: 18500, fees: 9200 },
    { label: 'Apr', revenue: 22400, fees: 11100 },
  ],
  '1Y': [
    { label: 'Jan', revenue: 2100,  fees: 1050 },
    { label: 'Feb', revenue: 2900,  fees: 1450 },
    { label: 'Mar', revenue: 3550,  fees: 1775 },
    { label: 'Apr', revenue: 3250,  fees: 1625 },
    { label: 'May', revenue: 4450,  fees: 2225 },
    { label: 'Jun', revenue: 5100,  fees: 2550 },
    { label: 'Jul', revenue: 4800,  fees: 2400 },
    { label: 'Aug', revenue: 5900,  fees: 2950 },
    { label: 'Sep', revenue: 6700,  fees: 3350 },
    { label: 'Oct', revenue: 7200,  fees: 3600 },
    { label: 'Nov', revenue: 8100,  fees: 4050 },
    { label: 'Dec', revenue: 9400,  fees: 4700 },
  ],
}

interface Props {
  data?: Record<PeriodKey, { label: string; revenue: number; fees: number }[]>
  loading?: boolean
  height?: number
}

function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-lg border border-blue-100 px-3.5 py-2.5 min-w-[170px]">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      {payload.map((e: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 text-xs mb-1 last:mb-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm" style={{ background: e.fill }} />
            <span className="text-slate-500">{e.name}</span>
          </div>
          <span className="font-semibold text-slate-900">{formatCurrency(e.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function RevenueChart({ data, loading, height = 220 }: Props) {
  const [period, setPeriod] = useState<PeriodKey>('1Y')
  const dataset = (data ?? DEMO)[period]
  const total   = dataset.reduce((s, d) => s + d.revenue, 0)

  return (
    <ChartContainer
      title="Platform Revenue"
      subtitle={`${formatCurrency(total)} for period`}
      loading={loading}
      periods={PERIODS}
      period={period}
      onPeriodChange={setPeriod}
      skeletonHeight={height}
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={dataset} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={BLUE.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: BLUE.axis }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: BLUE.axis }}
              axisLine={false} tickLine={false}
              tickFormatter={v => `$${(v / 1000).toFixed(1)}k`}
              width={44}
            />
            <Tooltip content={<RevenueTooltip />} />
            <Bar
              dataKey="revenue"
              name="Total Revenue"
              fill={BLUE.mid}
              radius={[4, 4, 0, 0]}
              maxBarSize={30}
              isAnimationActive
              animationDuration={700}
            />
            <Bar
              dataKey="fees"
              name="Trading Fees"
              fill={BLUE.pale}
              radius={[4, 4, 0, 0]}
              maxBarSize={30}
              isAnimationActive
              animationDuration={800}
            />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </ChartContainer>
  )
}
