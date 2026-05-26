import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartContainer } from './ChartContainer'
import { formatCurrency } from '@/lib/utils'

const DEFAULT_COLORS = ['#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE']

const DEMO_ALLOCATIONS = [
  { name: 'Copy Trading', value: 45000 },
  { name: 'Investments',  value: 30000 },
  { name: 'Idle Cash',    value: 15000 },
  { name: 'Cash Reserve', value: 10000 },
]

interface Allocation {
  name: string
  value: number
  color?: string
}

interface Props {
  allocations?: Allocation[]
  loading?: boolean
  title?: string
}

function AllocationTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="bg-white rounded-xl shadow-lg border border-blue-100 px-3.5 py-2.5">
      <p className="text-xs text-slate-400 mb-0.5">{d.name}</p>
      <p className="text-sm font-bold text-slate-900">{formatCurrency(d.value)}</p>
      <p className="text-xs text-blue-500 mt-0.5">{d.payload.pct?.toFixed(1)}% of portfolio</p>
    </div>
  )
}

export function AssetAllocationChart({ allocations, loading, title = 'Asset Allocation' }: Props) {
  const raw   = allocations ?? DEMO_ALLOCATIONS
  const total = raw.reduce((s, a) => s + a.value, 0)
  const data  = raw.map((a, i) => ({
    name:  a.name,
    value: a.value,
    color: (a as any).color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length] as string,
    pct:   total > 0 ? (a.value / total) * 100 : 0,
  }))

  return (
    <ChartContainer
      title={title}
      subtitle={`${formatCurrency(total)} total portfolio value`}
      loading={loading}
      skeletonHeight={280}
    >
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
              isAnimationActive
              animationBegin={0}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip content={<AllocationTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend rows */}
        <div className="space-y-2.5 mt-1">
          {data.map((d, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: d.color }}
                />
                <span className="text-xs text-slate-600">{d.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="font-semibold text-slate-900">{formatCurrency(d.value)}</span>
                <span className="text-slate-400 w-9 text-right">{d.pct.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </ChartContainer>
  )
}
