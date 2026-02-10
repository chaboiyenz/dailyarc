import { createContext, useContext, ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import type { User as FirebaseUser } from 'firebase/auth'
import type { User as AppUser } from '@repo/shared/schemas/user'

interface AuthContextType {
  user: FirebaseUser | null
  profile: AppUser | null | undefined
  loading: boolean
  needsOnboarding: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const authState = useAuth()

  return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
