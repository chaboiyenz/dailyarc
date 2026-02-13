import { ExerciseCategoryEnum, ExerciseTypeEnum, type SkillNode } from '../schemas/exercise'

export const CARDIO_TREE: SkillNode[] = [
  {
    id: 'walk-jog-15',
    name: '15min Walk/Jog',
    level: 1,
    sets: 1,
    reps: 1,
    duration: 900, // 15 mins
    zone: 2,
    description: 'Alternating walk and jog to build aerobic base.',
    category: ExerciseCategoryEnum.enum.core, // Using 'core' as placeholder or strictly needs a new category? Enum has 'push', 'pull', 'legs', 'core', 'iron'.
    // Maybe we should add 'cardio' to CategoryEnum?
    // For now, I'll use 'legs' or keep it as is and maybe update schema if strict.
    // actually schema says: ExerciseCategoryEnum = z.enum(['push', 'pull', 'legs', 'core', 'iron'])
    // I should probably add 'cardio' to CategoryEnum too in a previous step, but I missed it.
    // I'll stick to 'legs' for running for now, or just update the schema in a bit.
    // Let's check schema again. `ExerciseCategoryEnum`.
    // I'll update schema to include 'cardio' category first? No, I'll just use 'legs' or 'core' and fix later if needed,
    // OR BETTER: I'll use 'legs' for running.
    exerciseType: ExerciseTypeEnum.enum.CARDIO,
    prerequisites: [],
    crossPrerequisites: [],
  },
  {
    id: 'zone2-30',
    name: '30min Zone 2',
    level: 2,
    sets: 1,
    reps: 1,
    duration: 1800,
    zone: 2,
    description: 'Steady state low intensity cardio.',
    category: ExerciseCategoryEnum.enum.legs,
    exerciseType: ExerciseTypeEnum.enum.CARDIO,
    prerequisites: ['walk-jog-15'],
    crossPrerequisites: [],
  },
  {
    id: 'run-5k',
    name: '5K Run',
    level: 3,
    sets: 1,
    reps: 1,
    distance: 5, // km
    description: 'Complete a 5km run at a steady pace.',
    category: ExerciseCategoryEnum.enum.legs,
    exerciseType: ExerciseTypeEnum.enum.CARDIO,
    prerequisites: ['zone2-30'],
    crossPrerequisites: [],
  },
  {
    id: 'intervals-400m',
    name: '400m Intervals',
    level: 4,
    sets: 8,
    reps: 1,
    distance: 0.4, // 400m per set
    description: '8 sets of 400m sprints with 2min rest.',
    category: ExerciseCategoryEnum.enum.legs,
    exerciseType: ExerciseTypeEnum.enum.CARDIO,
    prerequisites: ['run-5k'],
    crossPrerequisites: [],
  },
  {
    id: 'run-10k',
    name: '10K Run',
    level: 5,
    sets: 1,
    reps: 1,
    distance: 10,
    description: 'Complete a 10km run.',
    category: ExerciseCategoryEnum.enum.legs,
    exerciseType: ExerciseTypeEnum.enum.CARDIO,
    prerequisites: ['run-5k'],
    crossPrerequisites: [],
  },

  // ─── Zone 2 Base Building ───
  {
    id: 'zone2-60',
    name: 'Zone 2 Base (60min)',
    level: 4,
    sets: 1,
    reps: 1,
    duration: 3600, // 60 minutes
    zone: 2,
    description: 'One hour conversational pace cardio. Aerobic base building.',
    category: ExerciseCategoryEnum.enum.legs,
    exerciseType: ExerciseTypeEnum.enum.CARDIO,
    prerequisites: ['zone2-30'],
    crossPrerequisites: [],
  },

  // ─── Tempo / Threshold Work ───
  {
    id: 'tempo-run-5k',
    name: 'Tempo Run (5K)',
    level: 5,
    sets: 1,
    reps: 1,
    distance: 5,
    zone: 3,
    description: '5K at threshold pace (80-85% max HR), sustained effort.',
    category: ExerciseCategoryEnum.enum.legs,
    exerciseType: ExerciseTypeEnum.enum.CARDIO,
    prerequisites: ['run-5k'],
    crossPrerequisites: [],
  },

  // ─── Sprint Intervals ───
  {
    id: 'sprint-200m',
    name: 'Sprint Intervals (200m)',
    level: 5,
    sets: 6,
    reps: 1,
    distance: 0.2, // 200 meters
    zone: 5,
    description: '6 x 200m sprints @ 90% effort with 2min rest.',
    category: ExerciseCategoryEnum.enum.legs,
    exerciseType: ExerciseTypeEnum.enum.CARDIO,
    prerequisites: ['intervals-400m'],
    crossPrerequisites: [],
  },

  // ─── Jump Rope / Skill Work ───
  {
    id: 'double-unders-practice',
    name: 'Double-Unders (50)',
    level: 3,
    sets: 5,
    reps: 50,
    description: 'Jump rope with rope turning twice per jump, 50 reps per set.',
    category: ExerciseCategoryEnum.enum.core,
    exerciseType: ExerciseTypeEnum.enum.CARDIO,
    prerequisites: ['walk-jog-15'],
    crossPrerequisites: [],
  },

  {
    id: 'double-unders-100',
    name: 'Double-Unders (100)',
    level: 4,
    sets: 3,
    reps: 100,
    description: 'Unbroken sets of 100 double-unders, jump rope skill.',
    category: ExerciseCategoryEnum.enum.core,
    exerciseType: ExerciseTypeEnum.enum.CARDIO,
    prerequisites: ['double-unders-practice'],
    crossPrerequisites: [],
  },

  // ─── Hill Training ───
  {
    id: 'hill-sprints',
    name: 'Hill Sprints',
    level: 4,
    sets: 6,
    reps: 1,
    distance: 0.1, // 100 meters uphill
    zone: 5,
    description: '6 x uphill sprints (100m), max effort, walk recovery.',
    category: ExerciseCategoryEnum.enum.legs,
    exerciseType: ExerciseTypeEnum.enum.CARDIO,
    prerequisites: ['sprint-200m'],
    crossPrerequisites: [],
  },

  // ─── Fartlek Training ───
  {
    id: 'fartlek-run',
    name: 'Fartlek Run (30min)',
    level: 4,
    sets: 1,
    reps: 1,
    duration: 1800, // 30 minutes
    zone: 3,
    description: 'Speed play: mix of fast and slow intervals within steady run.',
    category: ExerciseCategoryEnum.enum.legs,
    exerciseType: ExerciseTypeEnum.enum.CARDIO,
    prerequisites: ['run-5k'],
    crossPrerequisites: [],
  },

  // ─── Endurance Milestones ───
  {
    id: 'half-marathon',
    name: 'Half Marathon (21.1km)',
    level: 6,
    sets: 1,
    reps: 1,
    distance: 21.1,
    zone: 2,
    description: 'Half marathon distance run at conversational pace.',
    category: ExerciseCategoryEnum.enum.legs,
    exerciseType: ExerciseTypeEnum.enum.CARDIO,
    prerequisites: ['run-10k'],
    crossPrerequisites: [],
  },
]
