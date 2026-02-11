import { useState, useMemo } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Slider, Toast } from '@repo/ui'
import {
  calculateReadiness,
  calculateReadinessFactor,
  calculateDynamicMacros,
} from '@repo/shared/logic'
import { useAuth } from '@/hooks/useAuth'
import { useSubmitReadiness } from '@/hooks/useSubmitReadiness'
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

export default function ReadinessView() {
  const { user } = useAuth()
  const submitReadiness = useSubmitReadiness()

  const [sleep, setSleep] = useState(7)
  const [stress, setStress] = useState(5)
  const [soreness, setSoreness] = useState(5)
  const [fatigue, setFatigue] = useState(30)
  const [sorenessZones, setSorenessZones] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [toast, setToast] = useState<{
    visible: boolean
    message: string
    variant: 'default' | 'destructive' | 'success'
  }>({
    visible: false,
    message: '',
    variant: 'default',
  })

  const showToast = (message: string, variant: 'default' | 'destructive' | 'success' = 'default') => {
    setToast({ visible: true, message, variant })
    setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000)
  }

  const readinessScore = useMemo(() => {
    return calculateReadiness({
      sleepQuality: sleep,
      stressLevel: 10 - stress, // invert: low stress = high score
      soreness: 10 - soreness, // invert: low soreness = high score
      fatigue,
    })
  }, [sleep, stress, soreness, fatigue])

  const recommendation = useMemo(() => {
    if (readinessScore >= 8) return { label: 'INTENSE', color: 'hsl(var(--chart-protein))', desc: 'You are primed for a high-intensity session.' }
    if (readinessScore >= 6) return { label: 'MODERATE', color: 'hsl(var(--chart-carbs))', desc: 'A standard session is recommended.' }
    if (readinessScore >= 4) return { label: 'LIGHT', color: 'hsl(var(--chart-fat))', desc: 'Focus on technique and mobility work.' }
    return { label: 'REST', color: 'hsl(var(--chart-warning))', desc: 'Active recovery or complete rest day advised.' }
  }, [readinessScore])

  // Dynamic macros based on readiness factor using shared logic
  const readinessFactor = useMemo(() => {
    return calculateReadinessFactor(readinessScore)
  }, [readinessScore])

  const baseMacros = { protein: 180, carbs: 250, fat: 70 }
  const adjustedMacros = useMemo(() => {
    return calculateDynamicMacros(baseMacros, readinessFactor)
  }, [readinessFactor])

  const toggleZone = (zone: string) => {
    setSorenessZones(prev =>
      prev.includes(zone) ? prev.filter(z => z !== zone) : [...prev, zone]
    )
  }

  const handleSubmit = async () => {
    if (!user?.uid) {
      showToast('Please sign in to submit readiness check', 'destructive')
      return
    }

    try {
      await submitReadiness.mutateAsync({
        userId: user.uid,
        input: {
          sleepQuality: sleep,
          stressLevel: 10 - stress, // Store inverted value
          soreness: 10 - soreness, // Store inverted value
          fatigue,
          sorenessZones,
        },
      })

      setSubmitted(true)
      showToast('Readiness check submitted successfully!', 'success')
    } catch (error) {
      console.error('Failed to submit readiness:', error)
      showToast('Failed to submit readiness. Please try again.', 'destructive')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Readiness Score Hero */}
      <Card className="border-border bg-card">
        <CardContent className="flex flex-col items-center gap-4 p-8 lg:flex-row lg:justify-between">
          <div className="flex flex-col items-center gap-2 lg:items-start">
            <h2 className="text-2xl font-black tracking-tight text-foreground">DAILY READINESS</h2>
            <p className="text-sm text-muted-foreground">
              How your body is performing today based on biometric inputs.
            </p>
          </div>

          {/* Score Ring */}
          <div className="relative flex h-44 w-44 items-center justify-center">
            <svg width="176" height="176" className="-rotate-90">
              <circle cx="88" cy="88" r="76" fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" />
              <circle
                cx="88"
                cy="88"
                r="76"
                fill="none"
                stroke={recommendation.color}
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 76}
                strokeDashoffset={2 * Math.PI * 76 * (1 - readinessScore / 10)}
                strokeLinecap="round"
                className="ring-animate"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-foreground">{readinessScore.toFixed(1)}</span>
              <span className="text-xs font-semibold text-muted-foreground">/ 10</span>
            </div>
          </div>

          {/* Recommendation Badge */}
          <div className="flex flex-col items-center gap-2 lg:items-end">
            <div
              className="rounded-full px-5 py-2 text-sm font-bold tracking-wider"
              style={{ backgroundColor: `${recommendation.color}20`, color: recommendation.color }}
            >
              {recommendation.label}
            </div>
            <p className="max-w-[220px] text-center text-xs text-muted-foreground lg:text-right">
              {recommendation.desc}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Form */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">Biometric Input</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {/* Sleep */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Sleep Quality</label>
                <span className="font-mono text-sm font-bold text-[hsl(var(--primary))]">{sleep}/10</span>
              </div>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[sleep]}
                onValueChange={(value) => setSleep(value[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Poor</span><span>Excellent</span>
              </div>
            </div>

            {/* Stress */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Stress Level</label>
                <span className="font-mono text-sm font-bold text-[hsl(var(--primary))]">{stress}/10</span>
              </div>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[stress]}
                onValueChange={(value) => setStress(value[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low</span><span>High</span>
              </div>
            </div>

            {/* Soreness */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Muscle Soreness</label>
                <span className="font-mono text-sm font-bold text-[hsl(var(--primary))]">{soreness}/10</span>
              </div>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[soreness]}
                onValueChange={(value) => setSoreness(value[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>None</span><span>Extreme</span>
              </div>
            </div>

            {/* Fatigue */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Fatigue Level</label>
                <span className="font-mono text-sm font-bold text-[hsl(var(--primary))]">{fatigue}%</span>
              </div>
              <Slider
                min={0}
                max={100}
                step={5}
                value={[fatigue]}
                onValueChange={(value) => setFatigue(value[0])}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Fresh</span><span>Exhausted</span>
              </div>
            </div>

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

            <Button
              onClick={handleSubmit}
              className="mt-2 h-12 text-base font-bold"
              disabled={submitReadiness.isPending}
            >
              {submitReadiness.isPending
                ? 'Submitting...'
                : submitted
                  ? 'Update Readiness'
                  : 'Submit Readiness Check'}
            </Button>
          </CardContent>
        </Card>

        {/* Macro Targets */}
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

          {/* Readiness Factor Explanation */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">Readiness Factor Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <FactorBar label="Sleep Quality" value={sleep} max={10} color="hsl(var(--chart-protein))" />
              <FactorBar label="Stress (inverted)" value={10 - stress} max={10} color="hsl(var(--chart-carbs))" />
              <FactorBar label="Soreness (inverted)" value={10 - soreness} max={10} color="hsl(var(--chart-fat))" />
              <FactorBar label="Energy Reserve" value={100 - fatigue} max={100} color="hsl(var(--accent))" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        variant={toast.variant}
        visible={toast.visible}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      >
        {toast.message}
      </Toast>
    </div>
  )
}

function FactorBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = (value / max) * 100
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="font-mono text-xs font-bold text-foreground">{value}/{max}</span>
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
