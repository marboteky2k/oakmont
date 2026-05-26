import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * Fetch a single site_settings record by key.
 * - JSON rows  → parsed as T
 * - Text rows  → returned as-is (cast to T)
 * - Not found  → returns defaultValue unchanged
 *
 * Usage:
 *   const header = useCmsContent<{ headline?: string }>('page_blog_header', {})
 *   const legalText = useCmsContent<string>('legal_privacy_policy', '')
 */
export function useCmsContent<T>(key: string, defaultValue: T): T {
  const [value, setValue] = useState<T>(defaultValue)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('site_settings')
      .select('value, type')
      .eq('key', key)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data?.value) return
        if (data.type === 'json') {
          try { if (!cancelled) setValue(JSON.parse(data.value) as T) } catch {}
        } else {
          if (!cancelled) setValue(data.value as T)
        }
      })
    return () => { cancelled = true }
  }, [key])

  return value
}

// ── Specific typed shortcuts ──────────────────────────────────────

export interface PageHeaderCms {
  headline?:        string
  subheadline?:     string
  newsletter_cta?:  string
  perks?:           string
  email?:           string
}

export interface ContactInfoCms {
  email?:         string
  phone?:         string
  address?:       string
  hours?:         string
  response_time?: string
}

export function useBlogHeader(): PageHeaderCms {
  return useCmsContent<PageHeaderCms>('page_blog_header', {})
}

export function useCareersHeader(): PageHeaderCms {
  return useCmsContent<PageHeaderCms>('page_careers_header', {})
}

export function useContactInfo(): ContactInfoCms {
  return useCmsContent<ContactInfoCms>('page_contact_info', {})
}

export function useLegalDoc(doc: 'privacy_policy' | 'terms_of_service' | 'cookie_policy'): string {
  return useCmsContent<string>(`legal_${doc}`, '')
}
