import { useState, useRef } from 'react'
import { X, Image as ImageIcon, Loader2 } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@repo/ui'
import { compressImage } from '@/lib/imageCompression'
import { getMediaType } from '@/lib/storage'
import { validatePostContent } from '@repo/shared'
import type { CreatePostInput } from '@repo/shared'

interface NewPostModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (input: CreatePostInput) => Promise<void>
}

export default function NewPostModal({ isOpen, onClose, onSubmit }: NewPostModalProps) {
  const [content, setContent] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Use a Ref to trigger the hidden file input reliably
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Basic file size check (10MB limit for better UX)
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Please select a file under 10MB.')
      return
    }

    setSelectedFile(file)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = () => setPreviewUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async () => {
    const validation = validatePostContent(content, !!selectedFile)
    if (!validation.valid) {
      setError(validation.error || 'Invalid content')
      return
    }

    setUploading(true)
    setError(null)

    try {
      let mediaUrl: string | null = null
      let mediaType: 'image' | 'video' | 'none' = 'none'

      if (selectedFile) {
        // Compress image/video to Base64
        const result = await compressImage(selectedFile, progress => {
          setUploadProgress(progress)
        })

        if (!result.success) {
          setError(result.error || 'Failed to process media')
          setUploading(false)
          return
        }

        mediaUrl = result.base64 || null
        const detectedType = getMediaType(selectedFile)
        mediaType = detectedType === 'image' || detectedType === 'video' ? detectedType : 'none'
      }

      await onSubmit({
        content,
        mediaUrl: mediaUrl || undefined,
        mediaType,
        type: 'general',
      })

      // Success cleanup
      setContent('')
      handleRemoveFile()
      setUploadProgress(0)
      onClose()
    } catch (err) {
      console.error('Post creation error:', err)
      setError('Failed to create post. Please check your connection.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-800 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Share Your Progress</DialogTitle>
          <DialogDescription className="text-slate-400 text-sm">
            Post an update to the community. You can add one photo or video.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <textarea
            className="w-full min-h-[120px] bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none transition-all"
            placeholder="What's on your mind? Share your journey..."
            value={content}
            onChange={e => setContent(e.target.value)}
            maxLength={500}
            disabled={uploading}
          />

          <div className="flex items-center justify-end text-[10px] uppercase tracking-widest text-slate-500 font-bold">
            <span>{content.length} / 500</span>
          </div>

          {/* Media Preview Area */}
          {previewUrl && (
            <div className="relative rounded-xl overflow-hidden bg-slate-800 border border-slate-700 group">
              {selectedFile?.type.startsWith('image/') ? (
                <img src={previewUrl} alt="Preview" className="w-full max-h-[300px] object-cover" />
              ) : (
                <video src={previewUrl} className="w-full max-h-[300px]" controls muted />
              )}
              <button
                className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/90 hover:bg-red-600 text-white shadow-lg transition-all"
                onClick={handleRemoveFile}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Progress Bar */}
          {uploading && uploadProgress > 0 && (
            <div className="space-y-2 animate-in fade-in duration-300">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-tighter">
                <span>Transmitting Data...</span>
                <span className="text-cyan-400">{uploadProgress}%</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="text-xs font-bold text-red-400 bg-red-500/10 rounded-lg p-3 border border-red-500/20">
              {error}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 border-slate-700 bg-slate-800/50 hover:bg-slate-800"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || !!selectedFile}
              >
                <ImageIcon className="h-4 w-4 text-cyan-400" />
                <span className="hidden sm:inline">Media</span>
              </Button>
            </div>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={uploading}
                className="text-slate-400 hover:text-slate-100"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={uploading || (!content.trim() && !selectedFile)}
                className="min-w-[100px] bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-lg shadow-cyan-900/20"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Post'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
