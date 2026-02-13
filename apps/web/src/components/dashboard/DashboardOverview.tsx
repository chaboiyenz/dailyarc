import { Skeleton } from '@repo/ui'
import HumanSilhouette from './HumanSilhouette'
import WeeklyReadinessChart from './WeeklyReadinessChart'
import type { NavSection } from './Sidebar'
import { useAuth } from '@/hooks/useAuth'
import { useTodaysArc } from '@/hooks/useTodaysArc'
import { useWeeklyReadiness } from '@/hooks/useWeeklyReadiness'
import { useRecentWorkouts } from '@/hooks/useLogWorkout'
import { useTodaysMealLogs } from '@/hooks/useMealLogs'
import { calculateAdjustedMacros } from '@repo/shared'
import { TrendingUp, Heart, Zap, Target, ChevronRight, AlertTriangle, Watch, Pencil } from 'lucide-react'

interface DashboardOverviewProps {
  onNavigate: (section: NavSection) => void
}

export default function DashboardOverview({ onNavigate }: DashboardOverviewProps) {
  console.log('DASHBOARD_SYNC_CHECK')
  const { user } = useAuth()
  const { data: todaysArc, isLoading } = useTodaysArc(user?.uid || null)
  const {
    data: weeklyData,
    isLoading: weeklyLoading,
    fatigueAlert,
  } = useWeeklyReadiness(user?.uid || null)
  const { data: recentWorkouts } = useRecentWorkouts(user?.uid || null)
  const { consumed } = useTodaysMealLogs(user?.uid || null)

  // Real-time data from Firestore
  const readinessAverage = todaysArc?.readinessAverage ?? 0
  const readinessScore = readinessAverage * 2
  const recommendation = todaysArc?.recommendation ?? 'REST'
  const soreness = todaysArc?.sorenessZones ?? []
  const bodyBattery = todaysArc?.bioMetrics?.bodyBattery ?? 0
  const restingHR = todaysArc?.bioMetrics?.restingHR ?? 0
  const avgHR = todaysArc?.bioMetrics?.avgHR
  const avgHRSource = todaysArc?.bioMetrics?.avgHRSource

  // Macro calculations
  const baseMacros = { calories: 2500, protein: 180, carbs: 250, fat: 70 }
  const readinessFactor = todaysArc?.readinessFactor ?? 1.0
  const adjustedMacros = calculateAdjustedMacros(baseMacros, readinessFactor)

  // Loading state
  if (isLoading || weeklyLoading) {
    return (
      <div className="min-h-screen bg-white p-6 md:p-8 space-y-6">
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    )
  }

  const getReadinessColor = () => {
    if (readinessScore < 3) return 'text-red-600'
    if (readinessScore < 6) return 'text-amber-600'
    return 'text-emerald-600'
  }

  const getMacroPercentages = () => ({
    protein: Math.min((consumed.protein / adjustedMacros.protein) * 100, 100),
    carbs: Math.min((consumed.carbs / adjustedMacros.carbs) * 100, 100),
    fat: Math.min((consumed.fat / adjustedMacros.fat) * 100, 100),
  })

  const macroPercentages = getMacroPercentages()

  const getSystemEnergyStatus = (value: number) => {
    if (value >= 80) return 'Optimal Intensity Possible'
    if (value >= 50) return 'Controlled Volume Recommended'
    return 'Active Recovery Advised'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-4 md:p-8 pb-24">
      {/* HERO: Primary Readiness */}
      <div
        className="mb-8 p-8 md:p-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => onNavigate('readiness')}
      >
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
            Today's Status
          </p>
          <div className="flex items-end gap-4 mb-4">
            <div className="flex-1">
              <p className={`text-6xl md:text-7xl font-black ${getReadinessColor()}`}>
                {readinessScore > 0 ? readinessScore.toFixed(1) : '—'}
              </p>
              <p className="text-lg text-gray-700 font-semibold mt-2">
                {recommendation === 'INTENSE'
                  ? '🔥 Ready for Intensity'
                  : recommendation === 'MODERATE'
                    ? '✓ Standard Session OK'
                    : recommendation === 'LIGHT'
                      ? '💭 Light Work'
                      : '😴 Rest Advised'}
              </p>
            </div>
            {fatigueAlert && (
              <div className="pb-2 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-100 border border-red-200 text-red-700">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span className="font-semibold">Fatigue Alert</span>
              </div>
            )}
          </div>
          <p className="text-gray-600 text-sm">
            Based on sleep, stress, soreness, and energy levels from your morning check-in.
          </p>
        </div>
      </div>

      {/* GRID: Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* System Energy (Recovery Fuel) */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                System Energy
              </p>
              <p className="text-4xl font-bold text-indigo-600 mt-2">
                {bodyBattery > 0 ? `${bodyBattery}%` : '—'}
              </p>
            </div>
            <Zap className="h-6 w-6 text-indigo-500 flex-shrink-0" />
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all"
              style={{ width: `${bodyBattery}%` }}
            />
          </div>
          <p className="text-xs text-indigo-700 font-semibold mt-3">
            {bodyBattery > 0 ? getSystemEnergyStatus(bodyBattery) : '—'}
          </p>
        </div>

        {/* Resting Heart Rate */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Resting HR
              </p>
              <p className="text-4xl font-bold text-rose-600 mt-2">
                {restingHR > 0 ? `${restingHR}` : '—'}
              </p>
              {restingHR > 0 && <p className="text-xs text-gray-600 mt-1">BPM</p>}
            </div>
            <Heart className="h-6 w-6 text-rose-500 flex-shrink-0" />
          </div>
          <button
            onClick={() => onNavigate('readiness')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
          >
            Update →
          </button>
        </div>

        {/* Average Heart Rate */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Avg HR
              </p>
              <p className="text-4xl font-bold text-purple-600 mt-2">
                {avgHR ? `${avgHR}` : '—'}
              </p>
              {avgHR && <p className="text-xs text-gray-600 mt-1">BPM</p>}
            </div>
            {avgHRSource === 'wearable' ? (
              <Watch className="h-6 w-6 text-purple-500 flex-shrink-0" aria-label="From wearable device" />
            ) : avgHRSource === 'manual' ? (
              <Pencil className="h-6 w-6 text-purple-500 flex-shrink-0" aria-label="Manual entry" />
            ) : (
              <Heart className="h-6 w-6 text-gray-400 flex-shrink-0" />
            )}
          </div>
          <button
            onClick={() => onNavigate('readiness')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
          >
            Update →
          </button>
        </div>

        {/* Sessions/Performance */}
        <div className="p-4 rounded-xl bg-white border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Sessions
              </p>
              <p className="text-4xl font-bold text-emerald-600 mt-2">
                {recentWorkouts?.length ?? 0}
              </p>
            </div>
            <TrendingUp className="h-6 w-6 text-emerald-500 flex-shrink-0" />
          </div>
          <p className="text-xs text-gray-600">Last 72 hours</p>
          <button
            onClick={() => onNavigate('training')}
            className="text-xs text-blue-600 hover:text-blue-700 font-semibold mt-3"
          >
            View History →
          </button>
        </div>
      </div>

      {/* NUTRITION ROW */}
      <div className="mb-8 p-6 md:p-8 rounded-2xl bg-white border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Nutrition Today
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">Macros</p>
          </div>
          <button
            onClick={() => onNavigate('nutrition')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-sm font-semibold"
          >
            <Target className="h-4 w-4" />
            Log Meal
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Protein */}
          <div>
            <div className="flex justify-between items-baseline mb-3">
              <span className="text-sm font-semibold text-gray-700">Protein</span>
              <span className="text-xs text-gray-600 font-mono">
                {consumed.protein}/{adjustedMacros.protein}g
              </span>
            </div>
            <div className="space-y-2">
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${macroPercentages.protein > 100 ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(macroPercentages.protein, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600">
                {Math.round(macroPercentages.protein)}% target
              </p>
            </div>
          </div>

          {/* Carbs */}
          <div>
            <div className="flex justify-between items-baseline mb-3">
              <span className="text-sm font-semibold text-gray-700">Carbs</span>
              <span className="text-xs text-gray-600 font-mono">
                {consumed.carbs}/{adjustedMacros.carbs}g
              </span>
            </div>
            <div className="space-y-2">
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${macroPercentages.carbs > 100 ? 'bg-red-500' : 'bg-amber-500'}`}
                  style={{ width: `${Math.min(macroPercentages.carbs, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600">{Math.round(macroPercentages.carbs)}% target</p>
            </div>
          </div>

          {/* Fats */}
          <div>
            <div className="flex justify-between items-baseline mb-3">
              <span className="text-sm font-semibold text-gray-700">Fats</span>
              <span className="text-xs text-gray-600 font-mono">
                {consumed.fat}/{adjustedMacros.fat}g
              </span>
            </div>
            <div className="space-y-2">
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${macroPercentages.fat > 100 ? 'bg-red-500' : 'bg-rose-500'}`}
                  style={{ width: `${Math.min(macroPercentages.fat, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600">{Math.round(macroPercentages.fat)}% target</p>
            </div>
          </div>
        </div>
      </div>

      {/* TWO COLUMN: Chart + Silhouette */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 p-6 md:p-8 rounded-2xl bg-white border border-gray-200 overflow-hidden">
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              7-Day Trend
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">Readiness Pattern</p>
          </div>
          <div className="h-64 md:h-80">
            <WeeklyReadinessChart data={weeklyData} isLoading={weeklyLoading} />
          </div>
        </div>

        {/* Muscle Map */}
        <div className="p-6 md:p-8 rounded-2xl bg-white border border-gray-200 overflow-hidden">
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Muscle Map
            </p>
            <p className="text-2xl font-bold text-gray-900 mt-1">Recovery Status</p>
          </div>
          <div className="h-64 md:h-80 flex items-center justify-center">
            <HumanSilhouette soreness={soreness} recentWorkouts={recentWorkouts || []} size={100} />
          </div>
          <p className="text-xs text-gray-600 text-center mt-4">
            Red: &lt;24h | Orange: &lt;48h | Yellow: &lt;72h
          </p>
        </div>
      </div>
    </div>
  )
}
