import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import type { PeriodKey } from './shared'

interface Props {
  title: string
  subtitle?: string
  loading?: boolean
  periods?: PeriodKey[]
  period?: PeriodKey
  onPeriodChange?: (p: PeriodKey) => void
  rightSlot?: ReactNode
  children: ReactNode
  skeletonHeight?: number
}

export function ChartContainer({
  title,
  subtitle,
  loading,
  periods,
  period,
  onPeriodChange,
  rightSlot,
  children,
  skeletonHeight = 240,
}: Props) {
  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {rightSlot}
          {periods && period && onPeriodChange && (
            <div className="flex items-center gap-0.5 bg-slate-100 rounded-xl p-1">
              {periods.map(p => (
                <button
                  key={p}
                  onClick={() => onPeriodChange(p)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    period === p
                      ? 'bg-white text-[#1E40AF] shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {loading ? <ChartSkeleton height={skeletonHeight} /> : children}
    </Card>
  )
}

const HEIGHTS = [55, 75, 45, 88, 70, 100, 65, 82, 92, 60, 85, 68]

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div className="animate-pulse" style={{ height }}>
      <div className="flex h-full items-end gap-1 pb-7 px-1">
        {HEIGHTS.map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-gradient-to-t from-slate-150 to-slate-100 rounded-t"
            style={{ height: `${h}%`, backgroundColor: '#f1f5f9' }}
          />
        ))}
      </div>
      <div className="flex gap-6 mt-2 pl-1">
        {[44, 56, 40].map((w, i) => (
          <div key={i} className="h-2 rounded-full bg-slate-100" style={{ width: w }} />
        ))}
      </div>
    </div>
  )
}
