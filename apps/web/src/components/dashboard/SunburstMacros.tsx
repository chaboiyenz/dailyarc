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

export default function SunburstMacros({ protein, carbs, fat, size = 320 }: SunburstMacrosProps) {
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
    <div className="flex flex-col items-center justify-center gap-1 w-full h-full px-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Macro Targets
      </h4>

      {/* Sunburst SVG */}
      <div className="relative flex-shrink-0 max-w-[140px] max-h-[140px]">
        <svg width={size} height={size} className="w-auto h-auto" viewBox={`0 0 ${size} ${size}`}>
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
            className="ring-animate"
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
            className="ring-animate"
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
            className="ring-animate"
          />
        </svg>

        {/* Center total calories */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl md:text-2xl font-black text-foreground">
            {Math.round(protein.current * 4 + carbs.current * 4 + fat.current * 9)}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            kcal
          </span>
        </div>
      </div>

      {/* Legend with targets - compact */}
      <div className="grid w-full grid-cols-3 gap-1 text-center">
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
    <div className="flex flex-col items-center gap-0.5 rounded-lg border border-slate-800 bg-slate-900 px-1.5 py-1">
      <span className="text-[8px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <div className="flex items-baseline gap-0.5 text-center">
        <span className="font-mono text-xs font-bold text-foreground">{current}</span>
        <span className="text-[9px] text-muted-foreground">/{target}g</span>
      </div>
      <div className="h-0.5 w-10 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
