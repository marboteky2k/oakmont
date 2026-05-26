import { useId } from 'react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'

interface Props {
  data?: number[]
  positive?: boolean
  height?: number
  /** CSS width — defaults to '100%' */
  containerWidth?: string | number
}

const DEFAULT_UP   = [2, 5, 3, 8, 6, 10, 12, 9, 15, 13, 18, 16]
const DEFAULT_DOWN = [16, 14, 15, 12, 13, 10, 11, 8, 9, 7, 5, 6]

export function TraderSparkline({
  data,
  positive = true,
  height = 48,
  containerWidth = '100%',
}: Props) {
  const uid     = useId().replace(/:/g, '')
  const raw     = data ?? (positive ? DEFAULT_UP : DEFAULT_DOWN)
  const chartData = raw.map((v, i) => ({ i, v }))
  const color   = positive ? '#22c55e' : '#ef4444'
  const gradId  = `spark-${uid}`

  return (
    <ResponsiveContainer width={containerWidth as `${number}%` | number} height={height}>
      <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradId})`}
          dot={false}
          isAnimationActive
          animationDuration={600}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
