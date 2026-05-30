import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types/database'

export interface SignUpExtra {
  phone?: string
  country?: string
  referralCode?: string
  investmentExperience?: string
  investmentGoals?: string
  assetInterests?: string
}

interface AuthContextType {
  session: Session | null
  supabaseUser: SupabaseUser | null
  profile: User | null
  loading: boolean
  mfaVerified: boolean
  signIn: (email: string, password: string) => Promise<{ needsMfa: boolean }>
  signUp: (email: string, password: string, fullName: string, extra?: SignUpExtra) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  setMfaVerified: (v: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mfaVerified, setMfaVerified] = useState(false)

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('users').select('*').eq('id', userId).single()
    if (data) setProfile(data as User)
  }

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION on mount — use that as the
    // single source of truth so we don't double-fetch the profile.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setSupabaseUser(session?.user ?? null)

      if (session?.user) {
        // Fire-and-forget — don't await so the session state updates immediately
        // and the UI unblocks. Profile arrives in a follow-up render.
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setMfaVerified(false)
      }

      // Only clear the initial loading spinner once — subsequent sign-in /
      // sign-out events must NOT re-trigger the full-screen spinner.
      if (event === 'INITIAL_SESSION') {
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string): Promise<{ needsMfa: boolean }> => {
    // Run sign-in and AAL check in parallel so the total wait is one round-trip
    const [{ error }, { data: aal }] = await Promise.all([
      supabase.auth.signInWithPassword({ email, password }),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ])
    if (error) throw error

    // Check email_verified — block login until verified (admins are exempt)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const { data: prof } = await supabase
        .from('users')
        .select('email_verified, role')
        .eq('id', authUser.id)
        .single()

      const isAdmin = prof?.role === 'super_admin' || prof?.role === 'admin'
      if (prof && !prof.email_verified && !isAdmin) {
        await supabase.auth.signOut()
        const err = new Error('Please verify your email address before signing in. Check your inbox for the verification link.')
        ;(err as any).code = 'EMAIL_NOT_VERIFIED'
        ;(err as any).email = email
        throw err
      }
    }

    const needsMfa = aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2'
    return { needsMfa }
  }

  const signUp = async (email: string, password: string, fullName: string, extra?: SignUpExtra) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: extra?.phone,
          country: extra?.country,
          referral_code: extra?.referralCode,
          investment_experience: extra?.investmentExperience,
          investment_goals: extra?.investmentGoals,
          asset_interests: extra?.assetInterests,
        },
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    })

    if (error) throw error
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setProfile(null)
    setMfaVerified(false)
  }

  const refreshProfile = async () => {
    if (supabaseUser) await fetchProfile(supabaseUser.id)
  }

  return (
    <AuthContext.Provider value={{
      session, supabaseUser, profile, loading, mfaVerified,
      signIn, signUp, signInWithGoogle, signOut, refreshProfile, setMfaVerified,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
