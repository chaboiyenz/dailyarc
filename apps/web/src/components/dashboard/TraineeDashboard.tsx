import { Card, CardContent, Skeleton } from '@repo/ui'
import ReadinessCircle from './ReadinessCircle'
import SunburstMacros from './SunburstMacros'
import HumanSilhouette from './HumanSilhouette'
import WeeklyReadinessChart from './WeeklyReadinessChart'
import { useAuth } from '@/hooks/useAuth'
import { useTodaysArc } from '@/hooks/useTodaysArc'
import { useWeeklyReadiness, useReadinessStreak } from '@/hooks/useWeeklyReadiness'
import { useRecentWorkouts } from '@/hooks/useLogWorkout'
import { useTodaysMealLogs } from '@/hooks/useMealLogs'
import { calculateAdjustedMacros } from '@repo/shared'
import type { NavSection } from './Sidebar'

interface TraineeDashboardProps {
  onNavigate: (section: NavSection) => void
}

export default function TraineeDashboard({ onNavigate }: TraineeDashboardProps) {
  const { user } = useAuth()
  const { data: todaysArc, isLoading } = useTodaysArc(user?.uid || null)
  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklyReadiness(user?.uid || null)
  const { streak, isLoading: streakLoading } = useReadinessStreak(user?.uid || null)
  const { data: recentWorkouts } = useRecentWorkouts(user?.uid || null)
  const { consumed } = useTodaysMealLogs(user?.uid || null)

  // Real-time data from Firestore or defaults
  const readinessAverage = todaysArc?.readinessAverage ?? 0
  const readinessScore = readinessAverage * 2
  const recommendation = todaysArc?.recommendation ?? 'REST'
  const soreness = todaysArc?.sorenessZones ?? []

  // Protein static, Carbs/Fats scaled by RF via calculateAdjustedMacros
  const baseMacros = { calories: 2500, protein: 180, carbs: 250, fat: 70 }
  const readinessFactor = todaysArc?.readinessFactor ?? 1.0
  const adjustedMacros = calculateAdjustedMacros(baseMacros, readinessFactor)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[350px] w-full rounded-xl" />
          <Skeleton className="h-[350px] w-full rounded-xl" />
        </div>
        <Skeleton className="h-[300px] w-full rounded-xl" />
        <Skeleton className="h-[280px] w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Row 1: Readiness Arc + Adaptive Macros */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card
          className="border-border bg-card min-h-[350px] flex items-center justify-center cursor-pointer p-6"
          onClick={() => onNavigate('readiness')}
        >
          <ReadinessCircle score={readinessScore} recommendation={recommendation} size={280} />
        </Card>

        <Card
          className="border-border bg-card min-h-[350px] flex items-center justify-center cursor-pointer overflow-hidden !p-0"
          onClick={() => onNavigate('nutrition')}
        >
          <SunburstMacros
            protein={{ current: consumed.protein, target: adjustedMacros.protein }}
            carbs={{ current: consumed.carbs, target: adjustedMacros.carbs }}
            fat={{ current: consumed.fat, target: adjustedMacros.fat }}
            size={150}
          />
        </Card>
      </div>

      {/* Row 2: Muscle Fatigue Heatmap + Bio-Metrics */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border bg-card min-h-[300px] flex items-center justify-center p-6">
          <HumanSilhouette soreness={soreness} recentWorkouts={recentWorkouts || []} size={240} />
        </Card>

        <div className="lg:col-span-2 grid gap-6 sm:grid-cols-3">
          <Card className="border-border bg-card min-h-[300px] flex items-center justify-center">
            <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sleep Score
              </span>
              <span className="text-4xl font-black text-foreground">
                {todaysArc ? `${todaysArc.readinessInput.sleep}/5` : '--'}
              </span>
              <span className="text-xs text-muted-foreground">
                {todaysArc ? 'From readiness check' : 'No data'}
              </span>
            </CardContent>
          </Card>

          <Card className="border-border bg-card min-h-[300px] flex items-center justify-center">
            <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Avg HR
              </span>
              <span className="text-4xl font-black text-foreground">
                {todaysArc?.bioMetrics?.avgHR
                  ? `${Math.round(todaysArc.bioMetrics.avgHR)} BPM`
                  : '-- BPM'}
              </span>
              <span className="text-xs text-muted-foreground">
                {todaysArc?.bioMetrics?.avgHRSource === 'wearable'
                  ? 'Via wearable'
                  : todaysArc?.bioMetrics?.avgHRSource === 'manual'
                    ? 'Manual entry'
                    : 'No data'}
              </span>
            </CardContent>
          </Card>

          <Card className="border-border bg-card min-h-[300px] flex items-center justify-center">
            <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                System Energy
              </span>
              {todaysArc ? (
                <>
                  <span className="text-4xl font-black text-foreground">
                    {Math.round((todaysArc.readinessInput.energy / 5) * 100)}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {(todaysArc.readinessInput.energy / 5) * 100 >= 80
                      ? 'Optimal Intensity'
                      : (todaysArc.readinessInput.energy / 5) * 100 >= 50
                        ? 'Controlled Volume'
                        : 'Active Recovery'}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-4xl font-black text-foreground">--</span>
                  <span className="text-xs text-muted-foreground">No data</span>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Row 3: Weekly Trend */}
      <Card className="border-border bg-card">
        <div className="p-6 pb-3">
          <h3 className="text-lg font-black tracking-tight text-foreground">
            Weekly Readiness Trend
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">Last 7 days — Baseline at 100%</p>
        </div>
        <CardContent className="pb-6 h-[250px]">
          <WeeklyReadinessChart data={weeklyData} isLoading={weeklyLoading} />
        </CardContent>
      </Card>
    </div>
  )
}
