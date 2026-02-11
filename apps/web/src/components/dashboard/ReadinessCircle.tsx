/**
 * Large Readiness Circle - Command Center Hero Component
 * Displays current readiness score with glowing effect
 */

interface ReadinessCircleProps {
  score: number
  recommendation: string
  size?: number
}

export default function ReadinessCircle({ score, recommendation, size = 280 }: ReadinessCircleProps) {
  const radius = (size - 40) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 10) * 100
  const strokeDashoffset = circumference - (progress / 100) * circumference

  // Color based on score
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'hsl(var(--accent))' // Emerald green
    if (score >= 6) return 'hsl(var(--primary))' // Electric blue
    if (score >= 4) return 'hsl(var(--chart-fat))' // Orange
    return 'hsl(var(--chart-warning))' // Red
  }

  // Glow intensity based on score
  const getGlowClass = (score: number) => {
    if (score >= 8) return 'glow-success'
    if (score >= 6) return 'glow-active'
    return ''
  }

  const color = getScoreColor(score)
  const glowClass = getGlowClass(score)

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Main Circle */}
      <div className={`relative ${glowClass} rounded-full p-4 transition-all duration-500`}>
        <svg width={size} height={size} className="drop-shadow-2xl">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="hsl(var(--secondary))"
            strokeWidth="12"
          />

          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="ring-animate"
            style={{
              filter: `drop-shadow(0 0 8px ${color}80)`,
            }}
          />

          {/* Center content */}
          <text
            x={size / 2}
            y={size / 2 - 20}
            textAnchor="middle"
            className="fill-foreground text-7xl font-black"
          >
            {score.toFixed(1)}
          </text>
          <text
            x={size / 2}
            y={size / 2 + 15}
            textAnchor="middle"
            className="fill-muted-foreground text-sm font-medium uppercase tracking-widest"
          >
            / 10
          </text>
        </svg>

        {/* Pulse animation overlay for high scores */}
        {score >= 8 && (
          <div className="absolute inset-0 rounded-full bg-emerald-500/5 animate-pulse-glow" />
        )}
      </div>

      {/* Recommendation Badge */}
      <div className="glass-card flex flex-col items-center gap-2 px-6 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Today's Protocol
        </span>
        <span
          className="text-2xl font-black tracking-tight"
          style={{ color }}
        >
          {recommendation}
        </span>
      </div>

      {/* Score interpretation */}
      <div className="text-center text-xs text-muted-foreground">
        {score >= 8 && '🔥 Peak performance - Go all out'}
        {score >= 6 && score < 8 && '💪 Good to train - Standard intensity'}
        {score >= 4 && score < 6 && '⚠️ Moderate - Scale back volume'}
        {score < 4 && '🛑 Low readiness - Prioritize recovery'}
        {score === 0 && 'Submit your daily readiness check to get started'}
      </div>
    </div>
  )
}
