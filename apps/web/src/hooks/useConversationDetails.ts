import { useState, useEffect } from 'react'
import { doc, onSnapshot, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Conversation, User } from '@repo/shared'

interface ConversationWithOtherUser extends Conversation {
  otherUser?: User
}

export function useConversationDetails(
  conversationId: string | null,
  currentUserId: string | null
) {
  const [conversation, setConversation] = useState<ConversationWithOtherUser | null>(null)
  const [otherUser, setOtherUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!conversationId || !currentUserId) {
      setConversation(null)
      setOtherUser(null)
      return
    }

    setLoading(true)
    setError(null)

    // 1. Subscribe to the Conversation document
    const convRef = doc(db, 'conversations', conversationId)

    const unsubscribe = onSnapshot(
      convRef,
      async convSnapshot => {
        try {
          if (!convSnapshot.exists()) {
            setError('Conversation not found')
            setLoading(false)
            return
          }

          const convData = { id: convSnapshot.id, ...convSnapshot.data() } as Conversation
          setConversation(convData)

          // 2. Hydrate "Other User" info
          const otherUserId = convData.participants?.find(uid => uid !== currentUserId)

          if (otherUserId) {
            try {
              const userRef = doc(db, 'users', otherUserId)
              const userSnap = await getDoc(userRef)

              if (userSnap.exists()) {
                setOtherUser({ uid: userSnap.id, ...userSnap.data() } as User)
              }
            } catch (userPermError: any) {
              // Graceful fallback if security rules block user profile reading
              console.warn('Permission blocked for other user profile info:', userPermError.message)
              setOtherUser({ id: otherUserId, displayName: 'Athlete' } as any)
            }
          }

          setLoading(false)
        } catch (err: any) {
          console.error('Error processing conversation data:', err)
          setError(err.message)
          setLoading(false)
        }
      },
      err => {
        console.error('Subscription error:', err)
        setError('Missing permissions to view this chat.')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [conversationId, currentUserId])

  return { conversation, otherUser, loading, error }
}
