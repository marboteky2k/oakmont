import { useState, useEffect } from 'react'

/** Animates a numeric value from 0 to `target` over `duration` ms. Returns the current raw number. */
export function useCountUp(target: number, duration: number, active: boolean): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!active) { setCount(target); return }
    let rafId: number
    const start = Date.now()
    setCount(0)

    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(eased * target)
      if (progress < 1) rafId = requestAnimationFrame(tick)
      else setCount(target)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [active, target, duration])

  return count
}

/**
 * Formats a number with comma separators and optional prefix/suffix.
 * e.g. formatCount(12345.6, '$', 2) → '$12,345.60'
 */
export function formatCount(n: number, prefix = '', decimals = 0, suffix = ''): string {
  const fixed = n.toFixed(decimals)
  const [int, dec] = fixed.split('.')
  const formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return `${prefix}${formatted}${decimals > 0 ? '.' + dec : ''}${suffix}`
}
