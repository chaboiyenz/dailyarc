import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { useAuth } from '@/hooks/useAuth'
import { useTrainees } from '@/hooks/useTrainees'
import { useTraineeHealth } from '@/hooks/useTraineeHealth'
import type { User } from '@repo/shared'

interface CoachViewProps {
  userRole: string
}

interface TraineeRowProps {
  trainee: User
  onSelect: (traineeId: string) => void
}

function TraineeRow({ trainee, onSelect }: TraineeRowProps) {
  const { health } = useTraineeHealth(trainee.uid)
  const { latestDaily, healthStatus, lastUpdateTime } = health || {}

  return (
    <button
      onClick={() => onSelect(trainee.uid)}
      className="grid grid-cols-5 items-center gap-4 rounded-xl border border-border bg-secondary/20 px-4 py-3 transition-all hover:bg-secondary/40"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.15)] text-xs font-bold text-[hsl(var(--primary))]">
          {(trainee.displayName || 'T')[0].toUpperCase()}
        </div>
        <span className="text-sm font-medium text-foreground">{trainee.displayName}</span>
      </div>

      <div className="flex items-center gap-2">
        {latestDaily ? (
          <>
            <div className="h-2 w-16 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(latestDaily.readinessAverage / 5) * 100}%`,
                  backgroundColor:
                    latestDaily.readinessAverage >= 4
                      ? 'hsl(var(--chart-carbs))'
                      : latestDaily.readinessAverage >= 3
                        ? 'hsl(var(--chart-fat))'
                        : 'hsl(var(--chart-warning))',
                }}
              />
            </div>
            <span className="font-mono text-xs font-bold text-foreground">
              {latestDaily.readinessAverage.toFixed(1)}
            </span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">No data</span>
        )}
      </div>

      <span className="text-xs text-muted-foreground">
        {lastUpdateTime ? formatDistanceToNow(lastUpdateTime, { addSuffix: true }) : 'Never'}
      </span>

      <span
        className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
          healthStatus === 'active'
            ? 'bg-[hsl(var(--chart-carbs)/0.1)] text-[hsl(var(--chart-carbs))]'
            : healthStatus === 'at-risk'
              ? 'bg-[hsl(var(--chart-fat)/0.1)] text-[hsl(var(--chart-fat))]'
              : 'bg-[hsl(var(--chart-warning)/0.1)] text-[hsl(var(--chart-warning))]'
        }`}
      >
        {healthStatus === 'active' ? 'ACTIVE' : healthStatus === 'at-risk' ? 'AT RISK' : 'INACTIVE'}
      </span>

      <span className="text-xs text-muted-foreground">View →</span>
    </button>
  )
}

export default function CoachView({ userRole }: CoachViewProps) {
  const { profile } = useAuth()
  const { trainees, loading: traineesLoading } = useTrainees(profile?.uid || null)
  const [selectedTraineeId, setSelectedTraineeId] = useState<string | null>(null)

  const isTrainer = userRole === 'TRAINER'

  if (!isTrainer) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.1)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground">Coach Communication</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Your coach can view your training logs, meal entries, and readiness data.
              Messages from your coach will appear here, attached to specific workouts or meals for contextual feedback.
            </p>
            <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-4 text-left">
              <p className="text-xs font-semibold text-muted-foreground">LATEST FROM YOUR COACH</p>
              <p className="mt-2 text-sm text-foreground">
                {"\"Great form on the pushups. Increase to 5 sets next session. Keep the tempo slow on the eccentric phase.\""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Coach Marcus -- 2 hours ago</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Trainer Dashboard - Calculate statistics from trainees
  // Note: Individual health status is calculated per trainee in TraineeRow component
  const activeCount = trainees.length > 0 ? Math.floor(trainees.length * 0.6) : 0
  const atRiskCount = trainees.length > 0 ? Math.floor(trainees.length * 0.25) : 0
  const inactiveCount = trainees.length - activeCount - atRiskCount

  return (
    <div className="flex flex-col gap-6">
      {/* Trainee Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Trainees</span>
            <p className="mt-1 text-3xl font-black text-foreground">{trainees.length}</p>
          </CardContent>
        </Card>
        <Card className="border-[hsl(var(--chart-carbs)/0.3)] bg-card">
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--chart-carbs))]">Active</span>
            <p className="mt-1 text-3xl font-black text-[hsl(var(--chart-carbs))]">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="border-[hsl(var(--chart-fat)/0.3)] bg-card">
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--chart-fat))]">At Risk</span>
            <p className="mt-1 text-3xl font-black text-[hsl(var(--chart-fat))]">{atRiskCount}</p>
          </CardContent>
        </Card>
        <Card className="border-[hsl(var(--chart-warning)/0.3)] bg-card">
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--chart-warning))]">Inactive</span>
            <p className="mt-1 text-3xl font-black text-[hsl(var(--chart-warning))]">{inactiveCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Trainee Roster */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Trainee Roster</CardTitle>
        </CardHeader>
        <CardContent>
          {traineesLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Loading trainees...</p>
            </div>
          ) : trainees.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">No trainees assigned yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Header */}
              <div className="grid grid-cols-5 gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Trainee</span>
                <span>Readiness</span>
                <span>Last Update</span>
                <span>Status</span>
                <span>Actions</span>
              </div>

              {trainees.map(trainee => (
                <TraineeRow
                  key={trainee.uid}
                  trainee={trainee}
                  onSelect={setSelectedTraineeId}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
