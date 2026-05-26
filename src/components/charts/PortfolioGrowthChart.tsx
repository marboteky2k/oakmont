import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { ChartContainer } from './ChartContainer'
import { formatCurrency } from '@/lib/utils'
import type { PeriodKey } from './shared'
import { PERIODS, BLUE } from './shared'

const DEMO: Record<PeriodKey, { label: string; portfolio: number; benchmark: number }[]> = {
  '1W': [
    { label: 'Mon', portfolio: 18600, benchmark: 18400 },
    { label: 'Tue', portfolio: 18750, benchmark: 18430 },
    { label: 'Wed', portfolio: 19100, benchmark: 18480 },
    { label: 'Thu', portfolio: 19050, benchmark: 18500 },
    { label: 'Fri', portfolio: 19400, benchmark: 18560 },
    { label: 'Sat', portfolio: 19600, benchmark: 18580 },
    { label: 'Sun', portfolio: 19820, benchmark: 18620 },
  ],
  '1M': Array.from({ length: 8 }, (_, i) => ({
    label: `W${i + 1}`,
    portfolio: 16000 + i * 490 + (i % 2) * 130,
    benchmark: 16000 + i * 290,
  })),
  '3M': Array.from({ length: 12 }, (_, i) => ({
    label: `Wk ${i + 1}`,
    portfolio: Math.round(13000 + i * 560 + Math.sin(i) * 210),
    benchmark: 13000 + i * 330,
  })),
  '1Y': [
    { label: 'Jan', portfolio: 10000, benchmark: 10000 },
    { label: 'Feb', portfolio: 11200, benchmark: 10600 },
    { label: 'Mar', portfolio: 10800, benchmark: 10400 },
    { label: 'Apr', portfolio: 12500, benchmark: 11000 },
    { label: 'May', portfolio: 13100, benchmark: 11500 },
    { label: 'Jun', portfolio: 14200, benchmark: 12000 },
    { label: 'Jul', portfolio: 13700, benchmark: 12200 },
    { label: 'Aug', portfolio: 15400, benchmark: 12800 },
    { label: 'Sep', portfolio: 16100, benchmark: 13300 },
    { label: 'Oct', portfolio: 15800, benchmark: 13600 },
    { label: 'Nov', portfolio: 17200, benchmark: 14200 },
    { label: 'Dec', portfolio: 18600, benchmark: 14800 },
  ],
}

interface Props {
  data?: Record<PeriodKey, { label: string; portfolio: number; benchmark: number }[]>
  loading?: boolean
  title?: string
  height?: number
}

function PortfolioTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-lg border border-blue-100 px-3.5 py-2.5 min-w-[170px]">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 text-xs mb-1 last:mb-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-slate-500">{entry.name}</span>
          </div>
          <span className="font-semibold text-slate-900">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function PortfolioGrowthChart({
  data,
  loading,
  title = 'Portfolio Growth',
  height = 250,
}: Props) {
  const [period, setPeriod] = useState<PeriodKey>('1Y')
  const dataset = (data ?? DEMO)[period]

  return (
    <ChartContainer
      title={title}
      subtitle="Portfolio vs. market benchmark"
      loading={loading}
      periods={PERIODS}
      period={period}
      onPeriodChange={setPeriod}
      skeletonHeight={height}
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={dataset} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="pgPortfolioGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={BLUE.dark} stopOpacity={0.2} />
                <stop offset="95%" stopColor={BLUE.dark} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="pgBenchGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={BLUE.light} stopOpacity={0.18} />
                <stop offset="95%" stopColor={BLUE.light} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={BLUE.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: BLUE.axis }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: BLUE.axis }}
              axisLine={false} tickLine={false}
              tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
              width={44}
            />
            <Tooltip content={<PortfolioTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              iconType="circle"
              iconSize={8}
            />
            <Area
              type="monotone"
              dataKey="portfolio"
              name="Portfolio"
              stroke={BLUE.dark}
              strokeWidth={2.5}
              fill="url(#pgPortfolioGrad)"
              dot={false}
              activeDot={{ r: 4, fill: BLUE.dark, stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="benchmark"
              name="Benchmark"
              stroke={BLUE.light}
              strokeWidth={2}
              strokeDasharray="5 4"
              fill="url(#pgBenchGrad)"
              dot={false}
              activeDot={{ r: 4, fill: BLUE.light, stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive
              animationDuration={900}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </ChartContainer>
  )
}
