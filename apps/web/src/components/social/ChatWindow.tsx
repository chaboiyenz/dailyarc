import { useState, useEffect, useRef } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { useMessages } from '@/hooks/useSocial'
import { useConversationDetails } from '@/hooks/useConversationDetails'
import type { User } from '@repo/shared'

interface ChatWindowProps {
  conversationId: string
  currentUserId: string
  currentUser: User
}

export default function ChatWindow({
  conversationId,
  currentUserId,
  currentUser,
}: ChatWindowProps) {
  const { messages, loading, error, sendMessage } = useMessages(conversationId)
  const { otherUser } = useConversationDetails(conversationId, currentUserId)
  const [text, setText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!text.trim() || !currentUser || isSending) return

    setIsSending(true)
    setSendError(null)
    try {
      await sendMessage(
        conversationId,
        { text, recipientId: '' },
        currentUser
      )
      setText('')
    } catch (error) {
      console.error('Failed to send message:', error)
      setSendError('Failed to send message. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Error Banner */}
      {(error || sendError) && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 text-sm text-red-400">
          {error || sendError}
        </div>
      )}

      {/* Chat Header */}
      <div className="border-b border-slate-800 bg-slate-950 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-600 text-white font-semibold text-sm">
            {(otherUser?.displayName || 'U')[0].toUpperCase()}
          </div>

          {/* User Info */}
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">
              {otherUser?.displayName || 'Loading...'}
            </p>
            <div className="flex items-center gap-2 text-xs">
              {otherUser?.role === 'TRAINER' ? (
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium">
                  Trainer
                </span>
              ) : otherUser?.role === 'TRAINEE' ? (
                <span className="px-2 py-0.5 rounded bg-green-500/20 text-green-300 font-medium">
                  Trainee
                </span>
              ) : (
                <span className="text-slate-400">{otherUser?.role || 'User'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="text-xs text-slate-400">Online</span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto bg-slate-950 p-4 space-y-3">
        {loading && (
          <div className="flex justify-center py-8">
            <div className="text-sm text-slate-400">Loading messages...</div>
          </div>
        )}

        {messages.length === 0 && !loading && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-400">No messages yet. Start the conversation!</p>
          </div>
        )}

        {messages.map(msg => {
          const isMe = msg.senderId === currentUserId
          const isOptimistic = (msg as any)._optimistic

          return (
            <div
              key={msg.id}
              className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              {/* Avatar for recipient messages */}
              {!isMe && (
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-white font-semibold text-xs flex-shrink-0">
                  {(msg.senderName || 'U')[0].toUpperCase()}
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl ${
                  isMe
                    ? 'bg-cyan-600 text-white rounded-br-none'
                    : 'bg-slate-800 text-slate-100 rounded-bl-none'
                } ${isOptimistic ? 'opacity-70' : 'opacity-100'}`}
              >
                {/* Context ref if exists */}
                {msg.contextRef && (
                  <div className="mb-1 border-l-2 border-white/20 pl-2 text-xs opacity-75">
                    Re: {msg.contextRef.label || msg.contextRef.type}
                  </div>
                )}

                {/* Message text */}
                <p className="text-sm break-words">{msg.text}</p>

                {/* Timestamp */}
                <p className="mt-1 text-xs opacity-70 flex items-center gap-1 justify-end">
                  {msg.createdAt
                    ? formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: false })
                    : 'now'}
                  {isOptimistic && <span className="text-xs">∙ sending...</span>}
                </p>
              </div>

              {/* Avatar for my messages */}
              {isMe && (
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600 text-white font-semibold text-xs flex-shrink-0">
                  {(currentUser.displayName || 'Me')[0].toUpperCase()}
                </div>
              )}
            </div>
          )
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar with backdrop blur */}
      <div className="border-t border-slate-800 bg-slate-950/80 backdrop-blur-md">
        <div className="flex gap-2 p-4">
          <textarea
            className="flex-1 rounded-lg bg-slate-800 px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-600 resize-none"
            placeholder="Type a message..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            disabled={isSending}
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || isSending}
            className="px-6 py-2 rounded-lg bg-cyan-600 text-white font-semibold text-sm transition-all disabled:opacity-50 hover:bg-cyan-700 shadow-lg shadow-cyan-600/50 hover:shadow-cyan-600/70 disabled:shadow-none"
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  )
}
