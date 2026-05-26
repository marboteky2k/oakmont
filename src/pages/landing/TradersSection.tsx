import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const traders = [
  {
    name: 'Marcus Chen',
    style: 'Swing Trading',
    initials: 'MC',
    color: 'bg-[#1E40AF]',
    winRate: '91%',
    roi: '+24.8%',
    allTime: '+127.4%',
    risk: 'Medium' as const,
    followers: 2340,
  },
  {
    name: 'Elara Voss',
    style: 'Scalping',
    initials: 'EV',
    color: 'bg-purple-600',
    winRate: '87%',
    roi: '+19.2%',
    allTime: '+89.2%',
    risk: 'High' as const,
    followers: 1890,
  },
  {
    name: "James O'Brien",
    style: 'Day Trading',
    initials: 'JO',
    color: 'bg-emerald-600',
    winRate: '83%',
    roi: '+16.5%',
    allTime: '+74.8%',
    risk: 'Low' as const,
    followers: 1452,
  },
  {
    name: 'Priya Sharma',
    style: 'Position Trading',
    initials: 'PS',
    color: 'bg-rose-600',
    winRate: '79%',
    roi: '+12.1%',
    allTime: '+58.3%',
    risk: 'Low' as const,
    followers: 987,
  },
  {
    name: 'Alex Dubois',
    style: 'Algorithmic',
    initials: 'AD',
    color: 'bg-amber-600',
    winRate: '88%',
    roi: '+21.3%',
    allTime: '+103.7%',
    risk: 'Medium' as const,
    followers: 1673,
  },
]

const riskColors = {
  Low: 'bg-green-100 text-green-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  High: 'bg-red-100 text-red-700',
}

function TraderCard({ trader }: { trader: typeof traders[0] }) {
  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: '0 20px 60px -12px rgba(30,64,175,0.2)' }}
      className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex-shrink-0 w-72 transition-shadow duration-300 cursor-default"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl ${trader.color} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
            {trader.initials}
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm">{trader.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{trader.style}</p>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0 ${riskColors[trader.risk]}`}>
          {trader.risk} Risk
        </span>
      </div>

      <div className="flex items-center gap-0.5 mb-4">
        {[...Array(5)].map((_, j) => (
          <Star key={j} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
        ))}
        <span className="text-xs text-slate-400 ml-1.5">Verified</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-[#1E40AF] font-bold text-sm">{trader.winRate}</p>
          <p className="text-xs text-slate-500 mt-0.5">Win Rate</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <p className="text-green-600 font-bold text-sm">{trader.roi}</p>
          <p className="text-xs text-slate-500 mt-0.5">Monthly</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-slate-700 font-bold text-sm">{(trader.followers / 1000).toFixed(1)}k</p>
          <p className="text-xs text-slate-500 mt-0.5">Followers</p>
        </div>
      </div>

      <div className="text-center mb-5">
        <p className="text-xs text-slate-400 mb-1">All-time return</p>
        <p className="text-2xl font-black text-green-500">{trader.allTime}</p>
      </div>

      <Link to="/register" className="block">
        <Button variant="outline" className="w-full" size="sm">
          Copy Trader
        </Button>
      </Link>
    </motion.div>
  )
}

export function TradersSection() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -304 : 304, behavior: 'smooth' })
  }

  return (
    <section id="traders" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-[#3B82F6] font-semibold text-sm uppercase tracking-wider mb-3">
              Featured Copy Traders
            </p>
            <h2 className="text-4xl font-bold text-slate-900 mb-2">Follow the best, profit with them</h2>
            <p className="text-slate-500">All traders are verified with a minimum 6-month live track record.</p>
          </motion.div>

          <div className="hidden md:flex items-center gap-2 pb-1">
            <button
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 hover:border-[#3B82F6] hover:text-[#3B82F6] transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {traders.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="snap-start"
            >
              <TraderCard trader={t} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link to="/register">
            <Button size="lg">
              View All Traders <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
