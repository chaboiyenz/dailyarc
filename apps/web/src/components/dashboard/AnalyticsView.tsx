import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'

const WEEKLY_DATA = [
  { day: 'Mon', readiness: 6.1, volume: 85, sleep: 6, calories: 2100 },
  { day: 'Tue', readiness: 7.5, volume: 100, sleep: 7.5, calories: 2340 },
  { day: 'Wed', readiness: 5.8, volume: 60, sleep: 5, calories: 1900 },
  { day: 'Thu', readiness: 8.2, volume: 120, sleep: 8, calories: 2500 },
  { day: 'Fri', readiness: 7.0, volume: 95, sleep: 7, calories: 2200 },
  { day: 'Sat', readiness: 6.9, volume: 90, sleep: 7, calories: 2300 },
  { day: 'Sun', readiness: 7.2, volume: 0, sleep: 8, calories: 2100 },
]

export default function AnalyticsView() {
  const avgReadiness = (WEEKLY_DATA.reduce((a, d) => a + d.readiness, 0) / WEEKLY_DATA.length).toFixed(1)
  const totalVolume = WEEKLY_DATA.reduce((a, d) => a + d.volume, 0)
  const avgSleep = (WEEKLY_DATA.reduce((a, d) => a + d.sleep, 0) / WEEKLY_DATA.length).toFixed(1)
  const avgCalories = Math.round(WEEKLY_DATA.reduce((a, d) => a + d.calories, 0) / WEEKLY_DATA.length)

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <AnalyticStat label="Avg Readiness" value={avgReadiness} unit="/ 10" color="hsl(var(--chart-carbs))" />
        <AnalyticStat label="Total Volume" value={String(totalVolume)} unit="reps" color="hsl(var(--chart-protein))" />
        <AnalyticStat label="Avg Sleep" value={avgSleep} unit="hours" color="hsl(var(--primary))" />
        <AnalyticStat label="Avg Calories" value={avgCalories.toLocaleString()} unit="kcal" color="hsl(var(--chart-fat))" />
      </div>

      {/* Performance Correlation */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Performance Correlation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-sm text-muted-foreground">
            Comparing sleep quality against training readiness and volume output this week.
          </p>

          {/* Correlation Chart */}
          <div className="flex flex-col gap-4">
            {/* Legend */}
            <div className="flex gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[hsl(var(--primary))]" />
                <span className="text-muted-foreground">Sleep (hours)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[hsl(var(--chart-carbs))]" />
                <span className="text-muted-foreground">Readiness (score)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-[hsl(var(--chart-protein))]" />
                <span className="text-muted-foreground">Volume (reps)</span>
              </div>
            </div>

            {/* Bars */}
            <div className="flex items-end gap-3">
              {WEEKLY_DATA.map((d, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full gap-1" style={{ height: '180px', alignItems: 'flex-end' }}>
                    {/* Sleep */}
                    <div
                      className="flex-1 rounded-t-md bg-[hsl(var(--primary)/0.6)]"
                      style={{ height: `${(d.sleep / 10) * 100}%` }}
                      title={`Sleep: ${d.sleep}h`}
                    />
                    {/* Readiness */}
                    <div
                      className="flex-1 rounded-t-md bg-[hsl(var(--chart-carbs)/0.6)]"
                      style={{ height: `${(d.readiness / 10) * 100}%` }}
                      title={`Readiness: ${d.readiness}`}
                    />
                    {/* Volume */}
                    <div
                      className="flex-1 rounded-t-md bg-[hsl(var(--chart-protein)/0.6)]"
                      style={{ height: `${(d.volume / 120) * 100}%` }}
                      title={`Volume: ${d.volume} reps`}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Weekly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3">Day</th>
                  <th className="px-4 py-3">Sleep</th>
                  <th className="px-4 py-3">Readiness</th>
                  <th className="px-4 py-3">Volume</th>
                  <th className="px-4 py-3">Calories</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {WEEKLY_DATA.map((d, i) => (
                  <tr key={i} className="border-b border-border/50 transition-colors hover:bg-secondary/30">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{d.day}</td>
                    <td className="px-4 py-3 font-mono text-sm text-foreground">{d.sleep}h</td>
                    <td className="px-4 py-3">
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
                        <span className="font-mono text-sm text-foreground">{d.readiness}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-foreground">{d.volume} reps</td>
                    <td className="px-4 py-3 font-mono text-sm text-foreground">{d.calories.toLocaleString()}</td>
                    <td className="px-4 py-3">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-foreground">{value}</span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full" style={{ width: '65%', backgroundColor: color }} />
        </div>
      </CardContent>
    </Card>
  )
}
