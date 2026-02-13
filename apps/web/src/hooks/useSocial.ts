import { useState, useEffect } from 'react'
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  where,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { deletePostMedia } from '@/lib/storage'
import type {
  Post,
  CreatePostInput,
  Message,
  SendMessageInput,
  Conversation,
  User,
} from '@repo/shared'

export function useFeed() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(20))

    const unsubscribe = onSnapshot(q, snapshot => {
      const newPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[]
      setPosts(newPosts)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const createPost = async (input: CreatePostInput, user: User) => {
    if (!user) return

    // Build post data, excluding undefined fields
    const postData: Record<string, unknown> = {
      userId: user.uid,
      authorName: user.displayName || 'Anonymous',
      userRole: user.role,
      content: input.content,
      mediaType: input.mediaType || 'none',
      likes: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    // Only add mediaUrl if it has a value
    if (input.mediaUrl) {
      postData.mediaUrl = input.mediaUrl
    }

    // Add optional fields if they exist
    if (input.type) {
      postData.type = input.type
    }
    if (input.contextRef) {
      postData.contextRef = input.contextRef
    }

    await addDoc(collection(db, 'posts'), postData)
  }

  const toggleLike = async (postId: string, userId: string, currentLikes: string[]) => {
    const postRef = doc(db, 'posts', postId)
    const isLiked = currentLikes.includes(userId)

    await updateDoc(postRef, {
      likes: isLiked ? arrayRemove(userId) : arrayUnion(userId),
    })
  }

  const deletePost = async (postId: string, mediaUrl?: string) => {
    // Delete media from Storage if exists
    if (mediaUrl) {
      await deletePostMedia(mediaUrl)
    }

    // Delete Firestore document
    await deleteDoc(doc(db, 'posts', postId))
  }

  const updatePost = async (postId: string, content: string) => {
    const postRef = doc(db, 'posts', postId)
    await updateDoc(postRef, {
      content,
      updatedAt: serverTimestamp(),
    })
  }

  // Deprecated: Use useComments hook instead for sub-collection comments
  const addComment = async () => {
    console.warn('useFeed.addComment is deprecated. Use useComments hook instead.')
  }

  return { posts, loading, createPost, toggleLike, deletePost, updatePost, addComment }
}

interface OptimisticMessage extends Message {
  _optimistic?: boolean
  _sending?: boolean
}

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<OptimisticMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    )

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const newMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          _optimistic: false,
          _sending: false,
        })) as OptimisticMessage[]

        setMessages(newMessages)
        setLoading(false)
      },
      error => {
        console.error('Failed to load messages:', error)
        setError('Unable to load messages. Check permissions.')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [conversationId])

  const sendMessage = async (conversationId: string, input: SendMessageInput, sender: User) => {
    // Create optimistic message
    const tempId = `temp-${Date.now()}`
    const now = new Date()
    const optimisticMsg: OptimisticMessage = {
      id: tempId,
      participants: [sender.uid, ''],
      senderId: sender.uid,
      senderName: sender.displayName,
      text: input.text,
      contextRef: input.contextRef || undefined,
      read: false,
      createdAt: { toDate: () => now } as unknown as typeof optimisticMsg.createdAt,
      _optimistic: true,
      _sending: true,
    }

    // Add optimistic message immediately
    setMessages(prev => [...prev, optimisticMsg])

    try {
      // Build message data - only include defined fields to prevent undefined crashes
      const messageData: Record<string, unknown> = {
        senderId: sender.uid,
        senderName: sender.displayName,
        text: input.text,
        read: false,
        createdAt: serverTimestamp(),
      }

      // Only add contextRef if provided (Firestore accepts null but not undefined)
      if (input.contextRef) {
        messageData.contextRef = input.contextRef
      }

      // Send to Firestore
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), messageData)

      // Update conversation last message
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: input.text,
        lastMessageAt: serverTimestamp(),
      })

      // Remove temp message - real one comes from onSnapshot
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } catch (error) {
      console.error('Failed to send message:', error)
      // Remove failed message
      setMessages(prev => prev.filter(m => m.id !== tempId))
      throw error
    }
  }

  return { messages, loading, error, sendMessage }
}

export function useConversations(userId: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setConversations([])
      setError(null)
      return
    }

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const convs = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            ...data,
          } as unknown as Conversation
        })
        setConversations(convs)
        setError(null)
      },
      error => {
        console.error('Failed to load conversations:', error)
        setError('Unable to load conversations. Check permissions.')
        setConversations([])
      }
    )

    return () => unsubscribe()
  }, [userId])

  return { conversations, error }
}
