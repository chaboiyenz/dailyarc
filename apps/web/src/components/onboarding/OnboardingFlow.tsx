import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import {
  Button,
  Input,
  Label,
  Toast,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@repo/ui'
import { useAuthContext } from '@/providers/AuthProvider'
import { db } from '@/lib/firebase'
import { UserSchema, type User } from '@repo/shared'
import { cn } from '@repo/ui/utils'

type Step = 'ROLE' | 'WEIGHT'

export default function OnboardingFlow() {
  const { user } = useAuthContext()
  const navigate = useNavigate()

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

      // 1. Construct raw data using the 'User' type to satisfy ESLint & provide early TS safety
      const rawUserData: User = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Arc User',
        photoURL: user.photoURL || null,
        role: role,
        onboardingComplete: true,
        trainerStatus: 'PENDING',
        inventory: [],
        bodyStats: {
          weight: isNaN(weightNum) ? 0 : weightNum,
        },
        cardioStats: {},
        currentPushupLevel: 0,
        powerliftingStats: {},
        trainingMode: 'bodyweight',
        fitnessGoals: [],
        unitPreference: 'metric',
        isPublicProfile: false,
        // Using current Date for Zod validation; replaced with serverTimestamp in DB call
        createdAt: new Date(),
      }

      // 2. Outbound Zod Validation (The "Rigging" Fix)
      // This ensures data is valid according to packages/shared before it ever touches the network
      const validation = UserSchema.safeParse(rawUserData)
      if (!validation.success) {
        console.error('Validation Error:', validation.error.format())
        showToast('Calibration failed: Biometric data mismatch.', 'destructive')
        return
      }

      // 3. Save to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        ...validation.data,
        createdAt: serverTimestamp(), // Overwrite with server-side time for DB consistency
      })

      // 4. Trigger Navigation
      // Replaces window.location.reload() for a smoother SPA experience
      navigate(role === 'TRAINER' ? '/trainer/dashboard' : '/dashboard')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      showToast('System link failure. Please try again.', 'destructive')
    } finally {
      setLoading(false)
    }
  }

  const progressValue = step === 'ROLE' ? 50 : 100

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-950 text-white overflow-hidden">
      {/* Fixed Progress Bar */}
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

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm font-medium text-primary text-center">
              INITIATING ARC...
              <br />
              <span className="text-[10px] text-slate-500 font-mono tracking-widest">
                CALIBRATING BIOMETRICS
              </span>
            </p>
          </div>
        </div>
      )}

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-6xl">
          <div className="mb-12 text-center lg:text-left">
            <h1 className="text-4xl font-black tracking-tight lg:text-6xl uppercase">
              Initiate <span className="text-primary">Arc</span>
            </h1>
            <p className="mt-4 text-slate-400 text-lg lg:text-xl max-w-2xl">
              Select your operational role and calibrate your biometric data to begin.
            </p>
          </div>

          {step === 'ROLE' ? (
            <div className="grid gap-8 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-8 duration-700">
              {/* Trainee Profile Card */}
              <Card
                className={cn(
                  'group relative cursor-pointer border-slate-800 bg-slate-900/40 p-4 transition-all hover:border-primary/50',
                  role === 'TRAINEE' && 'border-primary bg-slate-900/80 ring-2 ring-primary/20'
                )}
                onClick={() => handleRoleSelect('TRAINEE')}
              >
                <CardHeader>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-3xl group-hover:scale-110 transition-transform">
                    🏋️
                  </div>
                  <CardTitle className="text-3xl font-bold">TRAINEE</CardTitle>
                  <CardDescription className="text-slate-400 text-base">
                    Execute the protocol. Track progress, level up stats, and conquer goals.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="mb-8 space-y-3 text-sm text-slate-300">
                    <li className="flex items-center gap-2">✅ Real-time readiness factor</li>
                    <li className="flex items-center gap-2">✅ Pushup progression engine</li>
                    <li className="flex items-center gap-2">✅ Biometric analytics</li>
                  </ul>
                  <Button
                    className="w-full h-12 font-bold uppercase tracking-widest"
                    variant={role === 'TRAINEE' ? 'default' : 'outline'}
                  >
                    Select Trainee
                  </Button>
                </CardContent>
              </Card>

              {/* Trainer Profile Card */}
              <Card
                className={cn(
                  'group relative cursor-pointer border-slate-800 bg-slate-900/40 p-4 transition-all hover:border-blue-500/50',
                  role === 'TRAINER' && 'border-blue-500 bg-slate-900/80 ring-2 ring-blue-500/20'
                )}
                onClick={() => handleRoleSelect('TRAINER')}
              >
                <CardHeader>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl group-hover:scale-110 transition-transform">
                    📋
                  </div>
                  <CardTitle className="text-3xl font-bold">TRAINER</CardTitle>
                  <CardDescription className="text-slate-400 text-base">
                    Manage the fleet. Deploy programs, monitor clients, and scale performance.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="mb-8 space-y-3 text-sm text-slate-300">
                    <li className="flex items-center gap-2">✅ Client command center</li>
                    <li className="flex items-center gap-2">✅ Multi-client analytics</li>
                    <li className="flex items-center gap-2">✅ Program architecture tools</li>
                  </ul>
                  <Button
                    className="w-full h-12 font-bold uppercase tracking-widest"
                    variant={role === 'TRAINER' ? 'default' : 'outline'}
                  >
                    Select Trainer
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-right-12 duration-700">
              <Card className="w-full max-w-xl border-slate-800 bg-slate-900/50 p-6 shadow-2xl backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold uppercase">
                    Biometric Calibration
                  </CardTitle>
                  <CardDescription>
                    DailyArc requires your current body mass to calculate metabolic and readiness
                    constants.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor="weight"
                      className="text-xs font-bold tracking-widest text-slate-500 uppercase"
                    >
                      Current Weight (KG)
                    </Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="00.0"
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                      className="h-16 border-slate-700 bg-slate-800/50 text-2xl font-mono text-white placeholder:text-slate-700 focus:ring-primary"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      className="h-14 flex-1 border-slate-700"
                      onClick={() => setStep('ROLE')}
                    >
                      Back
                    </Button>
                    <Button
                      className="h-14 flex-[2] text-lg font-bold uppercase"
                      onClick={handleComplete}
                      disabled={loading || !weight}
                    >
                      Complete Calibration
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-10 p-8 text-center text-slate-600 text-[10px] font-mono uppercase tracking-[0.2em]">
        DailyArc Navigation System v1.0 // Authored by Hytel
      </footer>
    </div>
  )
}
