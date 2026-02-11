import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import MacroRing from './MacroRing'
import WeeklyReadinessChart from './WeeklyReadinessChart'
import type { NavSection } from './Sidebar'
import { useAuth } from '@/hooks/useAuth'
import { useTodaysArc } from '@/hooks/useTodaysArc'
import { useWeeklyReadiness, useReadinessStreak } from '@/hooks/useWeeklyReadiness'
import { calculateReadinessFactor, calculateDynamicMacros } from '@repo/shared/logic'

interface DashboardOverviewProps {
  onNavigate: (section: NavSection) => void
}

export default function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  const { user } = useAuth()
  const { data: todaysArc, isLoading } = useTodaysArc(user?.uid || null)
  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklyReadiness(user?.uid || null)
  const { streak, isLoading: streakLoading } = useReadinessStreak(user?.uid || null)

  // Real-time data from Firestore or defaults
  const readinessScore = todaysArc?.readinessScore ?? 0
  const recommendation = todaysArc?.recommendation ?? 'REST'

  // Calculate adjusted macros based on readiness
  const baseMacros = { protein: 180, carbs: 250, fat: 70 }
  const readinessFactor = readinessScore > 0 ? calculateReadinessFactor(readinessScore) : 1.0
  const adjustedMacros = calculateDynamicMacros(baseMacros, readinessFactor)
  const totalCalories = Math.round(adjustedMacros.protein * 4 + adjustedMacros.carbs * 4 + adjustedMacros.fat * 9)

  // Get recommendation details
  const getRecommendationText = (rec: string) => {
    switch (rec) {
      case 'INTENSE':
        return 'High Intensity'
      case 'MODERATE':
        return 'Standard Session'
      case 'LIGHT':
        return 'Light Session'
      case 'REST':
        return 'Rest/Recovery'
      default:
        return 'No Data'
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Readiness Score"
          value={todaysArc ? readinessScore.toFixed(1) : '--'}
          subtext={todaysArc ? '/ 10' : 'Not submitted'}
          accent="hsl(var(--chart-carbs))"
          onClick={() => onNavigate('readiness')}
        />
        <StatCard
          label="Today's Protocol"
          value={todaysArc ? recommendation : '--'}
          subtext={todaysArc ? getRecommendationText(recommendation) : 'Submit readiness'}
          accent="hsl(var(--chart-protein))"
          onClick={() => onNavigate('training')}
        />
        <StatCard
          label="Calorie Target"
          value={todaysArc ? totalCalories.toLocaleString() : '--'}
          subtext={todaysArc ? 'kcal adjusted' : 'No target yet'}
          accent="hsl(var(--chart-fat))"
          onClick={() => onNavigate('nutrition')}
        />
        <StatCard
          label="Streak"
          value={streakLoading ? '...' : String(streak)}
          subtext="consecutive days"
          accent="hsl(var(--primary))"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Macro Overview */}
        <Card className="border-border bg-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-foreground">Macro Targets</CardTitle>
          </CardHeader>
          <CardContent>
            {todaysArc ? (
              <>
                <p className="mb-4 text-center text-xs text-muted-foreground">
                  Adjusted by readiness factor:{' '}
                  <span className="font-mono font-bold text-primary">{readinessFactor.toFixed(2)}x</span>
                </p>
                <div className="flex flex-col items-center gap-6">
                  <MacroRing
                    label="Protein"
                    current={0}
                    target={adjustedMacros.protein}
                    unit="g"
                    color="hsl(var(--chart-protein))"
                    size={100}
                  />
                  <MacroRing
                    label="Carbs"
                    current={0}
                    target={adjustedMacros.carbs}
                    unit="g"
                    color="hsl(var(--chart-carbs))"
                    size={100}
                  />
                  <MacroRing
                    label="Fat"
                    current={0}
                    target={adjustedMacros.fat}
                    unit="g"
                    color="hsl(var(--chart-fat))"
                    size={100}
                  />
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center py-8">
                <p className="text-center text-sm text-muted-foreground">
                  Submit your readiness check to see adjusted macro targets
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {todaysArc ? (
                <ActivityItem
                  time={new Date(todaysArc.createdAt?.seconds * 1000 || Date.now()).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  label="Readiness check completed"
                  detail={`Score: ${readinessScore.toFixed(1)} - ${getRecommendationText(recommendation)}`}
                  color="hsl(var(--chart-carbs))"
                />
              ) : (
                <ActivityItem
                  time="--:--"
                  label="No readiness check today"
                  detail="Submit your daily readiness to get started"
                  color="hsl(var(--muted))"
                />
              )}
              <ActivityItem
                time="09:15"
                label="Training session (Coming Soon)"
                detail="Workout logging will be available in Phase 3"
                color="hsl(var(--chart-protein) / 0.5)"
              />
              <ActivityItem
                time="10:00"
                label="Nutrition logging (Coming Soon)"
                detail="Meal tracking will be available in Phase 4"
                color="hsl(var(--chart-fat) / 0.5)"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Readiness Trend */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Weekly Readiness Trend</CardTitle>
          <p className="text-xs text-muted-foreground">
            Last 7 days • Baseline at 100% • Peak performance above 100%
          </p>
        </CardHeader>
        <CardContent>
          <WeeklyReadinessChart data={weeklyData} isLoading={weeklyLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  label,
  value,
  subtext,
  accent,
  onClick,
}: {
  label: string
  value: string
  subtext: string
  accent: string
  onClick?: () => void
}) {
  return (
    <Card
      className={`border-border bg-card ${onClick ? 'cursor-pointer transition-all hover:border-[hsl(var(--primary)/0.3)]' : ''}`}
      onClick={onClick}
    >
      <CardContent className="flex flex-col gap-1 p-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-foreground">{value}</span>
          <span className="text-sm text-muted-foreground">{subtext}</span>
        </div>
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full" style={{ width: '70%', backgroundColor: accent }} />
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityItem({
  time,
  label,
  detail,
  color,
}: {
  time: string
  label: string
  detail: string
  color: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-secondary/50 px-4 py-3">
      <div className="mt-0.5 flex h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{label}</span>
          <span className="font-mono text-xs text-muted-foreground">{time}</span>
        </div>
        <span className="text-xs text-muted-foreground">{detail}</span>
      </div>
    </div>
  )
}
