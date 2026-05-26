import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-[#1E40AF] hover:bg-[#1d3a9e] text-white focus:ring-[#3B82F6] shadow-md hover:shadow-lg',
    secondary: 'bg-[#3B82F6] hover:bg-[#2563eb] text-white focus:ring-[#3B82F6] shadow-md hover:shadow-lg',
    outline: 'border-2 border-[#1E40AF] text-[#1E40AF] hover:bg-[#DBEAFE] focus:ring-[#3B82F6]',
    ghost: 'text-[#1E40AF] hover:bg-[#DBEAFE] focus:ring-[#3B82F6]',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-md hover:shadow-lg',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base',
  }

  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: disabled || loading ? 1 : 1.015 }}
      transition={{ duration: 0.15 }}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props as any}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon}
      {children}
    </motion.button>
  )
}
