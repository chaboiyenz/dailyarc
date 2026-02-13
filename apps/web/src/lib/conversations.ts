import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import type { User } from '@repo/shared'

/**
 * Get or create a conversation between two users
 * Used when trainer/trainee clicks to start messaging
 */
export async function getOrCreateConversation(
  currentUser: User,
  otherUser: User
): Promise<string> {
  // Query for existing conversation
  const q = query(
    collection(db, 'conversations'),
    where('participants', 'array-contains', currentUser.uid)
  )

  const snapshot = await getDocs(q)
  let conversationId: string | null = null

  // Check if any existing conversation includes both users
  snapshot.docs.forEach(doc => {
    const data = doc.data()
    if (
      Array.isArray(data.participants) &&
      data.participants.includes(otherUser.uid)
    ) {
      conversationId = doc.id
    }
  })

  // If exists, return it
  if (conversationId) {
    return conversationId
  }

  // Otherwise, create new conversation
  const newConvRef = await addDoc(collection(db, 'conversations'), {
    participants: [currentUser.uid, otherUser.uid],
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    unreadCount: 0,
    otherParticipantName: otherUser.displayName,
    otherParticipantId: otherUser.uid,
    otherParticipantRole: otherUser.role, // Store role for quick display
  })

  return newConvRef.id
}
