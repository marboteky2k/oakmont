import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface Pair {
  pair: string
  price: number
  change: number
  pct: number
  decimals: number
}

const basePairs: Pair[] = [
  { pair: 'EUR/USD', price: 1.08421, change: 0.00124,  pct:  0.115, decimals: 5 },
  { pair: 'GBP/USD', price: 1.27318, change: -0.00183, pct: -0.143, decimals: 5 },
  { pair: 'BTC/USD', price: 67420.5, change: 1234.8,   pct:  1.870, decimals: 2 },
  { pair: 'ETH/USD', price: 3812.40, change: -42.15,   pct: -1.090, decimals: 2 },
  { pair: 'XAU/USD', price: 2341.50, change: 8.20,     pct:  0.350, decimals: 2 },
  { pair: 'USD/JPY', price: 155.425, change: -0.285,   pct: -0.183, decimals: 3 },
  { pair: 'NZD/USD', price: 0.61245, change: 0.00095,  pct:  0.155, decimals: 5 },
  { pair: 'GBP/JPY', price: 197.828, change: -0.452,   pct: -0.228, decimals: 3 },
  { pair: 'USD/CAD', price: 1.36284, change: 0.00218,  pct:  0.160, decimals: 5 },
]

function TickerItem({ pair, price, pct, decimals }: Pair) {
  const up = pct >= 0
  return (
    <div className="flex items-center gap-3 px-6 border-r border-slate-700/50 flex-shrink-0 py-3">
      <span className="text-slate-400 text-xs font-semibold tracking-wide">{pair}</span>
      <span className="text-white text-sm font-bold tabular-nums">{price.toFixed(decimals)}</span>
      <div className={`flex items-center gap-1 text-xs font-semibold ${up ? 'text-green-400' : 'text-red-400'}`}>
        {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {up ? '+' : ''}{pct.toFixed(3)}%
      </div>
    </div>
  )
}

export function MarketTicker() {
  const [pairs, setPairs] = useState<Pair[]>(basePairs)

  useEffect(() => {
    const id = setInterval(() => {
      setPairs(prev => prev.map(p => {
        const nudge = (Math.random() - 0.49) * 0.0003 * p.price
        const newPrice = Math.max(p.price + nudge, 0.0001)
        const newChange = p.change + nudge
        const newPct = (newChange / (newPrice - newChange)) * 100
        return { ...p, price: newPrice, change: newChange, pct: newPct }
      }))
    }, 2000)
    return () => clearInterval(id)
  }, [])

  return (
    <div id="markets" className="bg-slate-900 border-y border-slate-800 overflow-hidden">
      <div className="flex items-center">
        <div className="flex-shrink-0 bg-[#1E40AF] px-4 py-3 flex items-center gap-1.5 z-10 self-stretch">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white text-xs font-bold uppercase tracking-wider">Live</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="ticker-track flex items-center" style={{ width: 'max-content' }}>
            {[...pairs, ...pairs].map((p, i) => (
              <TickerItem key={i} {...p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
