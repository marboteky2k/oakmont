import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Returns the count of unread notifications for the given user.
 * Subscribes to realtime INSERT events so the badge updates live
 * without needing to poll or navigate away.
 */
export function useUnreadNotifications(userId: string | undefined): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!userId) { setCount(0); return }

    // Initial fetch
    const fetchCount = async () => {
      const { count: c } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)
      setCount(c ?? 0)
    }
    fetchCount()

    // Realtime: new notification arrives → bump count
    // UPDATE (mark read) → re-fetch to get accurate count
    const channel = supabase
      .channel(`unread-notifs:${userId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => setCount(prev => prev + 1)
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => fetchCount()   // re-fetch after mark-read
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  return count
}
