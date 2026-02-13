import { useState, useEffect } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Comment } from '@repo/shared'

export interface CommentInput {
  userId: string
  userName: string
  userRole: 'TRAINEE' | 'TRAINER'
  content: string
}

export function useComments(postId: string | null) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!postId) {
      setComments([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Explicitly target the sub-collection path
      const commentsRef = collection(db, 'posts', postId, 'comments')
      const q = query(commentsRef, orderBy('createdAt', 'asc'))

      const unsubscribe = onSnapshot(
        q,
        snapshot => {
          const newComments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          })) as Comment[]
          setComments(newComments)
          setLoading(false)
          setError(null)
        },
        (err: Error) => {
          console.error('Error fetching comments:', err)
          // Gracefully handle permission errors
          const firebaseError = err as { code?: string }
          if (firebaseError.code === 'permission-denied') {
            setError('You do not have permission to view these comments')
          } else if (firebaseError.code === 'not-found') {
            setError('Post not found')
          } else {
            setError('Failed to load comments')
          }
          setLoading(false)
        }
      )

      return () => unsubscribe()
    } catch (err) {
      console.error('Error setting up comments listener:', err)
      setError('Failed to initialize comments')
      setLoading(false)
    }
  }, [postId])

  const addComment = async (input: CommentInput): Promise<boolean> => {
    if (!postId) {
      setError('No post selected')
      return false
    }

    try {
      setError(null)
      // Explicitly target the sub-collection and sanitize input
      const commentsRef = collection(db, 'posts', postId, 'comments')
      const sanitizedData = {
        userId: input.userId ?? '',
        userName: input.userName ?? 'Anonymous',
        userRole: input.userRole ?? 'TRAINEE',
        content: input.content,
        createdAt: serverTimestamp(),
      }
      await addDoc(commentsRef, sanitizedData)
      return true
    } catch (err) {
      console.error('Error adding comment:', err)
      // Gracefully handle specific error types
      const error = err as { code?: string }
      if (error.code === 'permission-denied') {
        setError('You do not have permission to comment on this post')
      } else if (error.code === 'not-found') {
        setError('Post not found')
      } else {
        setError('Failed to post comment')
      }
      return false
    }
  }

  const deleteComment = async (commentId: string): Promise<boolean> => {
    if (!postId) {
      setError('No post selected')
      return false
    }

    try {
      setError(null)
      // Explicitly target the sub-collection document
      const commentRef = doc(db, 'posts', postId, 'comments', commentId)
      await deleteDoc(commentRef)
      return true
    } catch (err) {
      console.error('Error deleting comment:', err)
      // Gracefully handle specific error types
      const error = err as { code?: string }
      if (error.code === 'permission-denied') {
        setError('You do not have permission to delete this comment')
      } else if (error.code === 'not-found') {
        setError('Comment not found')
      } else {
        setError('Failed to delete comment')
      }
      return false
    }
  }

  const deleteAllComments = async (): Promise<boolean> => {
    if (!postId) return false

    try {
      const snapshot = await getDocs(collection(db, 'posts', postId, 'comments'))
      const batch = writeBatch(db)

      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref)
      })

      await batch.commit()
      return true
    } catch (err) {
      console.error('Error deleting all comments:', err)
      return false
    }
  }

  return {
    comments,
    loading,
    error,
    addComment,
    deleteComment,
    deleteAllComments,
  }
}
