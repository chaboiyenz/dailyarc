import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import MacroRing from './MacroRing'
import type { NavSection } from './Sidebar'

interface DashboardOverviewProps {
  onNavigate: (section: NavSection) => void
}

export default function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  // Demo data for the overview
  const readinessScore = 7.2
  const recommendation = 'MODERATE'
  const streak = 12

  return (
    <div className="flex flex-col gap-6">
      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Readiness Score"
          value={readinessScore.toFixed(1)}
          subtext="/ 10"
          accent="hsl(var(--chart-carbs))"
          onClick={() => onNavigate('readiness')}
        />
        <StatCard
          label="Today's Protocol"
          value={recommendation}
          subtext="Standard Session"
          accent="hsl(var(--chart-protein))"
          onClick={() => onNavigate('training')}
        />
        <StatCard
          label="Calorie Target"
          value="2,340"
          subtext="kcal adjusted"
          accent="hsl(var(--chart-fat))"
          onClick={() => onNavigate('nutrition')}
        />
        <StatCard
          label="Streak"
          value={String(streak)}
          subtext="consecutive days"
          accent="hsl(var(--primary))"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Macro Overview */}
        <Card className="border-border bg-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-foreground">Macro Intake</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-6">
              <MacroRing
                label="Protein"
                current={108}
                target={180}
                unit="g"
                color="hsl(var(--chart-protein))"
                size={100}
              />
              <MacroRing
                label="Carbs"
                current={100}
                target={250}
                unit="g"
                color="hsl(var(--chart-carbs))"
                size={100}
              />
              <MacroRing
                label="Fat"
                current={49}
                target={70}
                unit="g"
                color="hsl(var(--chart-fat))"
                size={100}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <ActivityItem
                time="08:30"
                label="Readiness check completed"
                detail="Score: 7.2 - Moderate intensity recommended"
                color="hsl(var(--chart-carbs))"
              />
              <ActivityItem
                time="09:15"
                label="Push training session"
                detail="Diamond Pushups: 4x12 @ RPE 7"
                color="hsl(var(--chart-protein))"
              />
              <ActivityItem
                time="10:00"
                label="Breakfast logged"
                detail="Greek yogurt bowl - 42g protein, 38g carbs"
                color="hsl(var(--chart-fat))"
              />
              <ActivityItem
                time="12:30"
                label="Lunch logged"
                detail="Chicken & rice bowl - 48g protein, 62g carbs"
                color="hsl(var(--chart-fat))"
              />
              <ActivityItem
                time="14:00"
                label="Coach message"
                detail="Great form on the pushups. Increase to 5 sets next session."
                color="hsl(var(--primary))"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Readiness Trend */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Weekly Readiness Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            {[6.1, 7.5, 5.8, 8.2, 7.0, 6.9, 7.2].map((score, i) => {
              const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
              const height = (score / 10) * 160
              const isToday = i === 6
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <span className="font-mono text-xs font-bold text-foreground">{score}</span>
                  <div
                    className="w-full rounded-lg transition-all"
                    style={{
                      height: `${height}px`,
                      backgroundColor: isToday
                        ? 'hsl(var(--primary))'
                        : score >= 7
                          ? 'hsl(var(--chart-carbs) / 0.5)'
                          : score >= 5
                            ? 'hsl(var(--chart-fat) / 0.5)'
                            : 'hsl(var(--chart-warning) / 0.5)',
                    }}
                  />
                  <span className={`text-xs font-medium ${isToday ? 'text-[hsl(var(--primary))]' : 'text-muted-foreground'}`}>
                    {days[i]}
                  </span>
                </div>
              )
            })}
          </div>
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
