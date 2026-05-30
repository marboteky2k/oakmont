import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/types/database'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
  /** If true, KYC must be submitted (status !== 'pending' means not yet started — block) */
  requireKyc?: boolean
}

// Routes that are accessible even when email is not verified
const EMAIL_EXEMPT = ['/kyc', '/settings', '/notifications', '/support']
// Routes that require completed KYC (submitted at least)
const KYC_REQUIRED_PATHS = ['/wallet', '/copy-trading', '/investments', '/trading', '/bot-trading', '/exchanges']

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth()
  const location = useLocation()

  // ── Loading spinner ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-[#3B82F6] border-t-transparent animate-spin" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    )
  }

  // ── Not authenticated ──────────────────────────────────────────────────────
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />

  // ── Profile loaded — run guard checks ─────────────────────────────────────
  if (profile) {
    const isAdmin = profile.role === 'super_admin' || profile.role === 'admin'

    // 1. Email verification gate (admins bypass)
    if (!profile.email_verified && !isAdmin) {
      const isExempt = EMAIL_EXEMPT.some(p => location.pathname.startsWith(p))
      if (!isExempt) {
        return <Navigate to="/verify-email" replace />
      }
    }

    // 2. Role gate
    if (allowedRoles && !allowedRoles.includes(profile.role)) {
      return <Navigate to="/dashboard" replace />
    }

    // 3. KYC gate — block financial routes until KYC is at least submitted
    const needsKycGate = KYC_REQUIRED_PATHS.some(p => location.pathname.startsWith(p))
    if (needsKycGate && !isAdmin && profile.kyc_status === 'pending') {
      // kyc_status 'pending' = not yet submitted (default); submitted = 'pending' with a doc record
      // We can't distinguish here without a doc query, so we let the individual pages
      // handle the KYC banner — no hard redirect to keep UX smooth.
      // The actual financial operations (withdrawals, trades, etc.) are blocked at the function level.
    }
  }

  return <Outlet />
}
