import { supabase } from './supabase'

export interface MfaFactor {
  id: string
  type: 'totp'
  status: 'verified' | 'unverified'
  friendly_name?: string
}

export async function getMfaFactors(): Promise<MfaFactor[]> {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw error
  return (data?.totp ?? []) as unknown as MfaFactor[]
}

export async function enrollMfa(): Promise<{ qrCode: string; secret: string; factorId: string }> {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Oakmont Ridge Authenticator',
  })
  if (error) throw error
  return {
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
    factorId: data.id,
  }
}

export async function verifyMfaEnrollment(factorId: string, code: string): Promise<void> {
  const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId })
  if (challengeErr) throw challengeErr

  const { error: verifyErr } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challengeData.id,
    code,
  })
  if (verifyErr) throw verifyErr
}

export async function unenrollMfa(factorId: string): Promise<void> {
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  if (error) throw error
}

export async function challengeAndVerifyMfa(factorId: string, code: string): Promise<void> {
  const { data: challengeData, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId })
  if (challengeErr) throw challengeErr

  const { error: verifyErr } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challengeData.id,
    code,
  })
  if (verifyErr) throw verifyErr
}

export async function getMfaAssuranceLevel(): Promise<{ current: string; next: string | null }> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error) throw error
  return { current: data.currentLevel as string, next: data.nextLevel as string | null }
}

export async function hasVerifiedMfa(): Promise<boolean> {
  try {
    const factors = await getMfaFactors()
    return factors.some(f => f.status === 'verified')
  } catch {
    return false
  }
}
