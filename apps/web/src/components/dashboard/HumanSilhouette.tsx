/**
 * Human Silhouette - Anatomical heat map for soreness visualization
 * Shows posterior (back) and anterior (front) views with color-coded muscle groups
 */

interface HumanSilhouetteProps {
  /** Array of sore body parts from readiness check */
  soreness: string[]
  /** Size of the SVG (width = height) */
  size?: number
}

export default function HumanSilhouette({ soreness, size = 200 }: HumanSilhouetteProps) {
  // Map body parts to heat intensity
  const getSorenessLevel = (bodyPart: string): 'none' | 'low' | 'medium' | 'high' => {
    if (!soreness.includes(bodyPart)) return 'none'
    // In future, this could be based on RPE or days since injury
    return 'medium'
  }

  const getHeatClass = (level: 'none' | 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'high':
        return 'heat-high'
      case 'medium':
        return 'heat-medium'
      case 'low':
        return 'heat-low'
      default:
        return 'fill-transparent'
    }
  }

  const shouldersLevel = getSorenessLevel('shoulders')
  const chestLevel = getSorenessLevel('chest')
  const upperBackLevel = getSorenessLevel('upperBack')
  const lowerBackLevel = getSorenessLevel('lowerBack')
  const armsLevel = getSorenessLevel('arms')
  const legsLevel = getSorenessLevel('legs')

  return (
    <div className="flex flex-col items-center gap-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Recovery Map
      </h4>

      <div className="flex gap-6">
        {/* Anterior (Front) View */}
        <div className="flex flex-col items-center gap-2">
          <svg width={size / 2} height={size} viewBox="0 0 100 200" className="drop-shadow-lg">
            {/* Head */}
            <circle cx="50" cy="15" r="10" className="fill-slate-700/50 stroke-slate-600" strokeWidth="1" />

            {/* Shoulders */}
            <ellipse
              cx="50"
              cy="35"
              rx="25"
              ry="8"
              className={`${getHeatClass(shouldersLevel)} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />

            {/* Chest */}
            <ellipse
              cx="50"
              cy="50"
              rx="20"
              ry="15"
              className={`${getHeatClass(chestLevel)} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />

            {/* Arms */}
            <rect
              x="20"
              y="40"
              width="8"
              height="45"
              rx="4"
              className={`${getHeatClass(armsLevel)} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />
            <rect
              x="72"
              y="40"
              width="8"
              height="45"
              rx="4"
              className={`${getHeatClass(armsLevel)} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />

            {/* Core/Abs */}
            <rect
              x="35"
              y="60"
              width="30"
              height="35"
              rx="5"
              className="fill-slate-700/30 stroke-slate-600"
              strokeWidth="1"
            />

            {/* Legs */}
            <rect
              x="35"
              y="95"
              width="12"
              height="80"
              rx="6"
              className={`${getHeatClass(legsLevel)} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />
            <rect
              x="53"
              y="95"
              width="12"
              height="80"
              rx="6"
              className={`${getHeatClass(legsLevel)} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />
          </svg>
          <span className="text-xs text-muted-foreground">Front</span>
        </div>

        {/* Posterior (Back) View */}
        <div className="flex flex-col items-center gap-2">
          <svg width={size / 2} height={size} viewBox="0 0 100 200" className="drop-shadow-lg">
            {/* Head */}
            <circle cx="50" cy="15" r="10" className="fill-slate-700/50 stroke-slate-600" strokeWidth="1" />

            {/* Upper Back/Shoulders */}
            <ellipse
              cx="50"
              cy="40"
              rx="25"
              ry="15"
              className={`${getHeatClass(upperBackLevel)} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />

            {/* Lower Back */}
            <rect
              x="35"
              y="55"
              width="30"
              height="30"
              rx="5"
              className={`${getHeatClass(lowerBackLevel)} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />

            {/* Arms */}
            <rect
              x="20"
              y="40"
              width="8"
              height="45"
              rx="4"
              className={`${getHeatClass(armsLevel)} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />
            <rect
              x="72"
              y="40"
              width="8"
              height="45"
              rx="4"
              className={`${getHeatClass(armsLevel)} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />

            {/* Glutes */}
            <ellipse
              cx="50"
              cy="90"
              rx="18"
              ry="10"
              className="fill-slate-700/30 stroke-slate-600"
              strokeWidth="1"
            />

            {/* Legs (back) */}
            <rect
              x="35"
              y="95"
              width="12"
              height="80"
              rx="6"
              className={`${getHeatClass(legsLevel)} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />
            <rect
              x="53"
              y="95"
              width="12"
              height="80"
              rx="6"
              className={`${getHeatClass(legsLevel)} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />
          </svg>
          <span className="text-xs text-muted-foreground">Back</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-emerald-500/30" />
          <span className="text-muted-foreground">Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-yellow-500/50" />
          <span className="text-muted-foreground">Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm bg-red-500/70" />
          <span className="text-muted-foreground">High</span>
        </div>
      </div>
    </div>
  )
}
