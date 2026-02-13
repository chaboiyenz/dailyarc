/**
 * Exercise Icon Mapping System
 * Maps exercise IDs to Lucide React icons for visual representation
 * Replaces the emoji system with professional icon symbols
 */

import {
  Dumbbell,
  Activity,
  Flame,
  Zap,
  Award,
  Target,
  TrendingUp,
  Heart,
  Wind,
  Footprints,
  Timer,
  Mountain,
  CheckCircle,
  Lock,
  Plus,
  type LucideIcon,
} from 'lucide-react'

// ─── Calisthenics / Bodyweight Exercises ───
// Theme: Activity & Progression indicators
export const CALISTHENICS_ICONS: Record<string, LucideIcon> = {
  // Push progression
  'wall-pu': Activity,
  'incline-pu': TrendingUp,
  'knee-pu': Target,
  'standard-pu': Flame,
  'full-pu': Flame,
  'diamond-pu': Award,
  'archer-pu': Zap,
  'pseudo-planche': Zap,
  'one-arm-pu': Award,

  // Pull progression
  'dead-hang': Activity,
  'flex-hang': Heart,
  'neg-pullup': TrendingUp,
  pullup: Activity,
  'muscle-up-transition': Flame,
  'muscle-up': Award,

  // Core progression
  'plank-30': Timer,
  'plank-60': Timer,
  'l-sit-tuck': Target,
  'l-sit-full': Award,
  'dragon-flag-negative': Flame,
  'dragon-flag': Award,

  // Additional calisthenics
  'planche-lean': Zap,
  'front-lever': Award,
  'handstand-hold': Activity,
  'handstand-walk': Award,
  'dip': Flame,
}

// ─── Weightlifting / Iron Exercises ───
// Theme: Dumbbell & Progressive loading
export const WEIGHTLIFTING_ICONS: Record<string, LucideIcon> = {
  // Lower body
  'goblet-squat': Dumbbell,
  'back-squat': Dumbbell,
  'front-squat': Dumbbell,
  deadlift: Dumbbell,
  'romanian-deadlift': Dumbbell,
  'bulgarian-split-squat': Activity,

  // Upper body - Bench
  'bench-press': Dumbbell,
  'arnold-press': Dumbbell,
  'overhead-press': Dumbbell,

  // Back / Pull
  'barbell-row': Dumbbell,
  'pendlay-row': Dumbbell,
  'power-clean': Zap,
  snatch: Award,

  // Hybrid strength
  'adv-shrimp-squat': Activity,
}

// ─── Cardio / Endurance Exercises ───
// Theme: Movement & Intensity
export const CARDIO_ICONS: Record<string, LucideIcon> = {
  // Base building
  'walk-jog-15': Footprints,
  'zone2-30': Wind,
  'zone2-60': Wind,

  // Distance progression
  'run-5k': Activity,
  'run-10k': Activity,
  'half-marathon': Mountain,
  marathon: Mountain,

  // Interval training
  'intervals-400m': Zap,
  'sprint-200m': Flame,
  'tempo-run-5k': Flame,

  // Skill work
  'double-unders-practice': Activity,
  'double-unders-100': Award,
  'hill-sprints': Mountain,
  'fartlek-run': Flame,
}

// ─── Combined Icon Map ───
export const EXERCISE_ICONS: Record<string, LucideIcon> = {
  ...CALISTHENICS_ICONS,
  ...WEIGHTLIFTING_ICONS,
  ...CARDIO_ICONS,
}

// ─── State Icons ───
export const STATE_ICONS = {
  locked: Lock,
  mastered: CheckCircle,
  inProgress: Target,
  new: Plus,
} as const

// ─── Icon Sizing Scale ───
// Matches existing pattern from DashboardOverview.tsx
export const ICON_SIZES = {
  xs: 'h-3 w-3',     // Tiny (badges)
  sm: 'h-4 w-4',     // Small (inline buttons)
  md: 'h-5 w-5',     // Medium (standard icons)
  lg: 'h-6 w-6',     // Large (metrics/cards)
  xl: 'h-8 w-8',     // Extra large (tree nodes)
  xxl: 'h-12 w-12',  // Double large (modal headers)
} as const

// ─── Color Semantics by Exercise Type ───
export const ICON_COLORS = {
  calisthenics: {
    locked: 'text-slate-500',
    inProgress: 'text-cyan-400',
    mastered: 'text-amber-400',
  },
  weightlifting: {
    locked: 'text-slate-500',
    inProgress: 'text-cyan-400',
    mastered: 'text-amber-400',
  },
  cardio: {
    locked: 'text-slate-500',
    inProgress: 'text-cyan-400',
    mastered: 'text-amber-400',
  },
} as const

// ─── Utility function to get icon with fallback ───
export function getExerciseIcon(exerciseId: string): LucideIcon {
  return EXERCISE_ICONS[exerciseId] || Target
}

// ─── Utility function to get state color ───
export function getStateColor(
  state: 'locked' | 'inProgress' | 'mastered',
  exerciseType: 'CALISTHENICS' | 'WEIGHTLIFTING' | 'CARDIO' = 'CALISTHENICS'
): string {
  const typeKey = (
    exerciseType === 'WEIGHTLIFTING'
      ? 'weightlifting'
      : exerciseType === 'CARDIO'
        ? 'cardio'
        : 'calisthenics'
  ) as keyof typeof ICON_COLORS

  return ICON_COLORS[typeKey][state]
}
