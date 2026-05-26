import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { CopyTrader } from '@/types/database'

export function useTraderProfile() {
  const { profile } = useAuth()
  const [trader, setTrader] = useState<CopyTrader | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    const { data } = await supabase
      .from('copy_traders')
      .select('*')
      .eq('user_id', profile.id)
      .single()
    setTrader(data as CopyTrader | null)
    setLoading(false)
  }, [profile])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { trader, loading, refresh }
}
