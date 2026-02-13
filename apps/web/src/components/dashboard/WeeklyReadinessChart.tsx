import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface WeeklyReadinessChartProps {
  data: Array<{
    date: string
    score: number
    dayLabel: string
  }>
  isLoading?: boolean
}

export default function WeeklyReadinessChart({ data, isLoading }: WeeklyReadinessChartProps) {
  // Normalize scores to percentage (0-10 scale -> 0-100% scale, then * 1.5 for 0-150% range)
  const normalizedData = data.map(item => ({
    ...item,
    score: item.score * 10, // Convert 0-10 to 0-100%
    displayScore: item.score.toFixed(1),
  }))

  // Check if we have any data
  const hasData = data.some(item => item.score > 0)

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
          <p className="text-xs font-semibold text-foreground">{data.dayLabel}</p>
          <p className="font-mono text-sm font-bold text-primary">{data.displayScore}/10</p>
          <p className="text-xs text-muted-foreground">{Math.round(data.score)}% Readiness</p>
        </div>
      )
    }
    return null
  }

  // Custom dot that glows when above 100%
  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props
    const isAbove100 = payload.score >= 100

    return (
      <g>
        {isAbove100 && <circle cx={cx} cy={cy} r={8} fill="hsl(var(--primary))" opacity={0.2} />}
        <circle
          cx={cx}
          cy={cy}
          r={4}
          fill={isAbove100 ? 'hsl(var(--primary))' : 'hsl(var(--chart-carbs))'}
          stroke="hsl(var(--background))"
          strokeWidth={2}
        />
      </g>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading chart...</p>
        </div>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-sm font-medium text-muted-foreground">No readiness data yet</p>
          <p className="text-xs text-muted-foreground">
            Submit your daily readiness checks to see your weekly trend
          </p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={normalizedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-carbs))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--chart-carbs))" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Grid */}
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          opacity={0.3}
          vertical={false}
        />

        {/* X Axis - Days of week */}
        <XAxis
          dataKey="dayLabel"
          stroke="hsl(var(--muted-foreground))"
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />

        {/* Y Axis - Percentage 0-150% */}
        <YAxis
          domain={[0, 150]}
          stroke="hsl(var(--muted-foreground))"
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={value => `${value}%`}
          ticks={[0, 50, 100, 150]}
        />

        {/* Tooltip */}
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--border))' }} />

        {/* Reference line at 100% */}
        <ReferenceLine
          y={100}
          stroke="hsl(var(--primary))"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          opacity={0.5}
          label={{
            value: '100% Baseline',
            position: 'right',
            fill: 'hsl(var(--muted-foreground))',
            fontSize: 10,
          }}
        />

        {/* Area */}
        <Area
          type="monotone"
          dataKey="score"
          stroke="hsl(var(--chart-carbs))"
          strokeWidth={2.5}
          fill="url(#colorScore)"
          dot={<CustomDot />}
          activeDot={{
            r: 6,
            stroke: 'hsl(var(--background))',
            strokeWidth: 2,
            fill: 'hsl(var(--chart-carbs))',
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
