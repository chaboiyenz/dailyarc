'use client'

/**
 * Enhanced Auth Sign-In Form with Better Error Handling
 *
 * Features:
 * - Detects and explains provider mismatch errors
 * - Shows helpful error messages
 * - Provides recovery options
 * - Tracks auth errors for analytics
 */

import { useState } from 'react'
import { Button } from '@repo/ui'
import { useAuthContext } from '@/providers/AuthProvider'

interface AuthError {
  code: string
  message: string
  isProviderMismatch: boolean
}

export function AuthSignInForm() {
  const { signInWithGoogle, signInWithGithub, signUpWithEmail } = useAuthContext()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const [showEmailAuth, setShowEmailAuth] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSignIn = async (
    provider: 'google' | 'github' | 'email',
    emailVal?: string,
    passwordVal?: string
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      if (provider === 'google') {
        await signInWithGoogle()
      } else if (provider === 'github') {
        await signInWithGithub()
      } else if (provider === 'email' && emailVal && passwordVal) {
        await signUpWithEmail(emailVal, passwordVal)
      }
    } catch (err) {
      const firebaseError = err as { code?: string; message?: string }
      const isProviderMismatch =
        firebaseError.code === 'auth/account-exists-with-different-credential'

      setError({
        code: firebaseError.code || 'unknown',
        message: firebaseError.message || 'Authentication failed',
        isProviderMismatch,
      })

      console.error(`❌ Auth Error (${provider}):`, firebaseError)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Error Display */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-950/50 p-4">
          <h3 className="font-semibold text-red-300">Sign-In Error</h3>

          {error.isProviderMismatch ? (
            <div className="mt-2 space-y-2 text-sm text-red-200">
              <p>
                <strong>Your account exists with a different sign-in method.</strong>
              </p>
              <p>
                You may have previously signed up using Google, GitHub, or Email. Please use that
                same method to sign in.
              </p>
              <div className="mt-3 rounded bg-red-950/50 p-2 text-xs">
                <p className="font-mono">{error.code}</p>
              </div>
              <p className="mt-2 text-xs">
                💡 <strong>Tip:</strong> Try signing in with Google if you originally signed up with
                that method.
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-red-200">{error.message}</p>
          )}

          <button
            onClick={() => setError(null)}
            className="mt-3 text-xs text-red-300 underline hover:text-red-200"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Auth UI */}
      <div className="rounded-3xl border border-border bg-card p-8 shadow-2xl">
        <h2 className="mb-6 text-center text-2xl font-bold text-foreground">Join the Initiative</h2>

        {!showEmailAuth ? (
          <div className="flex flex-col gap-3">
            <Button
              className="h-12 w-full gap-3 text-base"
              size="lg"
              onClick={() => setShowEmailAuth(true)}
              disabled={isLoading}
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
                onClick={() => handleSignIn('google')}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
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
                )}
                Google
              </Button>

              <Button
                variant="outline"
                className="h-12 w-full gap-2 border-border hover:bg-secondary"
                onClick={() => handleSignIn('github')}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.042-1.416-4.042-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                )}
                GitHub
              </Button>
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Secure access powered by DailyArc Forge.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded border border-border bg-background px-4 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
              disabled={isLoading}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded border border-border bg-background px-4 py-2 text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
              disabled={isLoading}
            />
            <Button
              className="h-12 w-full"
              size="lg"
              onClick={() => handleSignIn('email', email, password)}
              disabled={isLoading || !email || !password}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            <Button
              variant="outline"
              className="h-12 w-full"
              onClick={() => {
                setShowEmailAuth(false)
                setEmail('')
                setPassword('')
              }}
              disabled={isLoading}
            >
              Back
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
