import { SkillNode, ExerciseTypeEnum, ExerciseCategoryEnum } from '../schemas/exercise'

export const WEIGHTLIFTING_TREE: SkillNode[] = [
  // --- LEGS / POSTERIOR CHAIN ---
  {
    id: 'goblet-squat',
    name: 'Goblet Squat',
    level: 1,
    sets: 3,
    reps: 12,
    description: 'Hold weight at chest height, squat deep.',
    category: ExerciseCategoryEnum.enum.legs,
    exerciseType: ExerciseTypeEnum.enum.WEIGHTLIFTING,
    prerequisites: [],
    crossPrerequisites: [],
  },
  {
    id: 'back-squat',
    name: 'Back Squat',
    level: 2,
    sets: 3,
    reps: 5,
    description: 'Barbell across upper back. The king of leg exercises.',
    category: ExerciseCategoryEnum.enum.legs,
    exerciseType: ExerciseTypeEnum.enum.WEIGHTLIFTING,
    prerequisites: ['goblet-squat'],
    crossPrerequisites: [],
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    level: 3,
    sets: 3,
    reps: 5,
    description: 'Lift heavy off the floor. Neutral spine.',
    category: ExerciseCategoryEnum.enum.legs,
    exerciseType: ExerciseTypeEnum.enum.WEIGHTLIFTING,
    prerequisites: ['back-squat'],
    crossPrerequisites: [],
  },

  // --- PUSH / CHEST ---
  {
    id: 'bench-press',
    name: 'Bench Press',
    level: 2,
    sets: 3,
    reps: 5,
    description: 'Barbell bench press. Keep shoulders tucked.',
    category: ExerciseCategoryEnum.enum.push,
    exerciseType: ExerciseTypeEnum.enum.WEIGHTLIFTING,
    // Cross-modality: Requires mastery of Standard Pushups from Calisthenics tree
    prerequisites: ['standard-pu'],
    crossPrerequisites: [],
  },

  // --- PULL / BACK ---
  {
    id: 'barbell-row',
    name: 'Barbell Row (Pendlay)',
    level: 2,
    sets: 4,
    reps: 5,
    description: 'Row from floor, explode at chest, torso parallel.',
    category: ExerciseCategoryEnum.enum.pull,
    exerciseType: ExerciseTypeEnum.enum.WEIGHTLIFTING,
    prerequisites: ['deadlift'],
    crossPrerequisites: [],
  },

  // --- VARIATION / POWER ---
  {
    id: 'power-clean',
    name: 'Power Clean',
    level: 4,
    sets: 3,
    reps: 3,
    description: 'Explosive pull from floor to front rack position.',
    category: ExerciseCategoryEnum.enum.legs,
    exerciseType: ExerciseTypeEnum.enum.WEIGHTLIFTING,
    prerequisites: ['deadlift', 'front-squat'],
    crossPrerequisites: [],
  },

  // --- ROMANIAN DEADLIFT (RDL) ---
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift (RDL)',
    level: 3,
    sets: 3,
    reps: 8,
    description: 'Hip hinge, keep legs nearly straight, posterior chain dominant.',
    category: ExerciseCategoryEnum.enum.legs,
    exerciseType: ExerciseTypeEnum.enum.WEIGHTLIFTING,
    prerequisites: ['deadlift'],
    crossPrerequisites: [],
  },

  // --- FRONT SQUAT ---
  {
    id: 'front-squat',
    name: 'Front Squat',
    level: 3,
    sets: 3,
    reps: 5,
    description: 'Barbell on front deltoids, elbows high, quad dominant.',
    category: ExerciseCategoryEnum.enum.legs,
    exerciseType: ExerciseTypeEnum.enum.WEIGHTLIFTING,
    prerequisites: ['back-squat'],
    crossPrerequisites: [],
  },

  // --- OVERHEAD PRESS (OHP) ---
  {
    id: 'overhead-press',
    name: 'Overhead Press (OHP)',
    level: 2,
    sets: 3,
    reps: 5,
    description: 'Standing barbell press, strict form, no leg drive.',
    category: ExerciseCategoryEnum.enum.push,
    exerciseType: ExerciseTypeEnum.enum.WEIGHTLIFTING,
    prerequisites: ['bench-press'],
    crossPrerequisites: [],
  },

  // --- ARNOLD PRESS ---
  {
    id: 'arnold-press',
    name: 'Arnold Press (Dumbbell)',
    level: 3,
    sets: 3,
    reps: 8,
    description: 'Dumbbell press with rotating palms, increases ROM.',
    category: ExerciseCategoryEnum.enum.push,
    exerciseType: ExerciseTypeEnum.enum.WEIGHTLIFTING,
    prerequisites: ['overhead-press'],
    crossPrerequisites: [],
  },

  // --- BULGARIAN SPLIT SQUAT ---
  {
    id: 'bulgarian-split-squat',
    name: 'Bulgarian Split Squat',
    level: 3,
    sets: 3,
    reps: 8,
    description: 'Rear foot elevated, dumbbell split squat.',
    category: ExerciseCategoryEnum.enum.legs,
    exerciseType: ExerciseTypeEnum.enum.WEIGHTLIFTING,
    prerequisites: ['back-squat'],
    crossPrerequisites: [],
  },

  // --- SUMO DEADLIFT ---
  {
    id: 'sumo-deadlift',
    name: 'Sumo Deadlift',
    level: 3,
    sets: 3,
    reps: 5,
    description: 'Wide stance deadlift, knees tracking over toes.',
    category: ExerciseCategoryEnum.enum.legs,
    exerciseType: ExerciseTypeEnum.enum.WEIGHTLIFTING,
    prerequisites: ['deadlift'],
    crossPrerequisites: [],
  },

  // --- SNATCH (Olympic Lift) ---
  {
    id: 'snatch',
    name: 'Snatch',
    level: 5,
    sets: 3,
    reps: 3,
    description: 'Complex Olympic lift, explosive full body movement.',
    category: ExerciseCategoryEnum.enum.legs,
    exerciseType: ExerciseTypeEnum.enum.WEIGHTLIFTING,
    prerequisites: ['power-clean'],
    crossPrerequisites: [],
  },

  // --- HYBRID / CROSS-MODALITY ---
  {
    id: 'adv-shrimp-squat',
    name: 'Adv. Shrimp Squat',
    level: 4,
    sets: 3,
    reps: 8,
    description: 'Hold back foot with both hands. Knee touches ground.',
    category: ExerciseCategoryEnum.enum.legs,
    exerciseType: ExerciseTypeEnum.enum.CALISTHENICS,
    prerequisites: [], // No direct calisthenic parent in this specific sub-tree?
    // Actually it technically follows normal shrimp squat but for this demo:
    crossPrerequisites: [
      {
        exerciseId: 'back-squat',
        metric: '1rm_bw_ratio',
        threshold: 1.5,
      },
    ],
  },
]
