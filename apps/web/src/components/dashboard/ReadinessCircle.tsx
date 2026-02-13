/**
 * Large Readiness Circle - Command Center Hero Component
 * Displays current readiness score with glowing effect
 */

interface ReadinessCircleProps {
  score: number
  recommendation: string
  size?: number
}

export default function ReadinessCircle({
  score,
  recommendation,
  size = 280,
}: ReadinessCircleProps) {
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
    <div className="flex flex-col items-center justify-center gap-2 w-full h-full px-2">
      {/* Main Circle */}
      <div className={`relative ${glowClass} rounded-full transition-all duration-500`}>
        <svg width={size} height={size} className="w-full h-auto">
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
          />

          {/* Center content */}
          <text
            x={size / 2}
            y={size / 2 - 20}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground font-black"
            style={{ fontSize: `${size * 0.25}px` }}
          >
            {score.toFixed(1)}
          </text>
          <text
            x={size / 2}
            y={size / 2 + 15}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground font-medium uppercase tracking-widest"
            style={{ fontSize: `${size * 0.05}px` }}
          >
            / 10
          </text>
        </svg>
      </div>

      {/* Recommendation Badge */}
      <div className="flex flex-col items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Protocol
        </span>
        <span className="text-lg font-black tracking-tight" style={{ color }}>
          {recommendation}
        </span>
      </div>

      {/* Score interpretation */}
      <div className="text-center text-xs text-muted-foreground line-clamp-2">
        {score >= 8 && '🔥 Peak performance'}
        {score >= 6 && score < 8 && '💪 Good to train'}
        {score >= 4 && score < 6 && '⚠️ Moderate'}
        {score < 4 && '🛑 Low readiness'}
        {score === 0 && 'Submit readiness check'}
      </div>
    </div>
  )
}
