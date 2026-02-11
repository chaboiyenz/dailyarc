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
  /** Post content (text) */
  content: z.string().min(1).max(500),
  /** Optional image URL from Firebase Storage */
  imageUrl: z.string().url().optional(),
  /** Array of user IDs who liked this post */
  likes: z.array(z.string()).default([]),
  /** Number of comments (for display, actual comments in separate collection) */
  commentCount: z.number().int().min(0).default(0),
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
  imageUrl: z.string().url().optional(),
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
  content: z.string().min(1),
  createdAt: z.any(), // Firestore Timestamp
})

export type Comment = z.infer<typeof CommentSchema>
