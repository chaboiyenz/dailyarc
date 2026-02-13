import './style.css'
import { useState } from 'react'
import { BrowserRouter } from 'react-router-dom' // 1. Added Router Import
import { AuthProvider, useAuthContext } from '@/providers/AuthProvider'
import { QueryProvider } from '@/providers/QueryProvider'
import { UnitProvider } from '@/providers/UnitPreferenceProvider'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'
import DashboardLayout from '@/components/dashboard/DashboardLayout'
import EmailAuthForm from '@/components/auth/EmailAuthForm'
import { Button } from '@repo/ui/Button'

function AppContent() {
  const {
    user,
    profile,
    loading,
    needsOnboarding,
    signInWithGoogle,
    signInWithGithub,
    signUpWithEmail,
    signInWithEmail,
    signOut,
  } = useAuthContext()

  const [showEmailAuth, setShowEmailAuth] = useState(false)

  // STRICT LOADING CHECK
  if (loading || (user && profile === undefined)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading DailyArc...</p>
        </div>
      </div>
    )
  }

  // User not logged in - show sign-in page
  if (!user) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 p-6">
        <div className="relative z-10 flex w-full max-w-5xl flex-col items-center gap-12 lg:flex-row lg:justify-between">
          <div className="max-w-xl text-center lg:text-left">
            <h1 className="text-6xl font-black tracking-tighter text-foreground lg:text-8xl">
              DAILY<span className="text-[hsl(var(--primary))]">ARC</span>
            </h1>
            <p className="mt-6 text-xl text-muted-foreground lg:text-2xl">
              The high-performance protocol for your ultimate training arc. Track, progress, and
              conquer.
            </p>
          </div>

          {!showEmailAuth ? (
            <div className="w-full max-w-md">
              <div className="rounded-3xl border border-border bg-card p-8 shadow-2xl">
                <h2 className="mb-6 text-center text-2xl font-bold text-foreground">
                  Join the Initiative
                </h2>
                <div className="flex flex-col gap-3">
                  <Button
                    className="h-12 w-full gap-3 text-base"
                    size="lg"
                    onClick={() => setShowEmailAuth(true)}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Continue with Email
                  </Button>
                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-3 font-medium text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="h-12 w-full gap-2 border-border hover:bg-secondary"
                      onClick={signInWithGoogle}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
                          fill="#EA4335"
                        />
                      </svg>
                      Google
                    </Button>
                    <Button
                      variant="outline"
                      className="h-12 w-full gap-2 border-border hover:bg-secondary"
                      onClick={signInWithGithub}
                    >
                      <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                      </svg>
                      GitHub
                    </Button>
                  </div>
                </div>
                <p className="mt-8 text-center text-sm text-muted-foreground">
                  Secure access powered by DailyArc Forge.
                </p>
              </div>
            </div>
          ) : (
            <EmailAuthForm
              onSignIn={signInWithEmail}
              onSignUp={signUpWithEmail}
              onBack={() => setShowEmailAuth(false)}
            />
          )}
        </div>
      </div>
    )
  }

  // User logged in but needs onboarding
  if (needsOnboarding || !profile || !profile.onboardingComplete || !profile.role) {
    return <OnboardingFlow />
  }

  // User logged in with complete profile - show dashboard
  return (
    <DashboardLayout
      userName={profile.displayName || 'User'}
      userRole={profile.role}
      onSignOut={signOut}
    />
  )
}

export function App() {
  return (
    <QueryProvider>
      {/* 2. Added BrowserRouter around the AuthProvider and Content */}
      <BrowserRouter>
        <AuthProvider>
          <UnitProvider>
            <AppContent />
          </UnitProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryProvider>
  )
}
