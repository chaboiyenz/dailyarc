import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Upload media file to Firebase Storage for community posts
 * @param file - Image or video file
 * @param userId - User ID for folder organization
 * @param onProgress - Optional progress callback (0-100)
 * @returns Upload result with URL or error
 */
export async function uploadPostMedia(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  try {
    // Validate file type
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      return { success: false, error: 'Only images and videos are supported' }
    }

    // Validate file size
    const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024 // 10MB for images, 50MB for videos
    if (file.size > maxSize) {
      return {
        success: false,
        error: `File too large. Max size: ${isImage ? '10MB' : '50MB'}`,
      }
    }

    // Generate unique path
    const timestamp = Date.now()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const path = `posts/${userId}/${timestamp}_${sanitizedName}`
    const storageRef = ref(storage, path)

    // Upload with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, file)

    return new Promise(resolve => {
      uploadTask.on(
        'state_changed',
        snapshot => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          onProgress?.(Math.round(progress))
        },
        error => {
          console.error('Upload error:', error)
          // Graceful degradation - allow text-only post
          resolve({ success: false, error: 'Storage unavailable - post as text only' })
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
            resolve({ success: true, url: downloadURL })
          } catch (error) {
            console.error('Error getting download URL:', error)
            resolve({ success: false, error: 'Failed to retrieve media URL' })
          }
        }
      )
    })
  } catch (error) {
    console.error('Upload initialization error:', error)
    return { success: false, error: 'Storage service unavailable' }
  }
}

/**
 * Delete media file from Firebase Storage
 * @param mediaUrl - Full download URL from Firebase Storage
 */
export async function deletePostMedia(mediaUrl: string): Promise<void> {
  try {
    // Extract path from URL
    const url = new URL(mediaUrl)
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/)
    if (!pathMatch) {
      console.warn('Could not extract path from media URL:', mediaUrl)
      return
    }

    const path = decodeURIComponent(pathMatch[1])
    const storageRef = ref(storage, path)
    await deleteObject(storageRef)
    console.log('Deleted media:', path)
  } catch (error) {
    console.error('Error deleting media:', error)
    // Don't throw - post deletion should succeed even if media cleanup fails
  }
}

/**
 * Get media type from file
 */
export function getMediaType(file: File): 'image' | 'video' | 'none' {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return 'none'
}
