/**
 * Training View - 3-Tab Modality Interface
 * Professional athlete-grade training dashboard with Calisthenics, Iron, and Cardio tabs.
 */

import { useState, useMemo, memo, useEffect } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Toast,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@repo/ui'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
import { useLogWorkout, useWorkoutHistory } from '@/hooks/useLogWorkout'
import { useLatestDailyLog } from '@/hooks/useDailyLog'
import TechTreeGraph from './TechTreeGraph'
import { VolumeTrackerBar } from '../VolumeTrackerBar'
import {
  buildSkillTree,
  calculateVolume,
  calculateReadinessFactor,
  getIntensityAdjustment,
  type SkillNode,
  type TrainingMode,
  type WorkoutSet,
} from '@repo/shared'

/**
 * Memoized Session Logger Component
 * Prevents re-renders when parent state changes if these props haven't changed
 */
interface SessionLoggerProps {
  selectedExercise: SkillNode | null
  logSets: Array<{
    weight?: number
    reps: number
    rpe: number
    distance?: number
    duration?: number
    zone?: number
  }>
  sessionVolume: number
  trainingMode: TrainingMode
  onLogSet: (
    index: number,
    field: 'weight' | 'reps' | 'rpe' | 'distance' | 'duration' | 'zone',
    value: number
  ) => void
  onComplete: () => void
  onCancel: () => void
  isPending: boolean
}

