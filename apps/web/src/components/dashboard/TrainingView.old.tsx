import { useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Toast } from '@repo/ui'
import { useAuth } from '@/hooks/useAuth'
import { useLogWorkout } from '@/hooks/useLogWorkout'
import {
  CALISTHENICS_TREE,
  isExerciseUnlocked,
  type ExerciseNode,
  type CreateWorkoutInput,
} from '@repo/shared'

interface ExerciseWithState extends ExerciseNode {
  unlocked: boolean
  completed: boolean
}

export default function TrainingView() {
  const { user } = useAuth()
  const logWorkoutMutation = useLogWorkout()

  // Mock completed exercises (TODO: Fetch from user profile in future phase)
  const [completedExerciseIds, setCompletedExerciseIds] = useState<string[]>([
    'wall-pu',
    'incline-pu',
    'knee-pu',
  ])

  // Build exercises with state (unlocked/completed)
  const exercises: ExerciseWithState[] = CALISTHENICS_TREE.map((exercise) => ({
    ...exercise,
    unlocked: isExerciseUnlocked(exercise.id, completedExerciseIds),
    completed: completedExerciseIds.includes(exercise.id),
  }))

  const [selectedExercise, setSelectedExercise] = useState<ExerciseWithState | null>(null)
  const [logSets, setLogSets] = useState<{ reps: number; rpe: number }[]>([])
  const [toast, setToast] = useState<{
    visible: boolean
    variant: 'default' | 'success' | 'destructive'
    message: string
  }>({ visible: false, variant: 'default', message: '' })

  const currentLevel = completedExerciseIds.length
  const progressPct = (currentLevel / CALISTHENICS_TREE.length) * 100

  const handleStartSession = (exercise: ExerciseWithState) => {
    setSelectedExercise(exercise)
    setLogSets(Array(exercise.sets).fill({ reps: exercise.reps, rpe: 7 }))
  }

  const handleLogSet = (index: number, field: 'reps' | 'rpe', value: number) => {
    setLogSets((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  const handleComplete = async () => {
    if (!selectedExercise || !user) return

    try {
      const workoutInput: CreateWorkoutInput = {
        exerciseId: selectedExercise.id,
        exerciseName: selectedExercise.name,
        level: selectedExercise.level,
        sets: logSets,
      }

      await logWorkoutMutation.mutateAsync({
        userId: user.uid,
        input: workoutInput,
      })

      // Mark exercise as completed (in future, this will update user profile)
      setCompletedExerciseIds((prev) => [...prev, selectedExercise.id])

      // Show success toast
      setToast({
        visible: true,
        variant: 'success',
        message: `${selectedExercise.name} completed! 🔥`,
      })

      // Clear selection
      setSelectedExercise(null)
      setLogSets([])

      // Auto-hide toast after 3 seconds
      setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }))
      }, 3000)
    } catch (error) {
      console.error('Failed to log workout:', error)
      setToast({
        visible: true,
        variant: 'destructive',
        message: 'Failed to log workout. Please try again.',
      })
    }
  }

  return (
    <>
      {/* Toast Notification */}
      <Toast
        variant={toast.variant}
        visible={toast.visible}
        onClose={() => setToast((prev) => ({ ...prev, visible: false }))}
      >
        {toast.message}
      </Toast>

      <div className="flex flex-col gap-6">
      {/* Progression Overview */}
      <Card className="border-border bg-card">
        <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">PUSHUP ARC</h2>
            <p className="text-sm text-muted-foreground">
              Level {currentLevel} of {exercises.length} -- {Math.round(progressPct)}% mastered
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-3 w-48 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-[hsl(var(--primary))] transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="font-mono text-sm font-bold text-[hsl(var(--primary))]">{currentLevel}/{exercises.length}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tech Tree */}
        <div className="flex flex-col gap-3 lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Progression Tree</h3>
          <div className="flex flex-col gap-2">
            {exercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className={`relative flex items-center gap-4 rounded-xl border px-5 py-4 transition-all ${
                  exercise.completed
                    ? 'border-[hsl(var(--chart-carbs)/0.3)] bg-[hsl(var(--chart-carbs)/0.05)]'
                    : exercise.unlocked
                      ? 'cursor-pointer border-border bg-card hover:border-[hsl(var(--primary)/0.3)]'
                      : 'border-border bg-card opacity-50'
                }`}
                onClick={() => exercise.unlocked && !exercise.completed && handleStartSession(exercise)}
              >
                {/* Connection Line */}
                {index > 0 && (
                  <div className="absolute -top-2 left-8 h-2 w-px bg-border" />
                )}

                {/* Level Badge */}
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold ${
                    exercise.completed
                      ? 'bg-[hsl(var(--chart-carbs)/0.15)] text-[hsl(var(--chart-carbs))]'
                      : exercise.unlocked
                        ? 'bg-[hsl(var(--primary)/0.15)] text-[hsl(var(--primary))]'
                        : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {exercise.completed ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    `L${exercise.level}`
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{exercise.name}</span>
                    {!exercise.unlocked && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{exercise.description}</p>
                </div>

                {/* Prescription */}
                <div className="text-right">
                  <span className="font-mono text-sm font-bold text-foreground">{exercise.sets}x{exercise.reps}</span>
                  <p className="text-xs text-muted-foreground">sets x reps</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Session Logger */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Session Logger</h3>
          {selectedExercise ? (
            <Card className="border-[hsl(var(--primary)/0.3)] bg-card">
              <CardHeader>
                <CardTitle className="text-foreground">{selectedExercise.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <p className="text-sm text-muted-foreground">{selectedExercise.description}</p>

                {logSets.map((set, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-secondary/50 p-3">
                    <span className="font-mono text-xs font-bold text-muted-foreground">SET {i + 1}</span>
                    <div className="flex flex-1 flex-col gap-1">
                      <label className="text-xs text-muted-foreground">Reps</label>
                      <input
                        type="number"
                        value={set.reps}
                        onChange={e => handleLogSet(i, 'reps', Number(e.target.value))}
                        className="h-8 w-full rounded-md border border-border bg-background px-2 font-mono text-sm text-foreground"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted-foreground">RPE</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={set.rpe}
                        onChange={e => handleLogSet(i, 'rpe', Number(e.target.value))}
                        className="h-8 w-16 rounded-md border border-border bg-background px-2 font-mono text-sm text-foreground"
                      />
                    </div>
                  </div>
                ))}

                <Button
                  onClick={handleComplete}
                  className="h-11 font-bold"
                  disabled={logWorkoutMutation.isPending}
                >
                  {logWorkoutMutation.isPending ? 'Saving...' : 'Complete Session'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border bg-card">
              <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">
                  Select an unlocked exercise from the progression tree to begin logging your session.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
