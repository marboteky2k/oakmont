import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] to-[#EFF6FF] flex items-center justify-center p-6">
      <div className="text-center max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          className="mb-8"
        >
          {/* 404 graphic */}
          <div className="relative inline-block">
            <p className="text-[120px] font-black text-[#1E40AF] leading-none opacity-10 select-none">404</p>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center">
                <Search className="w-12 h-12 text-[#1E40AF]" />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Page not found</h1>
          <p className="text-slate-500 text-base mb-8 leading-relaxed">
            The page you're looking for doesn't exist, was moved, or you don't have permission to view it.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 px-5 py-2.5 border-2 border-[#1E40AF] text-[#1E40AF] rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Go back
            </button>
            <Link
              to="/"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#1E40AF] text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-md"
            >
              <Home className="w-4 h-4" /> Return home
            </Link>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-xs text-slate-400"
        >
          Error code: 404 · Page not found
        </motion.p>
      </div>
    </div>
  )
}
