import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { useAuth } from '@/hooks/useAuth'
import { useAnalyticsData } from '@/hooks/useAnalyticsData'
import AnalyticsChart from './AnalyticsChart'

export default function AnalyticsView() {
  const { user } = useAuth()
  const { data, summary, isLoading } = useAnalyticsData(user?.uid || null)

  const avgReadiness = isNaN(summary.avgReadiness) ? '--' : summary.avgReadiness.toFixed(1)
  const totalVolume = summary.totalVolume
  const avgSleep = isNaN(summary.avgSleep) ? '--' : summary.avgSleep.toFixed(1)
  const avgCalories = isNaN(summary.avgCalories) ? '--' : Math.round(summary.avgCalories)

  // Check if we have any data
  const hasData = data.some(d => d.readiness > 0 || d.sleep > 0)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <AnalyticStat
          label="Avg Readiness"
          value={avgReadiness}
          unit={avgReadiness === '--' ? 'No data' : '/ 10'}
          color="hsl(var(--chart-carbs))"
        />
        <AnalyticStat
          label="Total Volume"
          value={hasData && totalVolume > 0 ? String(totalVolume) : '--'}
          unit={hasData && totalVolume > 0 ? 'reps' : 'Log Data to Unlock'}
          color="hsl(var(--chart-protein))"
        />
        <AnalyticStat
          label="Avg Sleep"
          value={avgSleep}
          unit={avgSleep === '--' ? 'No data' : 'hours'}
          color="hsl(var(--primary))"
        />
        <AnalyticStat
          label="Avg Calories"
          value={
            avgCalories === '--'
              ? '--'
              : typeof avgCalories === 'number' && avgCalories > 0
                ? avgCalories.toLocaleString()
                : '--'
          }
          unit={avgCalories === '--' || avgCalories === 0 ? 'Log Data to Unlock' : 'kcal'}
          color="hsl(var(--chart-fat))"
        />
      </div>

      {/* Performance Correlation Chart */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Performance Correlation</CardTitle>
          <p className="text-xs text-muted-foreground">
            Last 7 days • Sleep quality vs Readiness score vs Training volume
          </p>
        </CardHeader>
        <CardContent>
          <AnalyticsChart
            data={data.map(d => ({
              dayLabel: d.dayLabel,
              readiness: d.readiness,
              sleep: d.sleep,
              volume: d.volume,
            }))}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Weekly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <svg
                className="h-12 w-12 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <div>
                <p className="text-sm font-semibold text-foreground">No data to display</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Start your first Arc by submitting a daily readiness check
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3">Day</th>
                    <th className="px-4 py-3">Sleep</th>
                    <th className="px-4 py-3">Readiness</th>
                    <th className="px-4 py-3">Volume</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d, i) => {
                    const hasDataForDay = d.readiness > 0 || d.sleep > 0
                    return (
                      <tr
                        key={i}
                        className="border-b border-border/50 transition-colors hover:bg-secondary/30"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-foreground">
                          {d.dayLabel}
                        </td>
                        <td className="px-4 py-3">
                          {hasDataForDay ? (
                            <span className="font-mono text-sm text-foreground">
                              {d.sleep.toFixed(1)}h
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {hasDataForDay ? (
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-12 overflow-hidden rounded-full bg-secondary">
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${(d.readiness / 10) * 100}%`,
                                    backgroundColor:
                                      d.readiness >= 7
                                        ? 'hsl(var(--chart-carbs))'
                                        : d.readiness >= 5
                                          ? 'hsl(var(--chart-fat))'
                                          : 'hsl(var(--chart-warning))',
                                  }}
                                />
                              </div>
                              <span className="font-mono text-sm text-foreground">
                                {d.readiness.toFixed(1)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {d.volume > 0 ? (
                            <span className="font-mono text-sm text-foreground">
                              {d.volume} reps
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">--</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {hasDataForDay ? (
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                d.readiness >= 7
                                  ? 'bg-[hsl(var(--chart-carbs)/0.1)] text-[hsl(var(--chart-carbs))]'
                                  : d.readiness >= 5
                                    ? 'bg-[hsl(var(--chart-fat)/0.1)] text-[hsl(var(--chart-fat))]'
                                    : 'bg-[hsl(var(--chart-warning)/0.1)] text-[hsl(var(--chart-warning))]'
                              }`}
                            >
                              {d.readiness >= 7 ? 'OPTIMAL' : d.readiness >= 5 ? 'MODERATE' : 'LOW'}
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                              NO DATA
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function AnalyticStat({
  label,
  value,
  unit,
  color,
}: {
  label: string
  value: string
  unit: string
  color: string
}) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-foreground">{value}</span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: value === '--' ? '0%' : '65%', backgroundColor: color }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
