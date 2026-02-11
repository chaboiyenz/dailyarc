import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useConversations, useMessages } from '@/hooks/useSocial'
import { Card, CardContent, Button } from '@repo/ui'
import { formatDistanceToNow } from 'date-fns'

export default function ChatPortal() {
  const { user } = useAuth()
  const { conversations } = useConversations(user?.uid || null)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  // Auto-select first conversation if available and none selected
  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id)
    }
  }, [conversations, selectedConversationId])

  return (
    <div className="grid h-[calc(100vh-8rem)] gap-4 lg:grid-cols-3">
      {/* Sidebar / List */}
      <Card className="glass-card flex flex-col overflow-hidden lg:col-span-1">
        <div className="border-b border-border p-4">
          <h2 className="font-bold text-foreground">Comms</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">No active comms</div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversationId(conv.id)}
                className={`flex w-full flex-col gap-1 rounded-lg p-3 text-left transition-colors ${selectedConversationId === conv.id ? 'bg-[hsl(var(--primary)/0.1)]' : 'hover:bg-secondary/50'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">
                    {conv.otherParticipantName || 'Unknown'}
                  </span>
                  {conv.lastMessageAt && (
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(conv.lastMessageAt.toDate(), { addSuffix: true })}
                    </span>
                  )}
                </div>
                <p className="line-clamp-1 text-xs text-muted-foreground">{conv.lastMessage}</p>
              </button>
            ))
          )}
        </div>
      </Card>

      {/* Chat Window */}
      <Card className="glass-card flex flex-col overflow-hidden lg:col-span-2">
        {selectedConversationId ? (
          <ChatWindow conversationId={selectedConversationId} currentUserId={user?.uid || ''} />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Select a channel
          </div>
        )}
      </Card>
    </div>
  )
}

function ChatWindow({
  conversationId,
  currentUserId,
}: {
  conversationId: string
  currentUserId: string
}) {
  const { messages, loading, sendMessage } = useMessages(conversationId)
  const { user } = useAuth() // Need full user object for sender info
  const [text, setText] = useState('')

  const handleSend = async () => {
    if (!text.trim() || !user) return
    await sendMessage(conversationId, { text, recipientId: '' }, user) // recipientId logic needs improvement in hook or here
    setText('')
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && (
          <div className="text-center text-xs text-muted-foreground">Loading encryption...</div>
        )}

        {messages.map(msg => {
          const isMe = msg.senderId === currentUserId
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] rounded-2xl p-3 text-sm ${isMe ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-secondary text-secondary-foreground rounded-bl-none'}`}
              >
                {msg.contextRef && (
                  <div className="mb-1 border-l-2 border-white/20 pl-2 text-[10px] opacity-80">
                    Re: {msg.contextRef.label || msg.contextRef.type}
                  </div>
                )}
                <p>{msg.text}</p>
                <p className="mt-1 text-[10px] opacity-70 flex justify-end">
                  {msg.createdAt
                    ? formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true })
                    : '...'}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-full bg-secondary/50 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Transmit message..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
          />
          <Button size="sm" onClick={handleSend} disabled={!text.trim()}>
            Send
          </Button>
        </div>
      </div>
    </>
  )
}
