import { useState } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@repo/ui/Card'
import { Button } from '@repo/ui/Button'
import { Input } from '@repo/ui/Input'
import { Label } from '@repo/ui/Label'
import { Toast } from '@repo/ui'
import { useAuthContext } from '@/providers/AuthProvider'
import { db } from '@/lib/firebase'
import type { User } from '@repo/shared/schemas/user'
import { cn } from '@repo/ui/utils'

type Step = 'ROLE' | 'WEIGHT'

export default function OnboardingFlow() {
  const { user } = useAuthContext()
  const [step, setStep] = useState<Step>('ROLE')
  const [role, setRole] = useState<'TRAINEE' | 'TRAINER' | null>(null)
  const [weight, setWeight] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{
    visible: boolean
    message: string
    variant: 'default' | 'destructive' | 'success'
  }>({ visible: false, message: '', variant: 'default' })

  const showToast = (
    message: string,
    variant: 'default' | 'destructive' | 'success' = 'default'
  ) => {
    setToast({ visible: true, message, variant })
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000)
  }

  const handleRoleSelect = (selectedRole: 'TRAINEE' | 'TRAINER') => {
    setRole(selectedRole)
    setStep('WEIGHT')
  }

  const handleComplete = async () => {
    if (!user || !role || !weight) return

    setLoading(true)
    try {
      const weightNum = parseFloat(weight)

      const userData: User = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'User',
        photoURL: user.photoURL,
        role: role,
        onboardingComplete: true,
        inventory: [],
        stats: {
          currentPushupLevel: 0,
          weight: isNaN(weightNum) ? 0 : weightNum,
        },
        createdAt: serverTimestamp(),
      }

      await setDoc(doc(db, 'users', user.uid), userData)
      // Force reload to refresh context
      window.location.reload()
    } catch (error) {
      console.error('Error completing onboarding:', error)
      showToast('Failed to save profile. Please try again.', 'destructive')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Toast Notification */}
      <Toast
        visible={toast.visible}
        variant={toast.variant}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
      >
        {toast.message}
      </Toast>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm font-medium text-primary">Setting up your profile…</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          Set Up Your <span className="text-primary">Arc</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">Let's personalize your experience.</p>
      </div>

      {/* Stepper / Progress Bar */}
      <div className="mb-8 flex w-full max-w-md flex-col gap-2">
        <div className="flex justify-between text-sm font-medium text-slate-400">
          <span>Step {step === 'ROLE' ? 1 : 2} of 2</span>
          <span>{step === 'ROLE' ? 'Choose Role' : 'Initial Stats'}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full bg-primary transition-all duration-500 ease-in-out"
            style={{ width: step === 'ROLE' ? '50%' : '100%' }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-4xl transition-all duration-500 ease-in-out">
        {step === 'ROLE' ? (
          <div className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Trainee Card */}
            <Card
              className={cn(
                'group cursor-pointer border-slate-700 bg-slate-800/60 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10',
                role === 'TRAINEE' &&
                  'border-primary ring-2 ring-primary ring-offset-2 ring-offset-slate-900'
              )}
              onClick={() => handleRoleSelect('TRAINEE')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl transition-transform group-hover:scale-110">
                  🏋️
                </div>
                <CardTitle className="text-2xl text-white">I am a Trainee</CardTitle>
                <CardDescription className="text-slate-400">
                  I want to track my progress and workouts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="mb-4 space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Daily readiness scores
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Pushup progression tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Personalized recommendations
                  </li>
                </ul>
                <Button className="w-full" variant={role === 'TRAINEE' ? 'default' : 'outline'}>
                  Select Trainee
                </Button>
              </CardContent>
            </Card>

            {/* Trainer Card */}
            <Card
              className={cn(
                'group cursor-pointer border-slate-700 bg-slate-800/60 backdrop-blur-sm transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10',
                role === 'TRAINER' &&
                  'border-primary ring-2 ring-primary ring-offset-2 ring-offset-slate-900'
              )}
              onClick={() => handleRoleSelect('TRAINER')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl transition-transform group-hover:scale-110">
                  📋
                </div>
                <CardTitle className="text-2xl text-white">I am a Trainer</CardTitle>
                <CardDescription className="text-slate-400">
                  I want to manage clients and plans.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="mb-4 space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Client management dashboard
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Program templates
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-primary">✓</span> Progress analytics
                  </li>
                </ul>
                <Button className="w-full" variant={role === 'TRAINER' ? 'default' : 'outline'}>
                  Select Trainer
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex justify-center animate-in fade-in slide-in-from-right-8 duration-500">
            <Card className="w-full max-w-md border-slate-700 bg-slate-800/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">One last thing…</CardTitle>
                <CardDescription className="text-slate-400">
                  We need your weight to calculate your initial stats.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-slate-300">
                    Weight (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="e.g. 75"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    className="border-slate-600 bg-slate-700/50 text-lg text-white placeholder:text-slate-500"
                    autoFocus
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="ghost"
                  className="text-slate-400 hover:text-white"
                  onClick={() => setStep('ROLE')}
                >
                  Back
                </Button>
                <Button onClick={handleComplete} disabled={loading || !weight}>
                  Complete Setup
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
