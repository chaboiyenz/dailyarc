import { useState } from 'react'

export const useCloudinaryUpload = () => {
  const [isUploading, setIsUploading] = useState(false)
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  const uploadMedia = async (file: File) => {
    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      setIsUploading(false)
      return { url: data.secure_url, type: data.resource_type } // 'image' or 'video'
    } catch (error) {
      console.error('Cloudinary Upload Error:', error)
      setIsUploading(false)
      return null
    }
  }

  return { uploadMedia, isUploading }
}
