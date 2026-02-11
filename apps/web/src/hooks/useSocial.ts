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
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
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

    await addDoc(collection(db, 'posts'), {
      ...input,
      userId: user.uid,
      authorName: user.displayName || 'Anonymous',
      userRole: user.role,
      likes: [],
      commentCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  const toggleLike = async (postId: string, userId: string, currentLikes: string[]) => {
    const postRef = doc(db, 'posts', postId)
    const isLiked = currentLikes.includes(userId)

    await updateDoc(postRef, {
      likes: isLiked ? arrayRemove(userId) : arrayUnion(userId),
    })
  }

  return { posts, loading, createPost, toggleLike }
}

export function useMessages(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      return
    }

    setLoading(true)
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc')
    )

    const unsubscribe = onSnapshot(q, snapshot => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[]
      setMessages(newMessages)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [conversationId])

  const sendMessage = async (conversationId: string, input: SendMessageInput, sender: any) => {
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
      senderId: sender.uid,
      senderName: sender.displayName,
      text: input.text,
      contextRef: input.contextRef,
      read: false,
      createdAt: serverTimestamp(),
    })

    // Update conversation last message
    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessage: input.text,
      lastMessageAt: serverTimestamp(),
      // Increment unread count logic would go here
    })
  }

  return { messages, loading, sendMessage }
}

export function useConversations(userId: string | null) {
  const [conversations, setConversations] = useState<Conversation[]>([])

  useEffect(() => {
    if (!userId) return

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('lastMessageAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, snapshot => {
      const convs = snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
        } as unknown as Conversation
      })
      setConversations(convs)
    })

    return () => unsubscribe()
  }, [userId])

  return { conversations }
}
