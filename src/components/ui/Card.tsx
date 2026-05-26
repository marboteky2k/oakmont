import type { HTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
  glass?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, hover, glass, padding = 'md', className, ...props }: CardProps) {
  const base = 'rounded-2xl border transition-all duration-200'
  const paddings = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-8' }
  const style = glass
    ? 'bg-white/80 backdrop-blur-lg border-blue-100/60 shadow-sm'
    : 'bg-white border-slate-100 shadow-sm'

  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -3, boxShadow: '0 12px 40px -12px rgba(30,64,175,0.18)' }}
        transition={{ duration: 0.18 }}
        className={cn(base, style, paddings[padding], 'cursor-default', className)}
        {...props as any}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className={cn(base, style, paddings[padding], className)} {...props}>
      {children}
    </div>
  )
}
