/**
 * Command Center Dashboard - Gaming/Bio-Hacking Aesthetic
 * Deep layers, glassmorphism, and data-dense visualization
 */

import { Card, CardContent } from '@repo/ui'
import ReadinessCircle from './ReadinessCircle'
import SunburstMacros from './SunburstMacros'
import HumanSilhouette from './HumanSilhouette'
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
  const soreness = todaysArc?.soreness || []

  // Calculate adjusted macros based on readiness
  const baseMacros = { protein: 180, carbs: 250, fat: 70 }
  const readinessFactor = readinessScore > 0 ? calculateReadinessFactor(readinessScore) : 1.0
  const adjustedMacros = calculateDynamicMacros(baseMacros, readinessFactor)

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Initializing command center...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Hero Grid - Readiness + Macros */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Large Readiness Circle */}
        <Card className="glass-card flex items-center justify-center p-8" onClick={() => onNavigate('readiness')}>
          <ReadinessCircle score={readinessScore} recommendation={recommendation} size={300} />
        </Card>

        {/* Right: Sunburst Macro Rings */}
        <Card className="glass-card flex items-center justify-center p-8" onClick={() => onNavigate('nutrition')}>
          <SunburstMacros
            protein={{ current: 0, target: adjustedMacros.protein }}
            carbs={{ current: 0, target: adjustedMacros.carbs }}
            fat={{ current: 0, target: adjustedMacros.fat }}
            size={320}
          />
        </Card>
      </div>

      {/* Secondary Grid - Recovery Map + Micro Stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recovery Map - Human Silhouette */}
        <Card className="glass-card flex items-center justify-center p-6">
          <HumanSilhouette soreness={soreness} size={240} />
        </Card>

        {/* Micro Stats - 2 columns */}
        <div className="grid gap-6 lg:col-span-2 lg:grid-cols-3">
          <MicroStatCard
            icon={
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            }
            label="Sleep Score"
            value={todaysArc?.sleepHours ? `${todaysArc.sleepHours.toFixed(1)}h` : '--'}
            subtext={todaysArc?.sleepHours ? 'Good recovery' : 'No data'}
            color="hsl(var(--primary))"
          />

          <MicroStatCard
            icon={
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            }
            label="Avg HR"
            value="--"
            subtext="Phase 4"
            color="hsl(var(--chart-warning))"
          />

          <MicroStatCard
            icon={
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            }
            label="Body Battery"
            value={streakLoading ? '...' : `${streak}d`}
            subtext="Streak"
            color="hsl(var(--accent))"
          />
        </div>
      </div>

      {/* Weekly Trend - Full Width */}
      <Card className="glass-card">
        <div className="p-6 pb-3">
          <h3 className="text-lg font-black tracking-tight text-foreground">Weekly Readiness Trend</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Last 7 days • Baseline at 100% • Peak performance above 100%
          </p>
        </div>
        <CardContent className="pb-6">
          <WeeklyReadinessChart data={weeklyData} isLoading={weeklyLoading} />
        </CardContent>
      </Card>

      {/* Quick Actions - Phase indicators */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ActionCard
          label="Training Log"
          status="Available"
          color="hsl(var(--accent))"
          onClick={() => onNavigate('training')}
        />
        <ActionCard
          label="Meal Planner"
          status="Phase 4"
          color="hsl(var(--muted-foreground))"
        />
        <ActionCard
          label="Form Check"
          status="Phase 3"
          color="hsl(var(--muted-foreground))"
        />
        <ActionCard
          label="Coach Portal"
          status="Phase 5"
          color="hsl(var(--muted-foreground))"
        />
      </div>
    </div>
  )
}

function MicroStatCard({
  icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  subtext: string
  color: string
}) {
  return (
    <Card className="glass-card group cursor-pointer transition-all hover:shadow-glow-blue">
      <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
        <div className="rounded-lg bg-secondary/50 p-3 transition-all group-hover:bg-secondary" style={{ color }}>
          {icon}
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

function ActionCard({
  label,
  status,
  color,
  onClick,
}: {
  label: string
  status: string
  color: string
  onClick?: () => void
}) {
  const isAvailable = status === 'Available'

  return (
    <Card
      className={`glass-card transition-all ${
        isAvailable
          ? 'cursor-pointer hover:shadow-glow-green'
          : 'opacity-60 grayscale'
      }`}
      onClick={isAvailable ? onClick : undefined}
    >
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground">{status}</span>
        </div>
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      </CardContent>
    </Card>
  )
}
