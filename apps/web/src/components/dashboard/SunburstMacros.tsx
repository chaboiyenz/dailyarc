/**
 * Sunburst Macros - Concentric rings visualization for nutrition targets
 * Inspired by gaming UI with layered, glowing rings
 */

interface SunburstMacrosProps {
  protein: { current: number; target: number }
  carbs: { current: number; target: number }
  fat: { current: number; target: number }
  size?: number
}

export default function SunburstMacros({
  protein,
  carbs,
  fat,
  size = 320,
}: SunburstMacrosProps) {
  const centerX = size / 2
  const centerY = size / 2

  // Concentric ring radii
  const innerRadius = size * 0.15
  const midRadius = size * 0.25
  const outerRadius = size * 0.35

  // Calculate progress percentages
  const proteinProgress = (protein.current / protein.target) * 100
  const carbsProgress = (carbs.current / carbs.target) * 100
  const fatProgress = (fat.current / fat.target) * 100

  // Ring stroke calculations
  const getCircumference = (radius: number) => 2 * Math.PI * radius
  const getStrokeDasharray = (radius: number, progress: number) => {
    const circumference = getCircumference(radius)
    const offset = circumference - (progress / 100) * circumference
    return { circumference, offset }
  }

  const proteinRing = getStrokeDasharray(outerRadius, proteinProgress)
  const carbsRing = getStrokeDasharray(midRadius, carbsProgress)
  const fatRing = getStrokeDasharray(innerRadius, fatProgress)

  return (
    <div className="flex flex-col items-center gap-6">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Macro Targets
      </h4>

      {/* Sunburst SVG */}
      <div className="relative">
        <svg width={size} height={size} className="drop-shadow-2xl">
          {/* Background rings */}
          <circle
            cx={centerX}
            cy={centerY}
            r={outerRadius}
            fill="transparent"
            stroke="hsl(var(--secondary))"
            strokeWidth="18"
            opacity="0.3"
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={midRadius}
            fill="transparent"
            stroke="hsl(var(--secondary))"
            strokeWidth="18"
            opacity="0.3"
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={innerRadius}
            fill="transparent"
            stroke="hsl(var(--secondary))"
            strokeWidth="18"
            opacity="0.3"
          />

          {/* Protein ring (outer) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={outerRadius}
            fill="transparent"
            stroke="hsl(var(--chart-protein))"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={proteinRing.circumference}
            strokeDashoffset={proteinRing.offset}
            transform={`rotate(-90 ${centerX} ${centerY})`}
            className="sunburst-ring"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))',
            }}
          />

          {/* Carbs ring (middle) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={midRadius}
            fill="transparent"
            stroke="hsl(var(--chart-carbs))"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={carbsRing.circumference}
            strokeDashoffset={carbsRing.offset}
            transform={`rotate(-90 ${centerX} ${centerY})`}
            className="sunburst-ring"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.6))',
            }}
          />

          {/* Fat ring (inner) */}
          <circle
            cx={centerX}
            cy={centerY}
            r={innerRadius}
            fill="transparent"
            stroke="hsl(var(--chart-fat))"
            strokeWidth="18"
            strokeLinecap="round"
            strokeDasharray={fatRing.circumference}
            strokeDashoffset={fatRing.offset}
            transform={`rotate(-90 ${centerX} ${centerY})`}
            className="sunburst-ring"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(251, 146, 60, 0.6))',
            }}
          />

          {/* Center glow */}
          <circle
            cx={centerX}
            cy={centerY}
            r={innerRadius - 25}
            fill="url(#centerGlow)"
            opacity="0.3"
          />

          <defs>
            <radialGradient id="centerGlow">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>
          </defs>
        </svg>

        {/* Center total calories */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-foreground">
            {Math.round(protein.current * 4 + carbs.current * 4 + fat.current * 9)}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            kcal
          </span>
        </div>
      </div>

      {/* Legend with targets */}
      <div className="grid w-full grid-cols-3 gap-3">
        <MacroLegendItem
          label="Protein"
          current={protein.current}
          target={protein.target}
          color="hsl(var(--chart-protein))"
        />
        <MacroLegendItem
          label="Carbs"
          current={carbs.current}
          target={carbs.target}
          color="hsl(var(--chart-carbs))"
        />
        <MacroLegendItem
          label="Fat"
          current={fat.current}
          target={fat.target}
          color="hsl(var(--chart-fat))"
        />
      </div>
    </div>
  )
}

function MacroLegendItem({
  label,
  current,
  target,
  color,
}: {
  label: string
  current: number
  target: number
  color: string
}) {
  const progress = (current / target) * 100

  return (
    <div className="glass-card flex flex-col items-center gap-2 px-3 py-2">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-lg font-bold text-foreground">{current}</span>
        <span className="text-xs text-muted-foreground">/ {target}g</span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
