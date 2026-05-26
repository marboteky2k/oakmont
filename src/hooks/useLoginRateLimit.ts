import { useState, useCallback } from 'react'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000 // 15 minutes
const STORAGE_KEY = 'oakmont_login_attempts'

interface AttemptRecord {
  count: number
  firstAttempt: number
  lockedUntil?: number
}

function getRecord(): AttemptRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { count: 0, firstAttempt: Date.now() }
    return JSON.parse(raw)
  } catch {
    return { count: 0, firstAttempt: Date.now() }
  }
}

function saveRecord(record: AttemptRecord) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
}

export function useLoginRateLimit() {
  const [record, setRecord] = useState<AttemptRecord>(getRecord)

  const isLocked = !!record.lockedUntil && Date.now() < record.lockedUntil

  const remainingSeconds = isLocked
    ? Math.ceil(((record.lockedUntil ?? 0) - Date.now()) / 1000)
    : 0

  const remainingAttempts = Math.max(0, MAX_ATTEMPTS - record.count)

  const recordFailure = useCallback(() => {
    const current = getRecord()
    const now = Date.now()

    // Reset window if more than 15 min since first attempt
    if (now - current.firstAttempt > LOCKOUT_MS) {
      const fresh: AttemptRecord = { count: 1, firstAttempt: now }
      saveRecord(fresh)
      setRecord(fresh)
      return { locked: false, remaining: MAX_ATTEMPTS - 1 }
    }

    const next: AttemptRecord = {
      count: current.count + 1,
      firstAttempt: current.firstAttempt,
    }

    if (next.count >= MAX_ATTEMPTS) {
      next.lockedUntil = now + LOCKOUT_MS
    }

    saveRecord(next)
    setRecord(next)
    return { locked: !!next.lockedUntil, remaining: Math.max(0, MAX_ATTEMPTS - next.count) }
  }, [])

  const recordSuccess = useCallback(() => {
    const reset: AttemptRecord = { count: 0, firstAttempt: Date.now() }
    saveRecord(reset)
    setRecord(reset)
  }, [])

  const checkLocked = useCallback(() => {
    const current = getRecord()
    setRecord(current)
    if (current.lockedUntil && Date.now() < current.lockedUntil) {
      return true
    }
    // Auto-clear expired lock
    if (current.lockedUntil && Date.now() >= current.lockedUntil) {
      const reset: AttemptRecord = { count: 0, firstAttempt: Date.now() }
      saveRecord(reset)
      setRecord(reset)
    }
    return false
  }, [])

  return { isLocked, remainingSeconds, remainingAttempts, recordFailure, recordSuccess, checkLocked }
}
