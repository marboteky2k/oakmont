import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { BookOpen, Clock, Tag, Search, ArrowRight, ChevronRight, TrendingUp } from 'lucide-react'
import { PublicNav } from '@/components/layout/PublicNav'
import { LandingFooter } from '@/pages/landing/LandingFooter'
import { useBlogHeader } from '@/hooks/useCmsContent'

interface Post {
  id: number
  category: string
  tag: string
  title: string
  excerpt: string
  author: string
  authorInitials: string
  date: string
  readTime: string
  featured?: boolean
  color: string
}

const POSTS: Post[] = [
  {
    id: 1,
    category: 'Market Insights',
    tag: 'Forex',
    title: 'Why EUR/USD Is the World\'s Most Traded Pair — And What It Means for Copy Traders',
    excerpt: 'The EUR/USD pair accounts for nearly 28% of global forex volume. Understanding its key drivers — ECB policy, US economic data, and risk sentiment — can dramatically improve your copy trading selections.',
    author: 'James Harrington',
    authorInitials: 'JH',
    date: 'May 22, 2026',
    readTime: '6 min read',
    featured: true,
    color: 'from-[#1E40AF] to-[#3B82F6]',
  },
  {
    id: 2,
    category: 'Education',
    tag: 'Copy Trading',
    title: 'Copy Trading vs. Fund Management: Which Is Right for You?',
    excerpt: 'Both approaches let you benefit from professional expertise, but they differ in transparency, fees, and control. We break down the key differences to help you choose.',
    author: 'Sarah Okonkwo',
    authorInitials: 'SO',
    date: 'May 18, 2026',
    readTime: '5 min read',
    color: 'from-purple-500 to-purple-700',
  },
  {
    id: 3,
    category: 'Platform News',
    tag: 'Update',
    title: 'Introducing Oakmont Ridge Capital 2.0: Faster Execution, Smarter Analytics',
    excerpt: 'Our biggest platform update yet brings real-time P&L tracking, improved trader leaderboards, advanced portfolio allocation tools, and a redesigned mobile experience.',
    author: 'Oakmont Ridge Team',
    authorInitials: 'OR',
    date: 'May 15, 2026',
    readTime: '4 min read',
    color: 'from-green-500 to-emerald-600',
  },
  {
    id: 4,
    category: 'Education',
    tag: 'Risk Management',
    title: 'The 2% Rule: How Professional Traders Protect Their Capital',
    excerpt: 'Never risk more than 2% of your capital on a single trade. This simple rule, followed consistently, is what separates profitable traders from those who blow their accounts.',
    author: 'David Kline',
    authorInitials: 'DK',
    date: 'May 12, 2026',
    readTime: '7 min read',
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 5,
    category: 'Market Insights',
    tag: 'Crypto',
    title: 'Bitcoin Halving 2024: What It Means for Your Crypto Portfolio',
    excerpt: 'The fourth Bitcoin halving cut miner rewards from 6.25 to 3.125 BTC. Historical data shows significant price movements in the 12–18 months following each halving event.',
    author: 'Maria Chen',
    authorInitials: 'MC',
    date: 'May 9, 2026',
    readTime: '8 min read',
    color: 'from-rose-500 to-pink-600',
  },
  {
    id: 6,
    category: 'Security',
    tag: 'Account Safety',
    title: 'How Email Verification Keeps Your Withdrawals Secure',
    excerpt: 'Every withdrawal on Oakmont Ridge Capital requires a one-time code sent to your registered email — here\'s why this approach is simple, effective, and keeps your funds safe.',
    author: 'James Harrington',
    authorInitials: 'JH',
    date: 'May 5, 2026',
    readTime: '4 min read',
    color: 'from-slate-600 to-slate-800',
  },
  {
    id: 7,
    category: 'Education',
    tag: 'Investment Plans',
    title: 'Understanding Compound Returns: The Math Behind Our Investment Plans',
    excerpt: 'Compounding is often called the eighth wonder of the world. Here\'s a clear, jargon-free breakdown of how compound interest works in fixed-term crypto investment products.',
    author: 'Sarah Okonkwo',
    authorInitials: 'SO',
    date: 'April 30, 2026',
    readTime: '6 min read',
    color: 'from-teal-500 to-cyan-600',
  },
  {
    id: 8,
    category: 'Platform News',
    tag: 'Traders',
    title: 'Meet May\'s Top Performers: Five Traders Who Delivered 30%+ Returns',
    excerpt: 'This month\'s leaderboard is packed with standout performers. We spotlight the strategies, trading styles, and risk profiles of our five highest-returning copy traders.',
    author: 'Oakmont Ridge Team',
    authorInitials: 'OR',
    date: 'April 28, 2026',
    readTime: '5 min read',
    color: 'from-indigo-500 to-violet-600',
  },
]

