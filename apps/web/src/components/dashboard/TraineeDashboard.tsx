import { Card, CardContent, Skeleton } from '@repo/ui'
import ReadinessCircle from './ReadinessCircle'
import SunburstMacros from './SunburstMacros'
import HumanSilhouette from './HumanSilhouette'
import WeeklyReadinessChart from './WeeklyReadinessChart'
import { useAuth } from '@/hooks/useAuth'
import { useTodaysArc } from '@/hooks/useTodaysArc'
import { useWeeklyReadiness, useReadinessStreak } from '@/hooks/useWeeklyReadiness'
import { calculateReadinessFactor, calculateDynamicMacros } from '@repo/shared'
import { NavSection } from './Sidebar'

interface TraineeDashboardProps {
  onNavigate: (section: NavSection) => void
}

export default function TraineeDashboard({ onNavigate }: TraineeDashboardProps) {
  const { user } = useAuth()
  const { data: todaysArc, isLoading } = useTodaysArc(user?.uid || null)
  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklyReadiness(user?.uid || null)
  const { streak, isLoading: streakLoading } = useReadinessStreak(user?.uid || null)

  // Real-time data from Firestore or defaults
  const readinessScore = todaysArc?.readinessScore ?? 0
  const recommendation = todaysArc?.recommendation ?? 'REST'
  const soreness = todaysArc?.soreness || []

  // Calculate adjusted macros based on readiness
  const baseMacros = { protein: 180, carbs: 250, fat: 70 }
  const readinessFactor = readinessScore > 0 ? calculateReadinessFactor(readinessScore) : 1.0
  const adjustedMacros = calculateDynamicMacros(baseMacros, readinessFactor)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="col-span-3 h-[300px] rounded-xl" />
          <Skeleton className="col-span-4 h-[300px] rounded-xl" />
        </div>
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Grid - Readiness + Macros */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Large Readiness Circle */}
        <Card
          className="glass-card flex items-center justify-center p-8 transition-transform hover:scale-[1.01]"
          onClick={() => onNavigate('readiness')}
        >
          <ReadinessCircle score={readinessScore} recommendation={recommendation} size={300} />
        </Card>

        {/* Right: Sunburst Macro Rings */}
        <Card
          className="glass-card flex items-center justify-center p-8 transition-transform hover:scale-[1.01]"
          onClick={() => onNavigate('nutrition')}
        >
          <SunburstMacros
            protein={{ current: 0, target: adjustedMacros.protein }}
            carbs={{ current: 0, target: adjustedMacros.carbs }}
            fat={{ current: 0, target: adjustedMacros.fat }}
            size={320}
          />
        </Card>
      </div>

      {/* Secondary Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recovery Map */}
        <Card className="glass-card flex items-center justify-center p-6">
          <HumanSilhouette soreness={soreness} size={240} />
        </Card>

        {/* Micro Stats */}
        <div className="grid gap-6 lg:col-span-2 lg:grid-cols-3">
          <MicroStatCard
            label="Sleep Score"
            value={todaysArc?.sleepHours ? `${todaysArc.sleepHours.toFixed(1)}h` : '--'}
            subtext="Good recovery"
            color="hsl(var(--primary))"
          />
          <MicroStatCard
            label="Avg HR"
            value="--"
            subtext="Phase 4"
            color="hsl(var(--chart-warning))"
          />
          <MicroStatCard
            label="Body Battery"
            value={streakLoading ? '...' : `${streak}d`}
            subtext="Streak"
            color="hsl(var(--accent))"
          />
        </div>
      </div>

      {/* Weekly Trend */}
      <Card className="glass-card">
        <div className="p-6 pb-3">
          <h3 className="text-lg font-black tracking-tight text-foreground">
            Weekly Readiness Trend
          </h3>
        </div>
        <CardContent className="pb-6">
          <WeeklyReadinessChart data={weeklyData} isLoading={weeklyLoading} />
        </CardContent>
      </Card>
    </div>
  )
}

function MicroStatCard({
  label,
  value,
  subtext,
  color,
}: {
  label: string
  value: string
  subtext: string
  color: string
}) {
  return (
    <Card className="glass-card group cursor-pointer transition-all hover:shadow-glow-blue">
      <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
        <div
          className="rounded-lg bg-secondary/50 p-3 transition-all group-hover:bg-secondary"
          style={{ color }}
        >
          <div className="h-6 w-6 rounded-full bg-current opacity-20" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <span className="text-2xl font-black text-foreground">{value}</span>
          <span className="text-xs text-muted-foreground">{subtext}</span>
        </div>
      </CardContent>
    </Card>
  )
}
