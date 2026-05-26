import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ChartContainer } from './ChartContainer'
import type { PeriodKey } from './shared'
import { PERIODS, BLUE } from './shared'

const DEMO: Record<PeriodKey, { label: string; total: number; newUsers: number }[]> = {
  '1W': [
    { label: 'Mon', total: 1240, newUsers: 8 },
    { label: 'Tue', total: 1255, newUsers: 15 },
    { label: 'Wed', total: 1268, newUsers: 13 },
    { label: 'Thu', total: 1280, newUsers: 12 },
    { label: 'Fri', total: 1298, newUsers: 18 },
    { label: 'Sat', total: 1306, newUsers: 8 },
    { label: 'Sun', total: 1314, newUsers: 8 },
  ],
  '1M': [
    { label: 'Wk 1', total: 1160, newUsers: 42 },
    { label: 'Wk 2', total: 1220, newUsers: 60 },
    { label: 'Wk 3', total: 1272, newUsers: 52 },
    { label: 'Wk 4', total: 1314, newUsers: 42 },
  ],
  '3M': [
    { label: 'Feb', total: 850,  newUsers: 120 },
    { label: 'Mar', total: 1020, newUsers: 170 },
    { label: 'Apr', total: 1240, newUsers: 220 },
  ],
  '1Y': [
    { label: 'Jan', total: 120,  newUsers: 120 },
    { label: 'Feb', total: 185,  newUsers: 65 },
    { label: 'Mar', total: 240,  newUsers: 55 },
    { label: 'Apr', total: 310,  newUsers: 70 },
    { label: 'May', total: 420,  newUsers: 110 },
    { label: 'Jun', total: 530,  newUsers: 110 },
    { label: 'Jul', total: 660,  newUsers: 130 },
    { label: 'Aug', total: 810,  newUsers: 150 },
    { label: 'Sep', total: 940,  newUsers: 130 },
    { label: 'Oct', total: 1080, newUsers: 140 },
    { label: 'Nov', total: 1190, newUsers: 110 },
    { label: 'Dec', total: 1314, newUsers: 124 },
  ],
}

interface Props {
  data?: Record<PeriodKey, { label: string; total: number; newUsers: number }[]>
  loading?: boolean
  height?: number
}

function UserTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-lg border border-blue-100 px-3.5 py-2.5 min-w-[150px]">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      {payload.map((e: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 text-xs mb-1 last:mb-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
            <span className="text-slate-500">{e.name}</span>
          </div>
          <span className="font-semibold text-slate-900">{e.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  )
}

export function UserGrowthChart({ data, loading, height = 220 }: Props) {
  const [period, setPeriod] = useState<PeriodKey>('1Y')
  const dataset = (data ?? DEMO)[period]
  const latest  = dataset[dataset.length - 1]?.total ?? 0

  return (
    <ChartContainer
      title="User Growth"
      subtitle={`${latest.toLocaleString()} total registered users`}
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
              <linearGradient id="ugTotalGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={BLUE.dark} stopOpacity={0.18} />
                <stop offset="95%" stopColor={BLUE.dark} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ugNewGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={BLUE.mid} stopOpacity={0.14} />
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
            />
            <Tooltip content={<UserTooltip />} />
            <Area
              type="monotone"
              dataKey="total"
              name="Total Users"
              stroke={BLUE.dark}
              strokeWidth={2.5}
              fill="url(#ugTotalGrad)"
              dot={false}
              activeDot={{ r: 4, fill: BLUE.dark, stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive
              animationDuration={800}
            />
            <Area
              type="monotone"
              dataKey="newUsers"
              name="New Users"
              stroke={BLUE.mid}
              strokeWidth={1.5}
              strokeDasharray="5 3"
              fill="url(#ugNewGrad)"
              dot={false}
              activeDot={{ r: 4, fill: BLUE.mid, stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive
              animationDuration={900}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </ChartContainer>
  )
}
