import { z } from 'zod'

/**
 * Post Schema - Community feed posts for Arc Progress sharing
 * Supports text, images, and milestone celebrations
 */
export const PostSchema = z.object({
  /** Document ID */
  id: z.string(),
  /** Author user ID */
  userId: z.string(),
  /** Author display name (denormalized) */
  authorName: z.string(),
  /** Author role (denormalized for badge display) */
  userRole: z.enum(['TRAINEE', 'TRAINER']),
  /** Post content (text) */
  content: z.string().min(1).max(500),
  /** Optional media URL from Firebase Storage */
  mediaUrl: z.string().url().optional(),
  /** Media type */
  mediaType: z.enum(['image', 'video', 'none']).default('none'),
  /** Array of user IDs who liked this post */
  likes: z.array(z.string()).default([]),
  /** @deprecated Comments are now stored in sub-collection posts/{postId}/comments */
  comments: z
    .array(z.lazy(() => CommentSchema))
    .default([])
    .optional(),
  /** Post type for filtering and display */
  type: z.enum(['milestone', 'workout', 'meal', 'general']).default('general'),
  /** Optional context reference (e.g., workout ID, exercise ID) */
  contextRef: z
    .object({
      type: z.enum(['workout', 'meal', 'exercise', 'achievement']),
      id: z.string(),
    })
    .optional(),
  /** Timestamp when created */
  createdAt: z.any(), // Firestore Timestamp
  /** Timestamp when last updated */
  updatedAt: z.any(), // Firestore Timestamp
})

export type Post = z.infer<typeof PostSchema>

/**
 * Input schema for creating a new post
 */
export const CreatePostInputSchema = z.object({
  content: z.string().min(1).max(500),
  mediaUrl: z.string().optional(),
  mediaType: z.enum(['image', 'video', 'none']).default('none'),
  type: z.enum(['milestone', 'workout', 'meal', 'general']).default('general'),
  contextRef: z
    .object({
      type: z.enum(['workout', 'meal', 'exercise', 'achievement']),
      id: z.string(),
    })
    .optional(),
})

export type CreatePostInput = z.infer<typeof CreatePostInputSchema>

export const CommentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  userRole: z.enum(['TRAINEE', 'TRAINER']),
  content: z.string().min(1).max(500),
  createdAt: z.any(), // Firestore Timestamp
})

export type Comment = z.infer<typeof CommentSchema>
