import { z } from 'zod'

/**
 * Message Schema - Private coach-client messaging
 * Supports contextual feedback anchored to workouts/meals
 */
export const MessageSchema = z.object({
  /** Document ID */
  id: z.string(),
  /** Participants (trainee + trainer UIDs) */
  participants: z.array(z.string()).length(2),
  /** Sender user ID */
  senderId: z.string(),
  /** Sender display name (denormalized) */
  senderName: z.string(),
  /** Message content */
  text: z.string().min(1).max(1000),
  /** Optional context reference (anchored to workout/meal) */
  contextRef: z
    .object({
      type: z.enum(['workout', 'meal', 'arc']),
      id: z.string(),
      label: z.string().optional(), // e.g., "Standard Pushups - Jan 15"
    })
    .optional(),
  /** Whether message has been read by recipient */
  read: z.boolean().default(false),
  /** Timestamp when created */
  createdAt: z.any(), // Firestore Timestamp
})

export type Message = z.infer<typeof MessageSchema>

/**
 * Input schema for sending a new message
 */
export const SendMessageInputSchema = z.object({
  recipientId: z.string(),
  text: z.string().min(1).max(1000),
  contextRef: z
    .object({
      type: z.enum(['workout', 'meal', 'arc']),
      id: z.string(),
      label: z.string().optional(),
    })
    .optional(),
})

export type SendMessageInput = z.infer<typeof SendMessageInputSchema>

/**
 * Conversation Schema - Represents a message thread between two users
 * Used for listing conversations in the inbox
 */
export const ConversationSchema = z.object({
  /** Document ID */
  id: z.string(),
  /** Participants (trainee + trainer UIDs) */
  participants: z.array(z.string()).length(2),
  /** Last message preview */
  lastMessage: z.string(),
  /** Last message timestamp */
  lastMessageAt: z.any(), // Firestore Timestamp
  /** Count of unread messages for current user */
  unreadCount: z.number().int().min(0).default(0),
  /** Other participant's name */
  otherParticipantName: z.string(),
  /** Other participant's ID */
  otherParticipantId: z.string(),
  /** Other participant's role (for display) */
  otherParticipantRole: z.enum(['TRAINEE', 'TRAINER', 'ADMIN']).optional(),
})

export type Conversation = z.infer<typeof ConversationSchema>
