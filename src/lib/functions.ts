/**
 * Wraps supabase.functions.invoke() with proper error extraction.
 *
 * The Supabase JS SDK returns { data: null, error: FunctionsHttpError }
 * for any non-2xx response. The actual error message lives inside
 * error.context (the raw Response object), NOT in error.message which is
 * always the generic "Edge Function returned a non-2xx status code".
 *
 * This utility:
 *  1. Tries to read the JSON body from FunctionsHttpError.context
 *  2. Falls back to error.message if the body can't be parsed
 *  3. Also handles the case where the function returns 200 with { error: '...' }
 */

import { supabase } from '@/lib/supabase'

export async function invokeFunction<T = Record<string, unknown>>(
  name: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>(name, {
    body,
  })

  if (error) {
    // Try to extract the real message from the response body
    let message = error.message ?? 'Edge Function error'
    try {
      // FunctionsHttpError exposes the raw Response on .context
      const ctx = (error as unknown as { context?: Response }).context
      if (ctx) {
        const clone = ctx.clone()
        const json = await clone.json()
        if (json?.error) message = json.error
        else if (typeof json?.message === 'string') message = json.message
      }
    } catch {
      // body not parseable — use SDK message as-is
    }
    throw new Error(message)
  }

  // 200 response but function returned { success: false, error: '...' }
  if (data && typeof data === 'object' && (data as Record<string, unknown>).error) {
    throw new Error(String((data as Record<string, unknown>).error))
  }

  return data as T
}