const SessionLogger = memo(function SessionLogger({
  selectedExercise,
  logSets,
  sessionVolume,
  trainingMode,
  onLogSet,
  onComplete,
  onCancel,
  isPending,
}: SessionLoggerProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card className="border-border/50 bg-background/80 sticky top-4">
        <CardHeader className="py-3">
          <CardTitle className="text-foreground text-sm uppercase tracking-wider">
            Session Logger
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedExercise ? (
            <div className="flex flex-col gap-3">
              {/* Exercise header */}
              <div className="rounded-md border-l-4 border-primary bg-primary/5 p-3">
                <h3 className="font-black text-foreground">{selectedExercise.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold uppercase bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                    {selectedExercise.exerciseType}
                  </span>
                  <span className="text-[10px] font-bold uppercase bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                    L{selectedExercise.level}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground italic">
                  {selectedExercise.description}
                </p>
              </div>

              {/* Set inputs */}
              {logSets.map((set, i) => (
                <div key={i} className="rounded-md border border-border/30 p-3 space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">
                    Set {i + 1}
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedExercise.exerciseType === 'CARDIO' ? (
                      <>
                        <div className="flex flex-col">
                          <label className="text-[9px] uppercase font-bold text-muted-foreground">
                            Dist (km)
                          </label>
                          <input
                            type="number"
                            value={set.distance || ''}
                            onChange={e => onLogSet(i, 'distance', parseFloat(e.target.value))}
                            placeholder="0"
                            className="h-8 rounded bg-background/50 border border-white/10 px-2 text-sm font-mono focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-[9px] uppercase font-bold text-muted-foreground">
                            Time (min)
                          </label>
                          <input
                            type="number"
                            value={set.duration ? set.duration / 60 : ''}
                            onChange={e => onLogSet(i, 'duration', parseFloat(e.target.value) * 60)}
                            placeholder="0"
                            className="h-8 rounded bg-background/50 border border-white/10 px-2 text-sm font-mono focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-[9px] uppercase font-bold text-muted-foreground">
                            Zone
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={set.zone || ''}
                            onChange={e => onLogSet(i, 'zone', parseFloat(e.target.value))}
                            placeholder="1-5"
                            className="h-8 rounded bg-background/50 border border-white/10 px-2 text-sm font-mono focus:border-primary focus:outline-none"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {selectedExercise.exerciseType === 'WEIGHTLIFTING' && (
                          <div className="flex flex-col">
                            <label className="text-[9px] uppercase font-bold text-muted-foreground">
                              KG
                            </label>
                            <input
                              type="number"
                              value={set.weight || ''}
                              onChange={e => onLogSet(i, 'weight', Number(e.target.value))}
                              placeholder="0"
                              className="h-8 rounded bg-background/50 border border-white/10 px-2 text-sm font-mono focus:border-primary focus:outline-none"
                            />
                          </div>
                        )}
                        <div
                          className={
                            selectedExercise.exerciseType === 'WEIGHTLIFTING'
                              ? 'flex flex-col'
                              : 'flex flex-col col-span-2'
                          }
                        >
                          <label className="text-[9px] uppercase font-bold text-muted-foreground">
                            Reps
                          </label>
                          <input
                            type="number"
                            value={set.reps}
                            onChange={e => onLogSet(i, 'reps', Number(e.target.value))}
                            className="h-8 rounded bg-background/50 border border-white/10 px-2 text-sm font-mono focus:border-primary focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col">
                          <label className="text-[9px] uppercase font-bold text-muted-foreground">
                            RPE
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={set.rpe}
                            onChange={e => onLogSet(i, 'rpe', Number(e.target.value))}
                            className="h-8 rounded bg-background/50 border border-white/10 px-2 text-sm font-mono focus:border-primary focus:outline-none"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {/* Volume Tracker */}
              {trainingMode !== 'cardio' && (
                <div className="py-1">
                  <VolumeTrackerBar currentVolume={sessionVolume} />
                </div>
              )}

              <Button
                onClick={onComplete}
                className="h-11 font-bold uppercase tracking-wide"
                disabled={isPending}
              >
                {isPending ? 'LOGGING...' : 'LOG SESSION'}
              </Button>

              <Button variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-center opacity-50">
              <span className="text-3xl">🎯</span>
              <p className="text-sm font-medium">Select an exercise from the tree</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
})

// Cardio Zone reference data
const CARDIO_ZONES = [
  { zone: 1, name: 'Recovery', bpmRange: '50-60%', description: 'Light activity, active recovery' },
  {
    zone: 2,
    name: 'Aerobic Base',
    bpmRange: '60-70%',
    description: 'Fat burning, endurance building',
  },
  { zone: 3, name: 'Tempo', bpmRange: '70-80%', description: 'Moderate effort, aerobic capacity' },
  { zone: 4, name: 'Threshold', bpmRange: '80-90%', description: 'Hard effort, lactate threshold' },
  {
    zone: 5,
    name: 'VO2 Max',
    bpmRange: '90-100%',
    description: 'Maximum effort, sprint intervals',
  },
]

export default function TrainingView() {
  const { user, profile } = useAuth()
  const logWorkoutMutation = useLogWorkout()

  const [trainingMode, setTrainingMode] = useState<TrainingMode>(
    profile?.trainingMode || 'bodyweight'
  )

  const handleModeChange = async (mode: string) => {
    const m = mode as TrainingMode
    setTrainingMode(m)
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          trainingMode: m,
        })
      } catch (err) {
        console.error('Failed to persist training mode:', err)
      }
    }
  }

  // Fetch Workout History
  const {
    data: workouts,
    refetch: refetchWorkouts,
    status,
    isFetching,
  } = useWorkoutHistory(user?.uid || null)

  // Debug: Log whenever workouts change
  useEffect(() => {
    console.log('[TrainingView] 📥 Workouts query status:', {
      status,
      isFetching,
      count: workouts?.length || 0,
      userId: user?.uid,
    })

    if (workouts) {
      console.log('[TrainingView useEffect] Workouts state changed:', {
        count: workouts.length,
        exerciseIds: workouts.map(w => w.exerciseId),
        details: workouts.map(w => ({
          exerciseId: w.exerciseId,
          exerciseName: w.exerciseName,
          date: w.date,
        })),
      })
    } else {
      console.log('[TrainingView useEffect] ⚠️ Workouts is null/undefined')
    }
  }, [workouts, status, isFetching, user?.uid])

  // Derived Completed Exercises
  const completedExerciseIds = useMemo(() => {
    if (!workouts) return []
    // Get unique exercise IDs from completed workouts or just all workouts?
    // "Completed" might mean they did the session.
    // If we want "Mastered", we should look for 'completed: true' in session,
    // but typically just doing it once counts as unlocking next for now, or we can check logic.
    // For now, let's assume if they logged it, it counts as "done" for the day,
    // but strict progression might require mastery.
    // Let's assume ANY logged session implies they are working on it or did it.
    // But the tree highlights "unlocked" vs "completed".
    // Let's use all logged exercise IDs as "completed" for visualization purposes
    // (or maybe we need a separate 'mastered' list).
    // For now, let's just collect all exerciseIds from history.
    const ids = Array.from(new Set(workouts.map(w => w.exerciseId)))
    console.log(
      '[TrainingView] 🔄 completedExerciseIds updated:',
      ids,
      'from',
      workouts.length,
      'workouts'
    )
    console.log(
      '[TrainingView] Detailed workout breakdown:',
      workouts.map(w => ({
        exerciseId: w.exerciseId,
        exerciseName: w.exerciseName,
        date: w.date,
      }))
    )
    return ids
  }, [workouts])

  // Fetch Latest Daily Log for Readiness
  const { data: dailyLog, isLoading: isLoadingLog } = useLatestDailyLog(user?.uid || null)

  // Build tree based on mode
  const tree = useMemo(() => buildSkillTree(trainingMode), [trainingMode])

  const [selectedExercise, setSelectedExercise] = useState<SkillNode | null>(null)

  // Sets state: { weight, reps, rpe, distance, duration, zone }
  const [logSets, setLogSets] = useState<
    {
      weight?: number
      reps: number
      rpe: number
      distance?: number
      duration?: number
      zone?: number
    }[]
  >([])

  const [toast, setToast] = useState<{
    visible: boolean
    variant: 'default' | 'success' | 'destructive'
    message: string
  }>({ visible: false, variant: 'default', message: '' })

  // Calculate current session volume
  const sessionVolume = useMemo(() => {
    return calculateVolume(logSets.map(s => ({ ...s, weight: s.weight || 0, notes: '' })))
  }, [logSets])

  // Calculate progress
  // Filter completions to only those in the current tree
  const completedInTree = useMemo(() => {
    const treeIds = new Set(tree.map(n => n.id))
    return completedExerciseIds.filter(id => treeIds.has(id)).length
  }, [tree, completedExerciseIds])

  const progressPct = Math.round((completedInTree / tree.length) * 100) || 0

  // Readiness Factor (RF)
  const rf = useMemo(() => {
    if (!dailyLog) {
      // Fallback if no log today: Assume "okay" readiness (3/5 -> 60% approx)
      // Or 0 to prompt them? Let's use a safe default.
      return 0.75
    }

    // Map DailyLog scales to ReadinessInput (1-5)
    // Sleep (1-10) -> /2 -> 1-5
    const sleep = Math.max(1, Math.min(5, Math.round(dailyLog.sleepQuality / 2)))

    // Soreness (1-10, 10=sore) -> Input (1=extreme, 5=none)
    // 10 -> 1, 1 -> 5.
    const soreness = Math.max(1, Math.min(5, Math.ceil((11 - dailyLog.soreness) / 2)))

    // Stress (1-10, 10=high) -> Input (1=high, 5=low)
    const stress = Math.max(1, Math.min(5, Math.ceil((11 - dailyLog.stressLevel) / 2)))

    // Energy from Fatigue (0-100%) -> Input (1=exhausted, 5=charged)
    // 100% fatigue -> 1 energy
    // 0% fatigue -> 5 energy
    const energy = Math.max(1, Math.min(5, 1 + (100 - dailyLog.fatigue) / 25))

    return calculateReadinessFactor({ sleep, soreness, stress, energy })
  }, [dailyLog])

  const rfDisplay = (rf * 100).toFixed(0)

  const handleNodeClick = (exercise: SkillNode) => {
    setSelectedExercise(exercise)
    const defaultWeight = exercise.exerciseType === 'WEIGHTLIFTING' ? 20 : 0
    setLogSets(Array(exercise.sets).fill({ weight: defaultWeight, reps: exercise.reps, rpe: 7 }))
  }

  const handleLogSet = (
    index: number,
    field: 'weight' | 'reps' | 'rpe' | 'distance' | 'duration' | 'zone',
    value: number
  ) => {
    setLogSets(prev => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  const handleComplete = async () => {
    if (!selectedExercise || !user || logWorkoutMutation.isPending) return

    try {
      console.log('[TrainingView] 🎯 Starting workout log for:', {
        exerciseId: selectedExercise.id,
        exerciseName: selectedExercise.name,
        level: selectedExercise.level,
        type: selectedExercise.exerciseType,
      })

      const setsPayload: WorkoutSet[] = logSets.map(s => {
        const set: WorkoutSet = {
          reps: s.reps,
          rpe: s.rpe,
        }
        // Firestore doesn't support 'undefined', so we must conditionally add optional fields
        if (s.weight !== undefined) set.weight = s.weight
        if (s.distance !== undefined) set.distance = s.distance
        if (s.duration !== undefined) set.duration = s.duration
        if (s.zone !== undefined) set.zone = s.zone
        return set
      })

      const workoutInput = {
        exerciseId: selectedExercise.id,
        exerciseName: selectedExercise.name,
        level: selectedExercise.level,
        exerciseType: selectedExercise.exerciseType,
        totalVolume: sessionVolume,
        totalDistance: logSets.reduce((acc, s) => acc + (s.distance || 0), 0),
        totalDuration: logSets.reduce((acc, s) => acc + (s.duration || 0), 0),
        sets: setsPayload,
      }

      console.log('[TrainingView] 📤 Sending to mutation:', workoutInput)

      await logWorkoutMutation.mutateAsync({
        userId: user.uid,
        input: workoutInput,
      })

      // Give the mutation onSuccess a moment to update cache
      await new Promise(resolve => setTimeout(resolve, 100))

      // Explicitly refetch workouts to ensure tree updates immediately
      console.log('[TrainingView] ⏳ Calling explicit refetch after mutation...')
      try {
        const result = await refetchWorkouts()
        console.log('[TrainingView] ✅ Refetch completed')
        console.log('[TrainingView] 📊 Refetch returned data:', {
          workoutCount: Array.isArray(result.data) ? result.data.length : 'unknown',
          status: result.status,
        })
      } catch (err) {
        console.error('[TrainingView] ⚠️ Refetch error (not blocking):', err)
      }

      // Optimization: we could optimistically update the cache here using queryClient.setQueryData
      // but for now, the mutation logic invalidates 'workouts' query, so it will refetch automatically.

      setToast({
        visible: true,
        variant: 'success',
        message: `${selectedExercise.name} logged! +${sessionVolume}kg Volume 📈`,
      })

      setSelectedExercise(null)
      setLogSets([])

      setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000)
    } catch (error) {
      console.error('[TrainingView] ❌ Failed to log workout:', error)
      setToast({
        visible: true,
        variant: 'destructive',
        message: 'Failed to log workout. Please try again.',
      })
    }
  }

  // Get current intensity recommendation
  const intensityAdj = useMemo(() => {
    const exerciseType =
      trainingMode === 'bodyweight'
        ? 'CALISTHENICS'
        : trainingMode === 'iron'
          ? 'WEIGHTLIFTING'
          : 'CARDIO'
    return getIntensityAdjustment(rf, exerciseType)
  }, [rf, trainingMode])

  // Map mode to tab value
  const tabValue =
    trainingMode === 'bodyweight' ? 'calisthenics' : trainingMode === 'iron' ? 'iron' : 'cardio'

  const handleTabChange = (value: string) => {
    const modeMap: Record<string, TrainingMode> = {
      calisthenics: 'bodyweight',
      iron: 'iron',
      cardio: 'cardio',
    }
    handleModeChange(modeMap[value] || 'bodyweight')
  }

  return (
    <>
      <Toast
        variant={toast.variant}
        visible={toast.visible}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
      >
        {toast.message}
      </Toast>

      <div className="flex flex-col gap-4 min-h-screen p-4">
        {/* Readiness Banner */}
        <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/80 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Readiness Factor
              </p>
              {isLoadingLog ? (
                <div className="h-7 w-24 rounded bg-muted"></div>
              ) : (
                <p className="text-lg font-black text-foreground">
                  {rfDisplay}%{' '}
                  <span className="text-sm font-medium text-muted-foreground">
                    → {intensityAdj.label}
                  </span>
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Milestones</p>
            <p className="font-mono text-sm font-bold text-primary">
              {completedInTree}/{tree.length}
            </p>
          </div>
        </div>

        {/* 3-Tab Modality */}
        <Tabs value={tabValue} onValueChange={handleTabChange}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="calisthenics">🤸 Calisthenics</TabsTrigger>
            <TabsTrigger value="iron">🏋️ Weightlifting</TabsTrigger>
            <TabsTrigger value="cardio">🏃 Cardio</TabsTrigger>
          </TabsList>

          {/* ─── Calisthenics Tab ─── */}
          <TabsContent value="calisthenics">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="border-border/50 bg-background/60 lg:col-span-2">
                <CardHeader className="py-3">
                  <CardTitle className="text-foreground text-sm uppercase tracking-wider">
                    Skill Tree — Bodyweight
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TechTreeGraph
                    tree={tree}
                    completedExerciseIds={completedExerciseIds}
                    onNodeClick={handleNodeClick}
                  />
                </CardContent>
              </Card>
              <SessionLogger
                selectedExercise={selectedExercise}
                logSets={logSets}
                sessionVolume={sessionVolume}
                trainingMode={trainingMode}
                onLogSet={handleLogSet}
                onComplete={handleComplete}
                onCancel={() => {
                  setSelectedExercise(null)
                  setLogSets([])
                }}
                isPending={logWorkoutMutation.isPending}
              />
            </div>
          </TabsContent>

          {/* ─── Iron Tab ─── */}
          <TabsContent value="iron">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="border-border/50 bg-background/60 lg:col-span-2">
                <CardHeader className="py-3">
                  <CardTitle className="text-foreground text-sm uppercase tracking-wider">
                    Iron Arc — Volume Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <VolumeTrackerBar currentVolume={sessionVolume} />
                  <TechTreeGraph
                    tree={tree}
                    completedExerciseIds={completedExerciseIds}
                    onNodeClick={handleNodeClick}
                  />
                </CardContent>
              </Card>
              <SessionLogger
                selectedExercise={selectedExercise}
                logSets={logSets}
                sessionVolume={sessionVolume}
                trainingMode={trainingMode}
                onLogSet={handleLogSet}
                onComplete={handleComplete}
                onCancel={() => {
                  setSelectedExercise(null)
                  setLogSets([])
                }}
                isPending={logWorkoutMutation.isPending}
              />
            </div>
          </TabsContent>

          {/* ─── Cardio Tab ─── */}
          <TabsContent value="cardio">
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Zone Reference */}
              <Card className="border-border/50 bg-background/60 lg:col-span-2">
                <CardHeader className="py-3">
                  <CardTitle className="text-foreground text-sm uppercase tracking-wider">
                    Heart Rate Zones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-6">
                    {CARDIO_ZONES.map(z => (
                      <div
                        key={z.zone}
                        className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors ${
                          intensityAdj.label.includes(String(z.zone)) ||
                          (z.zone <= 2 && intensityAdj.label.includes('ZONE 2')) ||
                          (z.zone <= 1 && intensityAdj.label.includes('ZONE 1'))
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border/30 text-muted-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold w-6">Z{z.zone}</span>
                          <span className="font-semibold">{z.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-xs">{z.bpmRange} HR</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <TechTreeGraph
                    tree={tree}
                    completedExerciseIds={completedExerciseIds}
                    onNodeClick={handleNodeClick}
                  />
                </CardContent>
              </Card>
              <SessionLogger
                selectedExercise={selectedExercise}
                logSets={logSets}
                sessionVolume={sessionVolume}
                trainingMode={trainingMode}
                onLogSet={handleLogSet}
                onComplete={handleComplete}
                onCancel={() => {
                  setSelectedExercise(null)
                  setLogSets([])
                }}
                isPending={logWorkoutMutation.isPending}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Progress Bar */}
        {progressPct > 0 && (
          <div className="flex items-center gap-3 rounded-md border border-border/30 bg-background/50 px-4 py-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="font-mono text-xs font-bold text-primary">{progressPct}%</span>
          </div>
        )}
      </div>
    </>
  )
}
