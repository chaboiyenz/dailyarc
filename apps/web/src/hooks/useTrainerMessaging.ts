import { useCallback } from 'react'
import { useAuth } from './useAuth'
import { getOrCreateConversation } from '@/lib/conversations'
import type { User } from '@repo/shared'

/**
 * Hook for trainer/trainee messaging integration
 * Allows opening conversations from dashboard with getOrCreateConversation
 */
export function useTrainerMessaging() {
  const { user, profile } = useAuth()

  const openOrCreateConversation = useCallback(
    async (otherUser: User): Promise<string | null> => {
      if (!user || !profile) {
        console.error('User not authenticated')
        return null
      }

      try {
        const conversationId = await getOrCreateConversation(profile, otherUser)
        return conversationId
      } catch (error) {
        console.error('Failed to open/create conversation:', error)
        return null
      }
    },
    [user, profile]
  )

  return { openOrCreateConversation }
}
