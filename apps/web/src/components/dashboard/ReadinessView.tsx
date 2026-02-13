import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Card, CardContent, CardHeader, CardTitle, Slider, Toast } from '@repo/ui'
import { Check } from 'lucide-react'
import {
  calculateReadinessFactor,
  calculateReadinessAverage,
  getRecommendation,
  calculateDynamicMacros,
} from '@repo/shared/logic'
import { ReadinessFormSchema, type ReadinessInput, type ReadinessForm } from '@repo/shared/schemas/readiness'
import { useAuth } from '@/hooks/useAuth'
import { useSubmitReadiness } from '@/hooks/useSubmitReadiness'
import { useTodayReadiness } from '@/hooks/useTodayReadiness'
import MacroRing from './MacroRing'

const SORENESS_ZONES = [
  'Shoulders',
  'Chest',
  'Upper Back',
  'Lower Back',
  'Quads',
  'Hamstrings',
  'Calves',
  'Core',
]

const SLIDER_META: {
  key: keyof ReadinessInput
  label: string
  lowLabel: string
  highLabel: string
  description: string
}[] = [
  {
    key: 'sleep',
    label: 'Sleep Quality',
    lowLabel: 'Terrible',
    highLabel: 'Excellent',
    description: 'How well did you sleep last night?',
  },
  {
    key: 'soreness',
    label: 'Muscle Soreness',
    lowLabel: 'Extreme',
    highLabel: 'None',
    description: 'How sore are your muscles?',
  },
  {
    key: 'stress',
    label: 'Stress Level',
    lowLabel: 'Very High',
    highLabel: 'Very Low',
    description: 'How stressed do you feel?',
  },
  {
    key: 'energy',
    label: 'Energy Level',
    lowLabel: 'Exhausted',
    highLabel: 'Fully Charged',
    description: 'How energized do you feel?',
  },
]

