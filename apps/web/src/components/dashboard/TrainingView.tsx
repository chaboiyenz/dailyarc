/**
 * Training View - Game-Style Tech Tree
 * Node-based progression graph with glowing effects and skill points UI
 */

import { useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Toast } from '@repo/ui'
import { useAuth } from '@/hooks/useAuth'
import { useLogWorkout } from '@/hooks/useLogWorkout'
import TechTreeGraph from './TechTreeGraph'
import {
  CALISTHENICS_TREE,
  isExerciseUnlocked,
  getProgressionPercentage,
  type ExerciseNode,
  type CreateWorkoutInput,
} from '@repo/shared'

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
  const exercises = CALISTHENICS_TREE.map((exercise) => ({
    ...exercise,
    unlocked: isExerciseUnlocked(exercise.id, completedExerciseIds),
    completed: completedExerciseIds.includes(exercise.id),
  }))

  const [selectedExercise, setSelectedExercise] = useState<ExerciseNode | null>(null)
  const [logSets, setLogSets] = useState<{ reps: number; rpe: number }[]>([])
  const [toast, setToast] = useState<{
    visible: boolean
    variant: 'default' | 'success' | 'destructive'
    message: string
  }>({ visible: false, variant: 'default', message: '' })

  const currentLevel = completedExerciseIds.length
  const progressPct = getProgressionPercentage(currentLevel)
  const skillPoints = currentLevel * 10 // 10 skill points per completed exercise

  const handleNodeClick = (exercise: ExerciseNode) => {
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

      // Mark exercise as completed
      setCompletedExerciseIds((prev) => [...prev, selectedExercise.id])

      // Show success toast
      setToast({
        visible: true,
        variant: 'success',
        message: `${selectedExercise.name} mastered! +10 Skill Points 🎯`,
      })

      // Clear selection
      setSelectedExercise(null)
      setLogSets([])

      setTimeout(() => setToast((prev) => ({ ...prev, visible: false })), 3000)
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
        {/* Header with Stats Overlay */}
        <div className="relative">
          <Card className="glass-card">
            <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-foreground">PUSHUP ARC</h2>
                <p className="text-sm text-muted-foreground">
                  Calisthenics Progression System • Level {currentLevel} of {CALISTHENICS_TREE.length}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-3 w-64 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <span className="font-mono text-sm font-bold text-primary">
                  {progressPct}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Level & Skill Points Overlay - Top Right */}
          <div className="absolute right-4 top-4 flex gap-3">
            <div className="glass-card flex items-center gap-2 px-4 py-2 shadow-glow-blue">
              <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Level
                </span>
                <span className="font-mono text-lg font-black text-foreground">{currentLevel}</span>
              </div>
            </div>

            <div className="glass-card flex items-center gap-2 px-4 py-2 shadow-glow-green">
              <svg className="h-5 w-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Skill Points
                </span>
                <span className="font-mono text-lg font-black text-accent">{skillPoints}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Tech Tree - Takes up 2 columns */}
          <Card className="glass-card lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-foreground">Progression Tree</CardTitle>
              <p className="text-xs text-muted-foreground">
                Click an unlocked node to begin training session
              </p>
            </CardHeader>
            <CardContent>
              <TechTreeGraph
                completedExerciseIds={completedExerciseIds}
                onNodeClick={handleNodeClick}
              />
            </CardContent>
          </Card>

          {/* Session Logger - 1 column */}
          <div className="flex flex-col gap-6">
            <Card className="glass-card sticky top-6">
              <CardHeader>
                <CardTitle className="text-foreground">Session Logger</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedExercise ? (
                  <div className="flex flex-col gap-4">
                    <div className="glass-card p-4">
                      <h3 className="mb-2 text-lg font-black text-foreground">
                        {selectedExercise.name}
                      </h3>
                      <p className="mb-3 text-xs text-muted-foreground">
                        {selectedExercise.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-primary/20 px-2 py-1 font-mono text-xs font-bold text-primary">
                          Level {selectedExercise.level}
                        </span>
                        <span className="rounded bg-accent/20 px-2 py-1 font-mono text-xs font-bold text-accent">
                          {selectedExercise.sets}×{selectedExercise.reps}
                        </span>
                      </div>
                    </div>

                    {logSets.map((set, i) => (
                      <div key={i} className="glass-card flex items-center gap-3 p-3">
                        <span className="rounded bg-secondary px-2 py-1 font-mono text-xs font-bold text-muted-foreground">
                          SET {i + 1}
                        </span>
                        <div className="flex flex-1 flex-col gap-1">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Reps
                          </label>
                          <input
                            type="number"
                            value={set.reps}
                            onChange={(e) => handleLogSet(i, 'reps', Number(e.target.value))}
                            className="h-8 w-full rounded-md border border-border bg-background px-2 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            RPE
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={set.rpe}
                            onChange={(e) => handleLogSet(i, 'rpe', Number(e.target.value))}
                            className="h-8 w-16 rounded-md border border-border bg-background px-2 font-mono text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      onClick={handleComplete}
                      className="h-11 font-bold shadow-glow-blue transition-all hover:shadow-glow-green"
                      disabled={logWorkoutMutation.isPending}
                    >
                      {logWorkoutMutation.isPending ? 'Logging...' : '✓ Complete & Master'}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4 py-12 text-center">
                    <div className="rounded-xl bg-secondary/50 p-6">
                      <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        className="text-muted-foreground"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">No Exercise Selected</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Click an unlocked node from the progression tree to begin
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
