import { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import TrainerPendingApproval from '@/components/auth/TrainerPendingApproval'

interface ProtectedTrainerRouteProps {
  children: ReactNode
}

export default function ProtectedTrainerRoute({ children }: ProtectedTrainerRouteProps) {
  const { profile, user } = useAuth()

  // Still loading auth or profile
  if (!user || profile === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // Not a trainer
  if (!profile || profile.role !== 'TRAINER') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-white">Access denied</div>
      </div>
    )
  }

  // Trainer but not approved
  if (profile.trainerStatus !== 'APPROVED') {
    return <TrainerPendingApproval displayName={profile.displayName} />
  }

  // Approved trainer - show content
  return <>{children}</>
}
