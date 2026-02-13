import { formatDistanceToNow } from 'date-fns'
import type { Conversation } from '@repo/shared'

interface MessageListProps {
  conversations: Conversation[]
  selectedConversationId: string | null
  onSelectConversation: (conversationId: string) => void
}

export default function MessageList({
  conversations,
  selectedConversationId,
  onSelectConversation,
}: MessageListProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-slate-900 border-r border-slate-800">
      {/* Header */}
      <div className="border-b border-slate-800 px-4 py-3">
        <h2 className="text-lg font-bold text-white">Messages</h2>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-slate-400">No active conversations</p>
          </div>
        ) : (
          conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={`w-full border-b border-slate-800 px-4 py-3 text-left transition-colors ${
                selectedConversationId === conv.id
                  ? 'bg-slate-800'
                  : 'hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-600 text-white font-semibold text-sm flex-shrink-0">
                  {(conv.otherParticipantName || 'U')[0].toUpperCase()}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-white truncate">
                      {conv.otherParticipantName || 'Unknown'}
                    </p>
                    {conv.lastMessageAt && (
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        {formatDistanceToNow(conv.lastMessageAt.toDate(), {
                          addSuffix: false,
                        })}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-slate-400">
                    {conv.lastMessage || 'No messages yet'}
                  </p>
                </div>

                {/* Unread indicator */}
                {conv.unreadCount > 0 && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-600 text-xs font-bold text-white flex-shrink-0">
                    {conv.unreadCount}
                  </div>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
