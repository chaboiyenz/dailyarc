import { useEffect } from 'react'
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

const CLEANUP_STORAGE_KEY = 'lastCommunityCleanup'
const CLEANUP_INTERVAL_DAYS = 1 // Run at most once per day

/**
 * Hook to automatically clean up posts older than 30 days
 * Runs on component mount, but only once per day (via localStorage)
 * Silently fails to avoid disrupting UI
 */
export function useCommunityCleanup() {
  useEffect(() => {
    const runCleanup = async () => {
      try {
        // Check if cleanup ran recently
        const lastCleanup = localStorage.getItem(CLEANUP_STORAGE_KEY)
        const now = Date.now()

        if (lastCleanup) {
          const lastCleanupTime = parseInt(lastCleanup, 10)
          const daysSinceCleanup = (now - lastCleanupTime) / (1000 * 60 * 60 * 24)

          if (daysSinceCleanup < CLEANUP_INTERVAL_DAYS) {
            return // Skip cleanup if ran recently
          }
        }

        // Calculate 30 days ago
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const thirtyDaysAgoTimestamp = Timestamp.fromDate(thirtyDaysAgo)

        // Query posts older than 30 days
        const postsRef = collection(db, 'posts')
        const q = query(postsRef, where('createdAt', '<', thirtyDaysAgoTimestamp))
        const snapshot = await getDocs(q)

        // Delete each old post and its comments
        let deletedCount = 0
        for (const postDoc of snapshot.docs) {
          try {
            // Delete comments sub-collection
            const commentsRef = collection(db, 'posts', postDoc.id, 'comments')
            const commentsSnapshot = await getDocs(commentsRef)

            for (const commentDoc of commentsSnapshot.docs) {
              await deleteDoc(commentDoc.ref)
            }

            // Delete the post
            await deleteDoc(postDoc.ref)
            deletedCount++
          } catch (error) {
            console.error(`Failed to delete post ${postDoc.id}:`, error)
            // Continue deleting other posts
          }
        }

        if (deletedCount > 0) {
          console.log(`Community cleanup: deleted ${deletedCount} old posts`)
        }

        // Mark cleanup as complete
        localStorage.setItem(CLEANUP_STORAGE_KEY, now.toString())
      } catch (error) {
        console.error('Community cleanup error:', error)
        // Silently fail - don't disrupt user experience
      }
    }

    // Run cleanup immediately on mount
    runCleanup()
  }, [])
}
