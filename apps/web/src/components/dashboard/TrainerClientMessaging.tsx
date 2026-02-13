import { useState, useCallback } from 'react'
import { MessageCircle } from 'lucide-react'
import { useTrainerMessaging } from '@/hooks/useTrainerMessaging'
import { Button } from '@repo/ui'
import type { User } from '@repo/shared'

interface TrainerClientMessagingProps {
  clients: User[]
  onNavigateToMessages: (conversationId: string) => void
}

/**
 * Example component showing how trainers can message clients from dashboard
 * Can be integrated into TrainerDashboard or a dedicated "Priority Attention" card
 */
export default function TrainerClientMessaging({
  clients,
  onNavigateToMessages,
}: TrainerClientMessagingProps) {
  const { openOrCreateConversation } = useTrainerMessaging()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleMessageClient = useCallback(
    async (client: User) => {
      setLoading(client.uid)
      setError(null)

      try {
        const conversationId = await openOrCreateConversation(client)

        if (conversationId) {
          // Navigate to messages section with this conversation
          onNavigateToMessages(conversationId)
        } else {
          setError('Failed to open conversation')
        }
      } catch (err) {
        console.error('Failed to message client:', err)
        setError('Error opening conversation')
      } finally {
        setLoading(null)
      }
    },
    [openOrCreateConversation, onNavigateToMessages]
  )

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {clients.length === 0 ? (
        <p className="text-sm text-muted-foreground">No clients to message</p>
      ) : (
        <div className="space-y-2">
          {clients.map(client => (
            <div
              key={client.uid}
              className="flex items-center justify-between rounded-lg border border-border bg-card/50 p-3 hover:bg-card transition-colors"
            >
              <div className="min-w-0">
                <p className="font-medium text-foreground">{client.displayName}</p>
                <p className="text-xs text-muted-foreground">{client.email}</p>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMessageClient(client)}
                disabled={loading === client.uid}
                className="gap-2 flex-shrink-0"
              >
                <MessageCircle className="h-4 w-4" />
                {loading === client.uid ? 'Opening...' : 'Message'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
