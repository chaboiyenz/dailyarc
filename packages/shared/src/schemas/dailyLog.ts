import { z } from 'zod'

export const DailyLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.date(), // Or timestamp, usually Firestore returns Timestamp but we use Date in app
  sleepQuality: z.number().min(1).max(10), // 1-10
  stressLevel: z.number().min(1).max(10), // 1-10
  soreness: z.number().min(1).max(10), // 1-10
  fatigue: z.number().min(0).max(100), // 0-100%
  readiness: z.number().optional(), // Calculated field
  notes: z.string().optional(),
})

export type DailyLog = z.infer<typeof DailyLogSchema>
