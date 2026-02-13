import { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedAdminRouteProps {
  children: ReactNode
}

export default function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { profile, user } = useAuth()

  // Still loading auth or profile
  if (!user || profile === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // Not an admin
  if (!profile || profile.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 p-4">
        <div className="text-center">
          <div className="text-red-500 text-xl font-bold mb-2">🛑 Access Denied</div>
          <div className="text-white">You do not have permission to access this area.</div>
          <div className="text-slate-400 text-sm mt-2">Admin privileges required.</div>
        </div>
      </div>
    )
  }

  // Is admin - show content
  return <>{children}</>
}
