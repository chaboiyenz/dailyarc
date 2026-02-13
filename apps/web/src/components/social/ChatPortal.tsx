import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useConversations } from '@/hooks/useSocial'
import { useAllUsers } from '@/hooks/useAllUsers'
import { useTrainerMessaging } from '@/hooks/useTrainerMessaging'
import ChatWindow from './ChatWindow'
import type { User } from '@repo/shared'

export default function ChatPortal() {
  const { user, profile } = useAuth()
  const { conversations, error: convError } = useConversations(user?.uid || null)
  const { users } = useAllUsers(user?.uid || null)
  const { openOrCreateConversation } = useTrainerMessaging()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  // Auto-select first conversation if available and none selected
  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id)
    }
  }, [conversations, selectedConversationId])

  const handleStartConversation = async (otherUser: User) => {
    setIsCreatingConversation(true)
    setCreateError(null)
    try {
      const conversationId = await openOrCreateConversation(otherUser)
      if (conversationId) {
        setSelectedConversationId(conversationId)
      } else {
        setCreateError('Failed to create conversation')
      }
    } catch (error) {
      console.error('Failed to start conversation:', error)
      setCreateError('Error creating conversation. Check permissions.')
    } finally {
      setIsCreatingConversation(false)
    }
  }

  if (!user || !profile) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full gap-0 bg-slate-950">
      {/* Message List Sidebar */}
      <div className="w-72 flex-shrink-0 overflow-hidden border-r border-slate-800 flex flex-col">
        {/* Error Banner */}
        {(convError || createError) && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-3 py-2 text-xs text-red-400">
            {convError || createError}
          </div>
        )}

        {/* Conversations Section */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="border-b border-slate-800 px-4 py-3">
            <h2 className="text-lg font-bold text-white">Messages</h2>
          </div>

          {conversations.length > 0 ? (
            <div className="flex-1 overflow-y-auto">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversationId(conv.id)}
                  className={`w-full border-b border-slate-800 px-4 py-3 text-left transition-colors ${
                    selectedConversationId === conv.id
                      ? 'bg-slate-800'
                      : 'hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-600 text-white font-semibold text-sm flex-shrink-0">
                      {(conv.otherParticipantName || 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white truncate">
                          {conv.otherParticipantName || 'Unknown'}
                        </p>
                        {/* Role Badge */}
                        {conv.otherParticipantRole === 'TRAINER' ? (
                          <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-300 font-medium flex-shrink-0">
                            Trainer
                          </span>
                        ) : conv.otherParticipantRole === 'TRAINEE' ? (
                          <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-300 font-medium flex-shrink-0">
                            Trainee
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-slate-400">
                        {conv.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <p className="text-sm text-slate-400 text-center">No conversations yet. Start one below!</p>
            </div>
          )}
        </div>

        {/* Users Section */}
        <div className="border-t border-slate-800 flex flex-col max-h-[40%]">
          <div className="px-4 py-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-300">Start a Chat</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {users.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">No users available</div>
            ) : (
              users.map(user => (
                <button
                  key={user.uid}
                  onClick={() => handleStartConversation(user)}
                  disabled={isCreatingConversation}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-800/50 transition-colors disabled:opacity-50 border-b border-slate-800/50"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600 text-white font-semibold text-xs flex-shrink-0">
                      {(user.displayName || 'U')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-white truncate">{user.displayName}</p>
                      <p className="text-xs text-slate-500 truncate">{user.role}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 overflow-hidden bg-slate-950">
        {selectedConversationId ? (
          <ChatWindow
            conversationId={selectedConversationId}
            currentUserId={user.uid}
            currentUser={profile}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-300 mb-2">No conversation selected</p>
              <p className="text-sm text-slate-400">
                {conversations.length === 0
                  ? 'Click a user to start a conversation'
                  : 'Click a conversation or user to start messaging'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
