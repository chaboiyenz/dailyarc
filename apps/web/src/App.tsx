import './style.css'
import { AuthProvider, useAuthContext } from '@/providers/AuthProvider'
import { QueryProvider } from '@/providers/QueryProvider'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'
import { Header } from '@repo/ui/Header'
import { Button } from '@repo/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@repo/ui/Card'

function AppContent() {
  const { user, profile, loading, needsOnboarding, signInWithGoogle, signOut } = useAuthContext()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading DailyArc…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
        {/* Hero */}
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight text-white">
            Daily<span className="text-primary">Arc</span>
          </h1>
          <p className="mt-3 text-lg text-slate-400">Your dedicated fitness journey starts here.</p>
        </div>

        {/* Sign-in Card */}
        <Card className="w-full max-w-sm border-slate-700 bg-slate-800/60 shadow-2xl backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">Get Started</CardTitle>
            <CardDescription className="text-slate-400">
              Sign in to begin your training arc.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full gap-2" size="lg" onClick={signInWithGoogle}>
              {/* Google "G" SVG icon */}
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
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
              Sign in with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (needsOnboarding) {
    return <OnboardingFlow />
  }

  // Main Dashboard (Placeholder for now)
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between">
          <Header title="DailyArc Dashboard" />
          <Button variant="ghost" size="sm" onClick={signOut}>
            Sign Out
          </Button>
        </div>
        <div className="mt-12 space-y-4 text-center">
          <h2 className="text-4xl font-bold tracking-tight">
            Welcome, {profile?.displayName || profile?.role}!
          </h2>
          <p className="text-lg text-muted-foreground">You are now logged in and onboarded.</p>
        </div>
      </div>
    </div>
  )
}

export function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryProvider>
  )
}
