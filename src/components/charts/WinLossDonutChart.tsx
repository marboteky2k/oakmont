import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartContainer } from './ChartContainer'

const WIN_COLOR  = '#22c55e'
const LOSS_COLOR = '#ef4444'

interface Props {
  wins?: number
  losses?: number
  loading?: boolean
  title?: string
  height?: number
}

function DonutTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-lg border border-blue-100 px-3.5 py-2.5">
      <p className="text-sm font-bold text-slate-900">
        {payload[0].name}: {payload[0].value}
      </p>
    </div>
  )
}

export function WinLossDonutChart({
  wins = 68,
  losses = 32,
  loading,
  title = 'Win / Loss Ratio',
  height = 200,
}: Props) {
  const total   = wins + losses
  const winRate = total > 0 ? (wins / total) * 100 : 0
  const data = [
    { name: 'Wins',   value: wins },
    { name: 'Losses', value: losses },
  ]

  return (
    <ChartContainer
      title={title}
      subtitle={`${total} total trades analyzed`}
      loading={loading}
      skeletonHeight={height + 40}
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        {/* Pie with center label overlay */}
        <div className="relative">
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={data}
                cx="50%" cy="50%"
                innerRadius={Math.round(height * 0.32)}
                outerRadius={Math.round(height * 0.45)}
                paddingAngle={3}
                dataKey="value"
                isAnimationActive
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              >
                <Cell fill={WIN_COLOR} />
                <Cell fill={LOSS_COLOR} />
              </Pie>
              <Tooltip content={<DonutTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-900">{winRate.toFixed(1)}%</p>
              <p className="text-xs text-slate-400 mt-0.5">Win Rate</p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-3">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: i === 0 ? WIN_COLOR : LOSS_COLOR }}
              />
              <span className="text-xs text-slate-500">{d.name}</span>
              <span className="text-xs font-semibold text-slate-700">{d.value}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </ChartContainer>
  )
}
