import React, { useMemo } from 'react'
import type { WorkoutSession } from '@repo/shared'

interface HumanSilhouetteProps {
  /** Array of sore body parts from readiness check */
  soreness: string[]
  /** Recent workouts from last 72h to calculate heat */
  recentWorkouts: WorkoutSession[]
  /** Size of the SVG (width = height) */
  size?: number
}

const HumanSilhouette = React.memo(function HumanSilhouette({
  soreness,
  recentWorkouts,
  size = 200,
}: HumanSilhouetteProps) {
  // Calculate last workout timestamp per muscle group for 72h decay
  const muscleLastWorkout = useMemo(() => {
    const map: Record<string, number> = {
      legs: 0,
      push: 0,
      pull: 0,
      core: 0,
      shoulders: 0,
      arms: 0,
    }

    if (!recentWorkouts || !Array.isArray(recentWorkouts)) {
      return map
    }

    // Find most recent workout for each muscle group
    recentWorkouts.forEach(workout => {
      const workoutTime =
        workout.date instanceof Date ? workout.date.getTime() : new Date(workout.date).getTime()

      const name = workout.exerciseName?.toLowerCase() || ''

      if (name.includes('squat') || name.includes('deadlift') || name.includes('lunge')) {
        if (workoutTime > map.legs) map.legs = workoutTime
      } else if (name.includes('press') || name.includes('push')) {
        if (workoutTime > map.push) map.push = workoutTime
      } else if (name.includes('row') || name.includes('pull') || name.includes('curl')) {
        if (workoutTime > map.pull) map.pull = workoutTime
      } else if (name.includes('plank') || name.includes('situp')) {
        if (workoutTime > map.core) map.core = workoutTime
      } else if (name.includes('shoulder') || name.includes('lateral raise')) {
        if (workoutTime > map.shoulders) map.shoulders = workoutTime
      } else if (name.includes('bicep') || name.includes('tricep') || name.includes('dip')) {
        if (workoutTime > map.arms) map.arms = workoutTime
      }
    })

    return map
  }, [recentWorkouts])

  // Get color based on time window (0-24h red, 24-48h orange, 48-72h yellow, >72h neutral)
  const getColorByTimeWindow = (muscleGroup: keyof typeof muscleLastWorkout): string => {
    const lastWorkoutTime = muscleLastWorkout[muscleGroup]

    // No workout data for this muscle
    if (!lastWorkoutTime) return 'fill-slate-800'

    const now = Date.now()
    const hoursAgo = (now - lastWorkoutTime) / (1000 * 60 * 60)

    if (hoursAgo < 24) return 'fill-red-500' // 0-24h: #ef4444
    if (hoursAgo < 48) return 'fill-orange-500' // 24-48h: #f97316
    if (hoursAgo < 72) return 'fill-yellow-500' // 48-72h: #eab308
    return 'fill-slate-800' // >72h: #1e293b (slate-800)
  }

  // Map body parts to heat intensity based on Soreness or Decay color
  const getHeatLevel = (bodyPart: string): 'none' | 'low' | 'medium' | 'high' => {
    // Check direct soreness override
    if (soreness.includes(bodyPart)) return 'high'
    return 'none'
  }

  const getHeatClass = (level: 'none' | 'low' | 'medium' | 'high') => {
    return level === 'high' ? 'fill-red-700/90' : 'fill-transparent'
  }

  const shouldersLevel = getHeatLevel('shoulders')
  const chestLevel = getHeatLevel('chest')
  const upperBackLevel = getHeatLevel('upperBack')
  const lowerBackLevel = getHeatLevel('lowerBack')
  const armsLevel = getHeatLevel('arms')
  const legsLevel = getHeatLevel('legs')

  return (
    <div className="flex flex-col items-center gap-1 w-full h-full justify-center px-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Muscle Fatigue Map
      </h4>

      <div className="flex gap-1 justify-center max-w-[180px]">
        {/* Anterior (Front) View */}
        <div className="flex flex-col items-center gap-0.5">
          <svg
            width={size / 2}
            height={size}
            viewBox="0 0 100 200"
            className="w-auto h-auto max-w-[70px] max-h-[120px]"
          >
            {/* Head */}
            <circle
              cx="50"
              cy="15"
              r="10"
              className="fill-slate-700/50 stroke-slate-600"
              strokeWidth="1"
            />

            {/* Shoulders */}
            <ellipse
              cx="50"
              cy="35"
              rx="25"
              ry="8"
              className={`${soreness.includes('shoulders') ? getHeatClass(shouldersLevel) : getColorByTimeWindow('shoulders')} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />

            {/* Chest */}
            <ellipse
              cx="50"
              cy="50"
              rx="20"
              ry="15"
              className={`${soreness.includes('chest') ? getHeatClass(chestLevel) : getColorByTimeWindow('push')} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />

            {/* Arms */}
            <rect
              x="20"
              y="40"
              width="8"
              height="45"
              rx="4"
              className={`${soreness.includes('arms') ? getHeatClass(armsLevel) : getColorByTimeWindow('arms')} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />
            <rect
              x="72"
              y="40"
              width="8"
              height="45"
              rx="4"
              className={`${soreness.includes('arms') ? getHeatClass(armsLevel) : getColorByTimeWindow('arms')} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />

            {/* Core/Abs */}
            <rect
              x="35"
              y="60"
              width="30"
              height="35"
              rx="5"
              className={`${soreness.includes('core') ? 'fill-red-700/90' : getColorByTimeWindow('core')} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />

            {/* Legs */}
            <rect
              x="35"
              y="95"
              width="12"
              height="80"
              rx="6"
              className={`${soreness.includes('legs') ? getHeatClass(legsLevel) : getColorByTimeWindow('legs')} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />
            <rect
              x="53"
              y="95"
              width="12"
              height="80"
              rx="6"
              className={`${soreness.includes('legs') ? getHeatClass(legsLevel) : getColorByTimeWindow('legs')} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />
          </svg>
          <span className="text-[10px] text-muted-foreground">Front</span>
        </div>

        {/* Posterior (Back) View */}
        <div className="flex flex-col items-center gap-0.5">
          <svg
            width={size / 2}
            height={size}
            viewBox="0 0 100 200"
            className="w-auto h-auto max-w-[70px] max-h-[120px]"
          >
            {/* Head */}
            <circle
              cx="50"
              cy="15"
              r="10"
              className="fill-slate-700/50 stroke-slate-600"
              strokeWidth="1"
            />

            {/* Upper Back/Shoulders */}
            <ellipse
              cx="50"
              cy="40"
              rx="25"
              ry="15"
              className={`${soreness.includes('upperBack') ? getHeatClass(upperBackLevel) : getColorByTimeWindow('pull')} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />

            {/* Lower Back */}
            <rect
              x="35"
              y="55"
              width="30"
              height="30"
              rx="5"
              className={`${soreness.includes('lowerBack') ? getHeatClass(lowerBackLevel) : getColorByTimeWindow('pull')} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />

            {/* Arms */}
            <rect
              x="20"
              y="40"
              width="8"
              height="45"
              rx="4"
              className={`${soreness.includes('arms') ? getHeatClass(armsLevel) : getColorByTimeWindow('arms')} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />
            <rect
              x="72"
              y="40"
              width="8"
              height="45"
              rx="4"
              className={`${soreness.includes('arms') ? getHeatClass(armsLevel) : getColorByTimeWindow('arms')} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />

            {/* Glutes */}
            <ellipse
              cx="50"
              cy="90"
              rx="18"
              ry="10"
              className={`${soreness.includes('glutes') ? 'fill-red-700/90' : getColorByTimeWindow('legs')} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />

            {/* Legs (back) */}
            <rect
              x="35"
              y="95"
              width="12"
              height="80"
              rx="6"
              className={`${soreness.includes('legs') ? getHeatClass(legsLevel) : getColorByTimeWindow('legs')} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />
            <rect
              x="53"
              y="95"
              width="12"
              height="80"
              rx="6"
              className={`${soreness.includes('legs') ? getHeatClass(legsLevel) : getColorByTimeWindow('legs')} stroke-slate-600 transition-all duration-300`}
              strokeWidth="1"
            />
          </svg>
          <span className="text-[10px] text-muted-foreground">Back</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-2 text-xs mt-2 flex-wrap justify-center">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-muted-foreground text-[8px]">0-24h</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-orange-500" />
          <span className="text-muted-foreground text-[8px]">24-48h</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-yellow-500" />
          <span className="text-muted-foreground text-[8px]">48-72h</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 rounded-full bg-slate-800" />
          <span className="text-muted-foreground text-[8px]">No data</span>
        </div>
      </div>
    </div>
  )
})

export default HumanSilhouette
