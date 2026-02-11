import { useState } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { Button, Input, Label, Toast } from '@repo/ui'
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

  const progressValue = step === 'ROLE' ? 50 : 100

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-950 text-white overflow-hidden">
      {/* Immersive Background Accents */}
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-blue-500/5 blur-[120px]" />

      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-900">
        <div
          className="h-full bg-primary transition-all duration-700 ease-out"
          style={{ width: `${progressValue}%` }}
        />
      </div>

      <Toast
        visible={toast.visible}
        variant={toast.variant}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
      >
        {toast.message}
      </Toast>

      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm font-medium text-primary">Engaging Core Protocols…</p>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-6xl">
          {/* Header */}
          <div className="mb-12 text-center lg:text-left">
            <h1 className="text-4xl font-black tracking-tight lg:text-6xl">
              INITIATE <span className="text-primary">ARC</span>
            </h1>
            <p className="mt-4 text-slate-400 text-lg lg:text-xl max-w-2xl">
              Select your operational role and calibrate your biometric data to begin.
            </p>
          </div>

          {step === 'ROLE' ? (
            <div className="grid gap-8 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {/* Trainee Card */}
              <div
                className={cn(
                  'group relative cursor-pointer overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40 p-10 transition-all hover:border-primary/50 hover:bg-slate-900/60',
                  role === 'TRAINEE' && 'border-primary bg-slate-900/80 ring-2 ring-primary/20'
                )}
                onClick={() => handleRoleSelect('TRAINEE')}
              >
                <div className="relative z-10">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-4xl transition-transform group-hover:scale-110">
                    🏋️
                  </div>
                  <h3 className="text-3xl font-bold mb-2">TRAINEE</h3>
                  <p className="text-slate-400 mb-8 text-lg">
                    Execute the protocol. Track progress, level up stats, and conquer goals.
                  </p>
                  <ul className="mb-10 space-y-4 text-slate-300">
                    <li className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                        ✓
                      </div>
                      Real-time readiness factor
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                        ✓
                      </div>
                      Pushup progression engine
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                        ✓
                      </div>
                      Biometric analytics
                    </li>
                  </ul>
                  <Button
                    className="w-full h-14 text-lg font-bold"
                    variant={role === 'TRAINEE' ? 'default' : 'outline'}
                  >
                    Select Trainee Profile
                  </Button>
                </div>
                {/* Background Decoration */}
                <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-colors" />
              </div>

              {/* Trainer Card */}
              <div
                className={cn(
                  'group relative cursor-pointer overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40 p-10 transition-all hover:border-primary/50 hover:bg-slate-900/60',
                  role === 'TRAINER' && 'border-primary bg-slate-900/80 ring-2 ring-primary/20'
                )}
                onClick={() => handleRoleSelect('TRAINER')}
              >
                <div className="relative z-10">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500/10 text-4xl transition-transform group-hover:scale-110">
                    📋
                  </div>
                  <h3 className="text-3xl font-bold mb-2">TRAINER</h3>
                  <p className="text-slate-400 mb-8 text-lg">
                    Manage the fleet. Deploy programs, monitor clients, and scale performance.
                  </p>
                  <ul className="mb-10 space-y-4 text-slate-300">
                    <li className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
                        ✓
                      </div>
                      Client command center
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
                        ✓
                      </div>
                      Multi-client analytics
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
                        ✓
                      </div>
                      Program architecture tools
                    </li>
                  </ul>
                  <Button
                    className="w-full h-14 text-lg font-bold"
                    variant={role === 'TRAINER' ? 'default' : 'outline'}
                  >
                    Select Trainer Profile
                  </Button>
                </div>
                {/* Background Decoration */}
                <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-blue-500/5 blur-3xl group-hover:bg-blue-500/10 transition-colors" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-right-12 duration-700">
              <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/50 p-10 shadow-2xl backdrop-blur-xl">
                <h2 className="text-3xl font-bold mb-4">BIOMETRIC CALIBRATION</h2>
                <p className="text-slate-400 mb-8">
                  DailyArc requires your current body mass to calculate metabolic and readiness
                  constants.
                </p>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor="weight"
                      className="text-sm font-bold tracking-widest text-slate-500 uppercase"
                    >
                      Current Weight (KG)
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="00.0"
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                      className="h-16 border-slate-700 bg-slate-800/50 text-2xl font-mono text-white placeholder:text-slate-600 focus:ring-primary focus:border-primary"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="outline"
                      className="h-14 flex-1 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                      onClick={() => setStep('ROLE')}
                    >
                      Back
                    </Button>
                    <Button
                      className="h-14 flex-[2] text-lg font-bold"
                      onClick={handleComplete}
                      disabled={loading || !weight}
                    >
                      Complete Registration
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 p-8 text-center text-slate-600 text-xs font-mono uppercase tracking-widest">
        DailyArc Navigation System v1.0 // Authored by Hytel
      </footer>
    </div>
  )
}