export default function ReadinessView() {
  const { user } = useAuth()
  const submitReadiness = useSubmitReadiness()
  const { data: todayReadiness, isLoading: isCheckingToday } = useTodayReadiness(user?.uid)

  // React Hook Form setup with validation
  const {
    control,
    watch,
    setValue,
    formState: { isValid },
  } = useForm<ReadinessForm>({
    resolver: zodResolver(ReadinessFormSchema),
    defaultValues: {
      sleep: 3,
      soreness: 3,
      stress: 3,
      energy: 3,
      sleepQuality: 75,
      restingHR: 65,
    },
    mode: 'onChange',
  })

  // Watch form values for real-time updates
  const sleep = watch('sleep')
  const soreness = watch('soreness')
  const stress = watch('stress')
  const energy = watch('energy')
  const sleepQuality = watch('sleepQuality')
  const restingHR = watch('restingHR')

  // Additional state
  const [sorenessZones, setSorenessZones] = useState<string[]>([])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
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

  // Build the input object from form values
  const readinessInput: ReadinessInput = useMemo(
    () => ({ sleep, soreness, stress, energy }),
    [sleep, soreness, stress, energy]
  )

  // --- LIVE RF CALCULATION (pure function from @repo/shared) ---------------
  const readinessFactor = useMemo(() => calculateReadinessFactor(readinessInput), [readinessInput])

  const readinessAverage = useMemo(
    () => calculateReadinessAverage(readinessInput),
    [readinessInput]
  )

  const recommendation = useMemo(() => getRecommendation(readinessFactor), [readinessFactor])

  // Body Battery is auto-calculated from energy slider (1-5 → 0-100%)
  const bodyBattery = useMemo(() => Math.round(((energy - 1) / 4) * 100), [energy])

  // Dynamic macros adjusted by RF
  const baseMacros = { protein: 180, carbs: 250, fat: 70 }
  const adjustedMacros = useMemo(
    () => calculateDynamicMacros(baseMacros, readinessFactor),
    [readinessFactor]
  )

  const values: Record<keyof ReadinessInput, number> = {
    sleep,
    soreness,
    stress,
    energy,
  }

  const toggleZone = (zone: string) => {
    setSorenessZones(prev => (prev.includes(zone) ? prev.filter(z => z !== zone) : [...prev, zone]))
  }

  const onSubmit = async () => {
    if (!user?.uid) {
      showToast('Please sign in to submit readiness check', 'destructive')
      return
    }

    try {
      await submitReadiness.mutateAsync({
        userId: user.uid,
        input: readinessInput,
        sorenessZones,
        bioMetrics: {
          sleepQuality,
          restingHR: restingHR || undefined,
          bodyBattery,
        },
      })

      setShowConfirmDialog(false)
      showToast('Daily readiness check submitted!', 'success')
    } catch {
      showToast('Failed to submit readiness. Please try again.', 'destructive')
    }
  }

  const handleSubmitClick = () => {
    setShowConfirmDialog(true)
  }

  // Recommendation display config
  const recMeta: Record<string, { color: string; desc: string }> = {
    REST: {
      color: 'hsl(var(--chart-warning))',
      desc: 'Active recovery or complete rest day advised.',
    },
    LIGHT: { color: 'hsl(var(--chart-fat))', desc: 'Focus on technique and mobility work.' },
    MODERATE: { color: 'hsl(var(--chart-carbs))', desc: 'A standard session is recommended.' },
    INTENSE: {
      color: 'hsl(var(--chart-protein))',
      desc: 'You are primed for a high-intensity session.',
    },
  }
  const rec = recMeta[recommendation]

  return (
    <div className="flex flex-col gap-6">
      {/* ── Hero: Live RF Display ─────────────────────────────────────── */}
      <Card className="border-border bg-card">
        <CardContent className="flex flex-col items-center gap-4 p-8 lg:flex-row lg:justify-between">
          <div className="flex flex-col items-center gap-2 lg:items-start">
            <h2 className="text-2xl font-black tracking-tight text-foreground">DAILY READINESS</h2>
            <p className="text-sm text-muted-foreground">
              How your body is performing today based on biometric inputs.
            </p>
          </div>

          {/* Live RF Ring — the "dancing" number */}
          <div className="relative flex h-44 w-44 items-center justify-center">
            <svg width="176" height="176" className="-rotate-90">
              <circle
                cx="88"
                cy="88"
                r="76"
                fill="none"
                stroke="hsl(var(--secondary))"
                strokeWidth="10"
              />
              <circle
                cx="88"
                cy="88"
                r="76"
                fill="none"
                stroke={rec.color}
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 76}
                strokeDashoffset={2 * Math.PI * 76 * (1 - (readinessFactor - 0.8) / 0.4)}
                strokeLinecap="round"
                className="ring-animate"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-foreground transition-all duration-300">
                {readinessFactor.toFixed(2)}x
              </span>
              <span className="text-xs font-semibold text-muted-foreground">RF MULTIPLIER</span>
            </div>
          </div>

          {/* Recommendation Badge */}
          <div className="flex flex-col items-center gap-2 lg:items-end">
            <div
              className="rounded-full px-5 py-2 text-sm font-bold tracking-wider"
              style={{ backgroundColor: `${rec.color}20`, color: rec.color }}
            >
              {recommendation}
            </div>
            <p className="max-w-[220px] text-center text-xs text-muted-foreground lg:text-right">
              {rec.desc}
            </p>
            <span className="font-mono text-xs text-muted-foreground">
              Avg Score: {readinessAverage.toFixed(1)} / 5
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Input Form: Four 1-5 Sliders ─────────────────────────────── */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Biometric Input</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {SLIDER_META.map(({ key, label, lowLabel, highLabel, description }) => (
              <div key={key} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">{label}</label>
                  <span className="font-mono text-sm font-bold text-[hsl(var(--primary))]">
                    {values[key]} / 5
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{description}</p>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={[values[key]]}
                  onValueChange={v => setValue(key, v[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{lowLabel}</span>
                  <span>{highLabel}</span>
                </div>
              </div>
            ))}

            {/* Soreness Zones */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Soreness Zones</label>
              <div className="flex flex-wrap gap-2">
                {SORENESS_ZONES.map(zone => (
                  <button
                    key={zone}
                    onClick={() => toggleZone(zone)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      sorenessZones.includes(zone)
                        ? 'border-[hsl(var(--chart-warning))] bg-[hsl(var(--chart-warning)/0.1)] text-[hsl(var(--chart-warning))]'
                        : 'border-border bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {zone}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio-Metrics Section */}
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-bold text-foreground mb-4">Manual Bio-Metrics</h3>

              {/* Sleep Quality */}
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Sleep Quality</label>
                  <span className="font-mono text-sm font-bold text-[hsl(var(--primary))]">
                    {sleepQuality}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Rate your sleep from 1-100</p>
                <input
                  type="range"
                  min={1}
                  max={100}
                  step={1}
                  value={sleepQuality}
                  onChange={e => setValue('sleepQuality', Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Resting HR */}
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Resting HR (BPM)</label>
                  <span className="font-mono text-sm font-bold text-[hsl(var(--primary))]">
                    {restingHR}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Measure upon waking (typical: 60-100)
                </p>
                <input
                  type="number"
                  min={40}
                  max={120}
                  value={restingHR || ''}
                  onChange={e => setValue('restingHR', e.target.value ? Number(e.target.value) : null)}
                  className="bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-foreground"
                  placeholder="Optional"
                />
              </div>

              {/* Body Battery / Energy Level — Auto calculated from Energy slider */}
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Body Battery</label>
                  <span className="font-mono text-sm font-bold text-[hsl(var(--primary))]">
                    {bodyBattery}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Auto-calculated from Energy Level above
                </p>
                <div className="w-full h-2 bg-slate-800 rounded-lg flex">
                  <div
                    className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg transition-all"
                    style={{ width: `${bodyBattery}%` }}
                  />
                </div>
              </div>
            </div>

            {todayReadiness && !isCheckingToday ? (
              <div className="mt-4 flex flex-col gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="font-bold text-green-500">Daily Check-in Complete</span>
                </div>
                <p className="text-sm text-muted-foreground">You've already submitted your readiness check for today.</p>
                <Button
                  onClick={handleSubmitClick}
                  variant="outline"
                  className="mt-2 h-10 text-sm font-bold"
                  disabled={!isValid || submitReadiness.isPending}
                >
                  Update Today's Readiness
                </Button>
              </div>
            ) : (
              <Button
                onClick={handleSubmitClick}
                className="mt-2 h-12 text-base font-bold"
                disabled={!isValid || submitReadiness.isPending || isCheckingToday}
              >
                {submitReadiness.isPending
                  ? 'Submitting...'
                  : isCheckingToday
                    ? 'Checking...'
                    : 'Submit Readiness Check'}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* ── Right Column: Macro Targets + Factor Breakdown ──────────── */}
        <div className="flex flex-col gap-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Adaptive Macro Targets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-6 text-sm text-muted-foreground">
                Targets adjusted by readiness factor of{' '}
                <span className="font-mono font-bold text-[hsl(var(--primary))]">
                  {readinessFactor.toFixed(2)}x
                </span>
              </p>
              <div className="flex items-center justify-around">
                <MacroRing
                  label="Protein"
                  current={Math.round(adjustedMacros.protein * 0.6)}
                  target={adjustedMacros.protein}
                  unit="g"
                  color="hsl(var(--chart-protein))"
                />
                <MacroRing
                  label="Carbs"
                  current={Math.round(adjustedMacros.carbs * 0.4)}
                  target={adjustedMacros.carbs}
                  unit="g"
                  color="hsl(var(--chart-carbs))"
                />
                <MacroRing
                  label="Fat"
                  current={Math.round(adjustedMacros.fat * 0.7)}
                  target={adjustedMacros.fat}
                  unit="g"
                  color="hsl(var(--chart-fat))"
                />
              </div>
            </CardContent>
          </Card>

          {/* Factor Breakdown */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Readiness Factor Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {SLIDER_META.map(({ key, label }) => (
                <FactorBar key={key} label={label} value={values[key]} max={5} color={rec.color} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Confirm Submission</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Ready to submit your daily readiness check with a Readiness Factor of{' '}
                <span className="font-mono font-bold text-foreground">{readinessFactor.toFixed(2)}x</span>?
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowConfirmDialog(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onSubmit}
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={submitReadiness.isPending}
                >
                  {submitReadiness.isPending ? 'Submitting...' : 'Confirm'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Toast */}
      <Toast
        variant={toast.variant}
        visible={toast.visible}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
      >
        {toast.message}
      </Toast>
    </div>
  )
}

function FactorBar({
  label,
  value,
  max,
  color,
}: {
  label: string
  value: number
  max: number
  color: string
}) {
  const pct = (value / max) * 100
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="font-mono text-xs font-bold text-foreground">
          {value}/{max}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
