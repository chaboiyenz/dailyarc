import { z } from 'zod'

export const TrainingModeEnum = z.enum(['bodyweight', 'iron', 'cardio', 'hybrid'])
export type TrainingMode = z.infer<typeof TrainingModeEnum>

// Trainer approval status
export const TrainerStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED'])
export type TrainerStatus = z.infer<typeof TrainerStatusEnum>

/**
 * UserSchema defines the structure of a DailyArc user.
 * It is used for both Trainees and Trainers.
 */
export const UserSchema = z.object({
  uid: z.string().describe('Firebase Auth UID'),
  email: z.string().email(),
  displayName: z.string().min(1, 'Name is required'),
  // Optional photoURL for future profile pictures
  photoURL: z.string().url().nullable().optional(),
  avatarUrl: z.string().url().optional().describe('Profile avatar URL'),
  bio: z.string().max(160).optional().describe('User bio for social viewing'),

  // Role is null until onboarding is complete
  role: z.enum(['TRAINEE', 'TRAINER', 'ADMIN']).nullable(),
  /** Optional trainer ID for trainees */
  trainerId: z.string().optional(),

  onboardingComplete: z.boolean().default(false),

  // Trainer approval status (only relevant if role === 'TRAINER')
  trainerStatus: TrainerStatusEnum.default('PENDING').describe(
    'Trainer approval status: PENDING, APPROVED, or REJECTED'
  ),

  // Trainer certification - Base64 encoded certificate file
  certificationUrl: z
    .string()
    .optional()
    .describe('Base64-encoded certification document for trainers'),

  // Fitness-specific fields
  fitnessGoals: z
    .array(z.string())
    .default([])
    .describe('e.g. Hypertrophy, Endurance, Strength, Fat Loss'),

  bodyStats: z
    .object({
      weight: z.number().optional().describe('Weight in kg or lbs based on unitPreference'),
      height: z.number().optional().describe('Height in cm or inches'),
      bodyFat: z.number().optional().describe('Body fat percentage'),
      dob: z.string().optional().describe('Date of birth YYYY-MM-DD'),
      gender: z.enum(['male', 'female', 'other']).optional(),
    })
    .default({}),

  unitPreference: z.enum(['metric', 'imperial']).default('metric'),
  isPublicProfile: z.boolean().default(false).describe('Visibility in community search'),

  cardioStats: z
    .object({
      run5k: z.number().optional(), // Time in seconds
      run10k: z.number().optional(),
      vo2Max: z.number().optional(),
    })
    .default({}),

  trainingMode: TrainingModeEnum.default('bodyweight'),

  // Using z.any() for Firestore Timestamps to avoid environment conflicts
  // It will be a Firestore Timestamp object in the app
  createdAt: z.any().optional(),

  inventory: z.array(z.string()).default([]),

  // Performance and Progression
  currentPushupLevel: z.number().default(0),
  powerliftingStats: z
    .object({
      squat: z.number().optional(),
      bench: z.number().optional(),
      deadlift: z.number().optional(),
    })
    .default({}),
})

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, 'Name is required'),
})

export type CreateUser = z.infer<typeof CreateUserSchema>

export type User = z.infer<typeof UserSchema>
