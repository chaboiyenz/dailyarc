import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface AnalyticsChartProps {
  data: Array<{
    dayLabel: string
    readiness: number
    sleep: number
    volume: number
  }>
  isLoading?: boolean
}

export default function AnalyticsChart({ data, isLoading }: AnalyticsChartProps) {
  // Transform data for display
  const chartData = data.map((item) => ({
    day: item.dayLabel,
    readiness: item.readiness * 10, // Convert 0-10 to 0-100%
    sleep: item.sleep * 10, // Convert 0-10 hours to 0-100% scale
    volume: item.volume, // Already a number
    readinessDisplay: item.readiness.toFixed(1),
    sleepDisplay: item.sleep.toFixed(1),
  }))

  // Check if we have any real data
  const hasData = data.some((item) => item.readiness > 0 || item.sleep > 0)

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-lg border border-border bg-card/95 px-4 py-3 shadow-xl backdrop-blur-sm">
          <p className="mb-2 text-xs font-bold text-foreground">{data.day}</p>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[hsl(var(--chart-carbs))]" />
              <span className="text-xs text-muted-foreground">Readiness:</span>
              <span className="font-mono text-sm font-bold text-foreground">
                {data.readinessDisplay}/10
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[hsl(var(--primary))]" />
              <span className="text-xs text-muted-foreground">Sleep:</span>
              <span className="font-mono text-sm font-bold text-foreground">
                {data.sleepDisplay}h
              </span>
            </div>
            {data.volume > 0 && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[hsl(var(--chart-protein))]" />
                <span className="text-xs text-muted-foreground">Volume:</span>
                <span className="font-mono text-sm font-bold text-foreground">
                  {data.volume} reps
                </span>
              </div>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  // Custom legend
  const CustomLegend = () => {
    return (
      <div className="flex justify-center gap-6 pb-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[hsl(var(--chart-carbs))]" />
          <span className="text-muted-foreground">Readiness Score</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[hsl(var(--primary))]" />
          <span className="text-muted-foreground">Sleep Quality</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-[hsl(var(--chart-protein))]" />
          <span className="text-muted-foreground">Training Volume</span>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="flex h-80 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <svg
            className="h-16 w-16 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <div>
            <p className="text-sm font-semibold text-foreground">No analytics data yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Submit daily readiness checks to start tracking your performance trends
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <CustomLegend />
      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {/* Gradients matching WeeklyReadinessChart style */}
            <linearGradient id="colorReadiness" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-carbs))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--chart-carbs))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--chart-protein))" stopOpacity={0.2} />
              <stop offset="95%" stopColor="hsl(var(--chart-protein))" stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* Grid */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.3}
            vertical={false}
          />

          {/* X Axis */}
          <XAxis
            dataKey="day"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />

          {/* Y Axis - 0-100% scale */}
          <YAxis
            domain={[0, 100]}
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value}%`}
            ticks={[0, 25, 50, 75, 100]}
          />

          {/* Tooltip */}
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--border))' }} />

          {/* Area Charts - Layered */}
          <Area
            type="monotone"
            dataKey="volume"
            stroke="hsl(var(--chart-protein))"
            strokeWidth={1.5}
            fill="url(#colorVolume)"
            fillOpacity={0.6}
          />

          <Area
            type="monotone"
            dataKey="sleep"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="url(#colorSleep)"
            dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'hsl(var(--background))' }}
            activeDot={{
              r: 5,
              stroke: 'hsl(var(--background))',
              strokeWidth: 2,
              fill: 'hsl(var(--primary))',
            }}
          />

          <Area
            type="monotone"
            dataKey="readiness"
            stroke="hsl(var(--chart-carbs))"
            strokeWidth={2.5}
            fill="url(#colorReadiness)"
            dot={{ r: 4, fill: 'hsl(var(--chart-carbs))', strokeWidth: 2, stroke: 'hsl(var(--background))' }}
            activeDot={{
              r: 6,
              stroke: 'hsl(var(--background))',
              strokeWidth: 2,
              fill: 'hsl(var(--chart-carbs))',
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
