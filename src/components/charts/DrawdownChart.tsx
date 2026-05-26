import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { ChartContainer } from './ChartContainer'
import type { PeriodKey } from './shared'
import { PERIODS, BLUE } from './shared'

const DEMO: Record<PeriodKey, { label: string; drawdown: number }[]> = {
  '1W': [
    { label: 'Mon', drawdown: 0 },    { label: 'Tue', drawdown: -0.8 },
    { label: 'Wed', drawdown: -0.3 }, { label: 'Thu', drawdown: -1.2 },
    { label: 'Fri', drawdown: -0.5 }, { label: 'Sat', drawdown: -0.2 },
    { label: 'Sun', drawdown: 0 },
  ],
  '1M': [
    { label: 'D3',  drawdown: -0.2 }, { label: 'D6',  drawdown: -1.4 },
    { label: 'D9',  drawdown: -0.8 }, { label: 'D12', drawdown: -2.1 },
    { label: 'D15', drawdown: -1.6 }, { label: 'D18', drawdown: -0.9 },
    { label: 'D21', drawdown: -3.2 }, { label: 'D24', drawdown: -2.4 },
    { label: 'D27', drawdown: -1.1 }, { label: 'D30', drawdown: -0.3 },
  ],
  '3M': [
    { label: 'Wk 1',  drawdown: 0 },    { label: 'Wk 2',  drawdown: -0.5 },
    { label: 'Wk 3',  drawdown: -1.2 }, { label: 'Wk 4',  drawdown: -3.4 },
    { label: 'Wk 5',  drawdown: -2.1 }, { label: 'Wk 6',  drawdown: -0.8 },
    { label: 'Wk 7',  drawdown: -1.5 }, { label: 'Wk 8',  drawdown: -4.2 },
    { label: 'Wk 9',  drawdown: -3.0 }, { label: 'Wk 10', drawdown: -1.8 },
    { label: 'Wk 11', drawdown: -0.9 }, { label: 'Wk 12', drawdown: -0.2 },
  ],
  '1Y': [
    { label: 'Jan', drawdown: 0 },    { label: 'Feb', drawdown: -1.2 },
    { label: 'Mar', drawdown: -3.4 }, { label: 'Apr', drawdown: -1.8 },
    { label: 'May', drawdown: -5.1 }, { label: 'Jun', drawdown: -2.9 },
    { label: 'Jul', drawdown: -6.8 }, { label: 'Aug', drawdown: -4.2 },
    { label: 'Sep', drawdown: -2.1 }, { label: 'Oct', drawdown: -3.7 },
    { label: 'Nov', drawdown: -1.3 }, { label: 'Dec', drawdown: -0.4 },
  ],
}

interface Props {
  data?: Record<PeriodKey, { label: string; drawdown: number }[]>
  loading?: boolean
  title?: string
  height?: number
}

function DrawdownTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const v = payload[0].value as number
  return (
    <div className="bg-white rounded-xl shadow-lg border border-red-100 px-3.5 py-2.5">
      <p className="text-xs text-slate-400 mb-1">{payload[0].payload.label}</p>
      <p className="text-sm font-bold text-red-500">{v.toFixed(2)}%</p>
      <p className="text-xs text-slate-400 mt-0.5">Drawdown from peak</p>
    </div>
  )
}

export function DrawdownChart({
  data,
  loading,
  title = 'Drawdown',
  height = 200,
}: Props) {
  const [period, setPeriod] = useState<PeriodKey>('1Y')
  const dataset = (data ?? DEMO)[period]
  const maxDD   = Math.min(...dataset.map(d => d.drawdown))

  return (
    <ChartContainer
      title={title}
      subtitle={`Max drawdown: ${maxDD.toFixed(2)}%`}
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
              <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ef4444" stopOpacity={0} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.22} />
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
              tickFormatter={v => `${v}%`}
            />
            <Tooltip content={<DrawdownTooltip />} />
            <ReferenceLine y={0} stroke="#e2e8f0" strokeWidth={1.5} />
            <Area
              type="monotone"
              dataKey="drawdown"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#ddGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
              isAnimationActive
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </ChartContainer>
  )
}
