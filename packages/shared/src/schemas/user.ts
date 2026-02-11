import { z } from 'zod'

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

  // Role is null until onboarding is complete
  role: z.enum(['TRAINEE', 'TRAINER']).nullable(),
  /** Optional trainer ID for trainees */
  trainerId: z.string().optional(),

  onboardingComplete: z.boolean().default(false),

  // Inventory logic (Shopping List/Pantry)
  inventory: z.array(z.string()).default([]),

  // Stats for workout logic
  stats: z
    .object({
      currentPushupLevel: z.number().default(0),
      weight: z.number().default(0), // in kg
    })
    .default({}),

  // Using z.any() for Firestore Timestamps to avoid environment conflicts
  // It will be a Firestore Timestamp object in the app
  createdAt: z.any().optional(),
})

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, 'Name is required'),
})

export type CreateUser = z.infer<typeof CreateUserSchema>

export type User = z.infer<typeof UserSchema>
