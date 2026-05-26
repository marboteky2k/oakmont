import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import { ChartContainer } from './ChartContainer'
import type { PeriodKey } from './shared'
import { PERIODS, BLUE } from './shared'

const DEMO: Record<PeriodKey, { label: string; return: number }[]> = {
  '1W': [
    { label: 'Mon', return: 0.8 }, { label: 'Tue', return: -0.3 },
    { label: 'Wed', return: 1.2 }, { label: 'Thu', return: 0.5 },
    { label: 'Fri', return: -0.1 }, { label: 'Sat', return: 0.9 },
    { label: 'Sun', return: 0.2 },
  ],
  '1M': [
    { label: 'Wk 1', return: 2.1 }, { label: 'Wk 2', return: -0.8 },
    { label: 'Wk 3', return: 3.2 }, { label: 'Wk 4', return: 1.5 },
  ],
  '3M': [
    { label: 'Feb', return: 4.2 }, { label: 'Mar', return: -1.8 },
    { label: 'Apr', return: 5.1 },
  ],
  '1Y': [
    { label: 'Jan', return: 3.2 }, { label: 'Feb', return: -1.1 },
    { label: 'Mar', return: 4.5 }, { label: 'Apr', return: 2.8 },
    { label: 'May', return: -0.9 }, { label: 'Jun', return: 5.2 },
    { label: 'Jul', return: 3.7 }, { label: 'Aug', return: -2.1 },
    { label: 'Sep', return: 4.9 }, { label: 'Oct', return: 1.8 },
    { label: 'Nov', return: 6.1 }, { label: 'Dec', return: 2.4 },
  ],
}

interface Props {
  data?: Record<PeriodKey, { label: string; return: number }[]>
  loading?: boolean
  title?: string
  height?: number
}

function MonthlyTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const v = payload[0].value as number
  return (
    <div className="bg-white rounded-xl shadow-lg border border-blue-100 px-3.5 py-2.5">
      <p className="text-xs text-slate-400 mb-1">{payload[0].payload.label}</p>
      <p className={`text-sm font-bold ${v >= 0 ? 'text-green-600' : 'text-red-500'}`}>
        {v >= 0 ? '+' : ''}{v.toFixed(2)}%
      </p>
    </div>
  )
}

export function MonthlyReturnsChart({
  data,
  loading,
  title = 'Monthly Returns',
  height = 220,
}: Props) {
  const [period, setPeriod] = useState<PeriodKey>('1Y')
  const dataset = (data ?? DEMO)[period]
  const avg   = dataset.reduce((s, d) => s + d.return, 0) / Math.max(dataset.length, 1)
  const best  = Math.max(...dataset.map(d => d.return))
  const worst = Math.min(...dataset.map(d => d.return))

  return (
    <ChartContainer
      title={title}
      subtitle={`Avg ${avg.toFixed(2)}% · Best +${best.toFixed(2)}% · Worst ${worst.toFixed(2)}%`}
      loading={loading}
      periods={PERIODS}
      period={period}
      onPeriodChange={setPeriod}
      skeletonHeight={height}
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={dataset} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={BLUE.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: BLUE.axis }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: BLUE.axis }}
              axisLine={false} tickLine={false}
              tickFormatter={v => `${v}%`}
            />
            <Tooltip content={<MonthlyTooltip />} />
            <ReferenceLine y={0} stroke="#e2e8f0" strokeWidth={1.5} />
            <Bar
              dataKey="return"
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
            >
              {dataset.map((d, i) => (
                <Cell key={i} fill={d.return >= 0 ? '#22c55e' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </ChartContainer>
  )
}
