import { useCallback, useState } from 'react'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/lib/firebase'

export function useAvatarUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const uploadAvatar = useCallback(async (uid: string, file: File): Promise<string> => {
    setUploading(true)
    setError(null)

    try {
      // Validate file
      if (!file) {
        throw new Error('No file selected')
      }

      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB')
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image')
      }

      // Upload to Firebase Storage at avatars/{uid}
      const storageRef = ref(storage, `avatars/${uid}`)
      await uploadBytes(storageRef, file)

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef)
      return downloadURL
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Upload failed')
      setError(error)
      throw error
    } finally {
      setUploading(false)
    }
  }, [])

  const deleteAvatar = useCallback(async (uid: string): Promise<void> => {
    setUploading(true)
    setError(null)

    try {
      const storageRef = ref(storage, `avatars/${uid}`)
      await deleteObject(storageRef)
    } catch (err) {
      // Ignore "file not found" errors
      const error = err instanceof Error ? err : new Error('Delete failed')
      if (!error.message.includes('not-found')) {
        setError(error)
        throw error
      }
    } finally {
      setUploading(false)
    }
  }, [])

  return {
    uploadAvatar,
    deleteAvatar,
    uploading,
    error,
  }
}
