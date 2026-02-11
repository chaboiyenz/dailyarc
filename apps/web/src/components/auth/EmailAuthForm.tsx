import { useState } from 'react'
import { Button, Input, Label, Card, CardContent } from '@repo/ui'

interface EmailAuthFormProps {
  onSignIn: (email: string, password: string) => Promise<void>
  onSignUp: (email: string, password: string) => Promise<void>
  onBack: () => void
}

export default function EmailAuthForm({ onSignIn, onSignUp, onBack }: EmailAuthFormProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateForm = (): string | null => {
    if (!email) return 'Email is required'
    if (!email.includes('@') || !email.includes('.')) return 'Please enter a valid email'
    if (!password) return 'Password is required'
    if (password.length < 6) return 'Password must be at least 6 characters'
    if (mode === 'signup' && password !== confirmPassword) return 'Passwords do not match'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    try {
      if (mode === 'signin') {
        await onSignIn(email, password)
      } else {
        await onSignUp(email, password)
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed'

      // Parse Firebase error messages - generic for sign-in to prevent account enumeration
      if (mode === 'signin') {
        // Generic error for sign-in to prevent account enumeration
        if (
          errorMessage.includes('user-not-found') ||
          errorMessage.includes('wrong-password') ||
          errorMessage.includes('invalid-credential') ||
          errorMessage.includes('invalid-email')
        ) {
          setError('Incorrect email or password. Please try again.')
        } else if (errorMessage.includes('too-many-requests')) {
          setError('Too many failed attempts. Please try again later.')
        } else {
          setError('Sign in failed. Please check your credentials and try again.')
        }
      } else {
        // Sign-up errors can be more specific
        if (errorMessage.includes('email-already-in-use')) {
          setError('This email is already registered. Try signing in instead.')
        } else if (errorMessage.includes('invalid-email')) {
          setError('Please enter a valid email address.')
        } else if (errorMessage.includes('weak-password')) {
          setError('Password is too weak. Use at least 6 characters.')
        } else if (errorMessage.includes('too-many-requests')) {
          setError('Too many requests. Please try again later.')
        } else {
          setError('Sign up failed. Please try again.')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setError(null)
    setConfirmPassword('')
  }

  return (
    <div className="w-full max-w-md">
      <Card className="rounded-3xl border border-border bg-card shadow-2xl">
        <CardContent className="p-8">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to options
          </button>

          {/* Header */}
          <h2 className="mb-2 text-center text-2xl font-bold text-foreground">
            {mode === 'signin' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            {mode === 'signin'
              ? 'Sign in to continue your training arc'
              : 'Join DailyArc and start your journey'}
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3">
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-12"
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="password" className="text-foreground">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="h-12"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
              {mode === 'signup' && (
                <p className="text-xs text-muted-foreground">At least 6 characters</p>
              )}
            </div>

            {/* Confirm Password Field (Sign Up Only) */}
            {mode === 'signup' && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword" className="text-foreground">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="h-12"
                  autoComplete="new-password"
                />
              </div>
            )}

            {/* Submit Button */}
            <Button type="submit" disabled={loading} className="h-12 text-base font-semibold">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  <span>{mode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
                </div>
              ) : mode === 'signin' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={toggleMode}
                disabled={loading}
                className="font-semibold text-primary hover:underline disabled:opacity-50"
              >
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