const CATEGORIES = ['All', 'Market Insights', 'Education', 'Platform News', 'Security']

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07 } }),
}

export default function Blog() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const cmsHeader = useBlogHeader()

  const featured = POSTS[0]
  const rest = POSTS.slice(1)

  const filtered = rest.filter(p =>
    (activeCategory === 'All' || p.category === activeCategory) &&
    (p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNav />
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1E40AF] to-[#1e3a8a] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-5">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
              {cmsHeader.headline || 'Oakmont Ridge Insights'}
            </h1>
            <p className="text-blue-200 text-sm max-w-xl mx-auto">
              {cmsHeader.subheadline || 'Market analysis, trading education, platform updates, and expert insights to help you make smarter investment decisions.'}
            </p>
          </motion.div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Link to="/" className="hover:text-[#1E40AF] transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-600">Blog</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-20 space-y-10">

        {/* Featured post */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className={`rounded-3xl bg-gradient-to-br ${featured.color} p-8 text-white relative overflow-hidden`}>
            <div className="absolute right-0 top-0 w-72 h-72 bg-white/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium">Featured</span>
                <span className="text-xs bg-white/10 px-2.5 py-1 rounded-full">{featured.tag}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-3 max-w-2xl leading-snug">
                {featured.title}
              </h2>
              <p className="text-white/80 text-sm leading-relaxed max-w-xl mb-6">
                {featured.excerpt}
              </p>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                    {featured.authorInitials}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{featured.author}</p>
                    <p className="text-xs text-white/60">{featured.date} · {featured.readTime}</p>
                  </div>
                </div>
                <button className="flex items-center gap-2 bg-white text-[#1E40AF] text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-50 transition-colors">
                  Read Article <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-[#1E40AF] text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-[#3B82F6] hover:text-[#1E40AF]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative ml-auto w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search articles…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Post grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No articles found</p>
            <p className="text-sm text-slate-400 mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post, i) => (
              <motion.article
                key={post.id}
                custom={i}
                initial="hidden"
                animate="show"
                variants={fadeUp}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer"
              >
                {/* Card colour strip */}
                <div className={`h-2 bg-gradient-to-r ${post.color}`} />
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-medium bg-gradient-to-r ${post.color} bg-clip-text text-transparent`}>
                      {post.category}
                    </span>
                    <span className="text-slate-200">·</span>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Tag className="w-3 h-3" /> {post.tag}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug mb-2 group-hover:text-[#1E40AF] transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                        {post.authorInitials}
                      </div>
                      <p className="text-xs text-slate-500">{post.author}</p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3 h-3" /> {post.readTime}
                    </span>
                  </div>
                </div>
                <div className="px-5 pb-4">
                  <span className="text-xs text-slate-400">{post.date}</span>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {/* Newsletter CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-[#1E40AF] to-[#2563eb] rounded-3xl p-8 text-white text-center"
        >
          <TrendingUp className="w-8 h-8 mx-auto mb-4 text-blue-200" />
          <h2 className="text-xl font-bold mb-2">Never Miss a Market Move</h2>
          <p className="text-blue-200 text-sm mb-6 max-w-md mx-auto">
            {cmsHeader.newsletter_cta || 'Subscribe to our weekly newsletter — market recaps, trader spotlights, and platform updates delivered to your inbox every Friday.'}
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-white text-[#1E40AF] font-semibold text-sm px-6 py-2.5 rounded-xl hover:bg-blue-50 transition-colors"
          >
            Subscribe <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
      <LandingFooter />
    </div>
  )
}
