import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend, ReferenceLine,
} from 'recharts'
import { ChartContainer } from './ChartContainer'
import { formatCurrency } from '@/lib/utils'
import type { PeriodKey } from './shared'
import { PERIODS, BLUE } from './shared'

const DEMO: Record<PeriodKey, { label: string; monthly: number; cumulative: number }[]> = {
  '1W': [
    { label: 'Mon', monthly: 120,  cumulative: 4840 },
    { label: 'Tue', monthly: -30,  cumulative: 4810 },
    { label: 'Wed', monthly: 210,  cumulative: 5020 },
    { label: 'Thu', monthly: 80,   cumulative: 5100 },
    { label: 'Fri', monthly: 190,  cumulative: 5290 },
    { label: 'Sat', monthly: 150,  cumulative: 5440 },
    { label: 'Sun', monthly: 60,   cumulative: 5500 },
  ],
  '1M': [
    { label: 'Wk 1', monthly: 480,  cumulative: 4480 },
    { label: 'Wk 2', monthly: -120, cumulative: 4360 },
    { label: 'Wk 3', monthly: 680,  cumulative: 5040 },
    { label: 'Wk 4', monthly: 310,  cumulative: 5350 },
  ],
  '3M': [
    { label: 'Feb', monthly: 1200,  cumulative: 3800 },
    { label: 'Mar', monthly: -400,  cumulative: 3400 },
    { label: 'Apr', monthly: 1800,  cumulative: 5200 },
  ],
  '1Y': [
    { label: 'Jan', monthly: 320,   cumulative: 320  },
    { label: 'Feb', monthly: -110,  cumulative: 210  },
    { label: 'Mar', monthly: 450,   cumulative: 660  },
    { label: 'Apr', monthly: 280,   cumulative: 940  },
    { label: 'May', monthly: -90,   cumulative: 850  },
    { label: 'Jun', monthly: 520,   cumulative: 1370 },
    { label: 'Jul', monthly: 370,   cumulative: 1740 },
    { label: 'Aug', monthly: -210,  cumulative: 1530 },
    { label: 'Sep', monthly: 490,   cumulative: 2020 },
    { label: 'Oct', monthly: 180,   cumulative: 2200 },
    { label: 'Nov', monthly: 610,   cumulative: 2810 },
    { label: 'Dec', monthly: 240,   cumulative: 3050 },
  ],
}

interface Props {
  data?: Record<PeriodKey, { label: string; monthly: number; cumulative: number }[]>
  loading?: boolean
  title?: string
  height?: number
}

function CopyPerfTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-lg border border-blue-100 px-3.5 py-2.5 min-w-[170px]">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      {payload.map((e: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 text-xs mb-1 last:mb-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm" style={{ background: e.color ?? e.stroke }} />
            <span className="text-slate-500">{e.name}</span>
          </div>
          <span className={`font-semibold ${(e.value as number) < 0 ? 'text-red-500' : 'text-slate-900'}`}>
            {(e.value as number) < 0 ? '' : '+'}{formatCurrency(e.value as number)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function CopyPerformanceChart({
  data,
  loading,
  title = 'Copy Trade Performance',
  height = 240,
}: Props) {
  const [period, setPeriod] = useState<PeriodKey>('1Y')
  const dataset = (data ?? DEMO)[period]

  return (
    <ChartContainer
      title={title}
      subtitle="Monthly P&L bars · cumulative profit line"
      loading={loading}
      periods={PERIODS}
      period={period}
      onPeriodChange={setPeriod}
      skeletonHeight={height}
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={dataset} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={BLUE.grid} vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: BLUE.axis }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              yAxisId="bar"
              tick={{ fontSize: 11, fill: BLUE.axis }}
              axisLine={false} tickLine={false}
              tickFormatter={v => `$${v}`}
              width={44}
            />
            <YAxis
              yAxisId="line"
              orientation="right"
              tick={{ fontSize: 11, fill: BLUE.axis }}
              axisLine={false} tickLine={false}
              tickFormatter={v => `$${(v / 1000).toFixed(1)}k`}
              width={48}
            />
            <Tooltip content={<CopyPerfTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />
            <ReferenceLine yAxisId="bar" y={0} stroke="#e2e8f0" strokeWidth={1.5} />
            <Bar
              yAxisId="bar"
              dataKey="monthly"
              name="Monthly P&L"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
              isAnimationActive
              animationDuration={700}
            >
              {dataset.map((d, i) => (
                <Cell key={i} fill={d.monthly >= 0 ? BLUE.mid : '#ef4444'} />
              ))}
            </Bar>
            <Line
              yAxisId="line"
              type="monotone"
              dataKey="cumulative"
              name="Cumulative Profit"
              stroke={BLUE.dark}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: BLUE.dark, stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive
              animationDuration={900}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>
    </ChartContainer>
  )
}
