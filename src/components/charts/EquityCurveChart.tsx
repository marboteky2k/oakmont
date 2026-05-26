import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ChartContainer } from './ChartContainer'
import { formatCurrency } from '@/lib/utils'
import type { PeriodKey } from './shared'
import { PERIODS, BLUE } from './shared'

const DEMO: Record<PeriodKey, { label: string; equity: number }[]> = {
  '1W': [
    { label: 'Mon', equity: 18600 }, { label: 'Tue', equity: 18720 },
    { label: 'Wed', equity: 18960 }, { label: 'Thu', equity: 19140 },
    { label: 'Fri', equity: 19460 }, { label: 'Sat', equity: 19640 },
    { label: 'Sun', equity: 19880 },
  ],
  '1M': [
    { label: 'D3',  equity: 15200 }, { label: 'D6',  equity: 15900 },
    { label: 'D9',  equity: 15600 }, { label: 'D12', equity: 16400 },
    { label: 'D15', equity: 16900 }, { label: 'D18', equity: 16600 },
    { label: 'D21', equity: 17400 }, { label: 'D24', equity: 17900 },
    { label: 'D27', equity: 18200 }, { label: 'D30', equity: 18600 },
  ],
  '3M': Array.from({ length: 12 }, (_, i) => ({
    label: `W${i + 1}`,
    equity: 12000 + Math.round(i * 560 + Math.sin(i * 0.9) * 280),
  })),
  '1Y': [
    { label: 'Jan', equity: 10000 }, { label: 'Feb', equity: 11200 },
    { label: 'Mar', equity: 10800 }, { label: 'Apr', equity: 12500 },
    { label: 'May', equity: 13100 }, { label: 'Jun', equity: 14200 },
    { label: 'Jul', equity: 13700 }, { label: 'Aug', equity: 15400 },
    { label: 'Sep', equity: 16100 }, { label: 'Oct', equity: 15800 },
    { label: 'Nov', equity: 17200 }, { label: 'Dec', equity: 18600 },
  ],
}

interface Props {
  data?: Record<PeriodKey, { label: string; equity: number }[]>
  loading?: boolean
  title?: string
  height?: number
}

function EquityTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-lg border border-blue-100 px-3.5 py-2.5">
      <p className="text-xs text-slate-400 mb-1">{payload[0].payload.label}</p>
      <p className="text-sm font-bold text-slate-900">{formatCurrency(payload[0].value)}</p>
      <p className="text-xs text-blue-500 mt-0.5">Equity value</p>
    </div>
  )
}

export function EquityCurveChart({
  data,
  loading,
  title = 'Equity Curve',
  height = 240,
}: Props) {
  const [period, setPeriod] = useState<PeriodKey>('1Y')
  const dataset = (data ?? DEMO)[period]
  const startVal = dataset[0]?.equity ?? 0
  const endVal   = dataset[dataset.length - 1]?.equity ?? 0
  const totalReturn = startVal > 0 ? ((endVal - startVal) / startVal) * 100 : 0
  const isUp = totalReturn >= 0

  return (
    <ChartContainer
      title={title}
      subtitle={`${isUp ? '+' : ''}${totalReturn.toFixed(2)}% over period`}
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
              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={BLUE.mid} stopOpacity={0.22} />
                <stop offset="95%" stopColor={BLUE.mid} stopOpacity={0} />
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
            <Tooltip content={<EquityTooltip />} />
            <Area
              type="monotone"
              dataKey="equity"
              stroke={BLUE.mid}
              strokeWidth={2.5}
              fill="url(#equityGrad)"
              dot={false}
              activeDot={{ r: 5, fill: BLUE.mid, strokeWidth: 2, stroke: '#fff' }}
              isAnimationActive
              animationDuration={800}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </ChartContainer>
  )
}
