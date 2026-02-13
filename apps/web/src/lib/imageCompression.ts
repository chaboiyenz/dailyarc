/**
 * Compress image/video file to Base64 string
 * Images: JPEG quality 0.7, max 600px width
 * Videos: Kept as-is (Base64 videos are large, user's choice)
 */

export interface CompressionResult {
  success: boolean
  base64?: string
  originalSize: number
  compressedSize: number
  error?: string
}

export async function compressImage(
  file: File,
  onProgress?: (progress: number) => void
): Promise<CompressionResult> {
  const originalSize = file.size

  try {
    // Videos: convert directly to Base64 (no compression)
    if (file.type.startsWith('video/')) {
      onProgress?.(50)
      const base64 = await fileToBase64(file)
      onProgress?.(100)
      return {
        success: true,
        base64,
        originalSize,
        compressedSize: base64.length,
      }
    }

    // Images: compress via canvas
    if (file.type.startsWith('image/')) {
      return await compressImageFile(file, originalSize, onProgress)
    }

    return {
      success: false,
      originalSize,
      compressedSize: 0,
      error: 'Unsupported file type. Use images or videos.',
    }
  } catch (error) {
    console.error('Compression error:', error)
    return {
      success: false,
      originalSize,
      compressedSize: 0,
      error: 'Failed to process file',
    }
  }
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function compressImageFile(
  file: File,
  originalSize: number,
  onProgress?: (progress: number) => void
): Promise<CompressionResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      onProgress?.(40)

      const img = new Image()
      img.onload = () => {
        try {
          // Calculate new dimensions (max 600px width, maintain aspect)
          const MAX_WIDTH = 600
          let width = img.width
          let height = img.height

          if (width > MAX_WIDTH) {
            height = (height * MAX_WIDTH) / width
            width = MAX_WIDTH
          }

          // Create canvas and compress
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          if (!ctx) throw new Error('Could not get canvas context')

          ctx.drawImage(img, 0, 0, width, height)

          onProgress?.(70)

          // Convert to Base64 with 70% quality
          const base64 = canvas.toDataURL('image/jpeg', 0.7)
          const compressedSize = base64.length

          onProgress?.(100)

          // Check if compressed size is reasonable (< 500KB Base64)
          const compressedKB = compressedSize / 1024
          if (compressedKB > 500) {
            return resolve({
              success: false,
              originalSize,
              compressedSize,
              error: `Compressed image too large (${Math.round(compressedKB)}KB). Try a smaller image.`,
            })
          }

          resolve({
            success: true,
            base64,
            originalSize,
            compressedSize,
          })
        } catch (error) {
          console.error('Canvas compression error:', error)
          resolve({
            success: false,
            originalSize,
            compressedSize: 0,
            error: 'Failed to compress image',
          })
        }
      }

      img.onerror = () => {
        resolve({
          success: false,
          originalSize,
          compressedSize: 0,
          error: 'Failed to load image',
        })
      }

      img.src = reader.result as string
    }

    reader.onerror = () => {
      resolve({
        success: false,
        originalSize,
        compressedSize: 0,
        error: 'Failed to read file',
      })
    }

    reader.readAsDataURL(file)
  })
}
