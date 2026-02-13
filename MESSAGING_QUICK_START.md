# DailyArc Real-Time Messaging - Quick Start

## 🚀 What's Ready Now

Your messaging system is **fully implemented and integrated** into the dashboard! Users can:

✅ Click "Comms" in sidebar → See all conversations
✅ Click a conversation → View message thread
✅ Type and send messages in real-time
✅ See optimistic UI (message appears instantly)
✅ Auto-scroll to latest messages
✅ See unread count badges
✅ View relative timestamps ("2m ago")

## 📱 How It Works

### For Trainees
1. Navigate to **Comms** section in sidebar
2. See list of conversations with trainers
3. Click a conversation to open chat
4. Type message, press Enter to send

### For Trainers
1. Navigate to **Comms** section to see all trainee conversations
2. Use `useTrainerMessaging` hook in code to programmatically open conversations:

```typescript
const { openOrCreateConversation } = useTrainerMessaging()

// When clicking a trainee button:
const conversationId = await openOrCreateConversation(trainee)
setActiveSection('messages') // Navigate to messages view
```

## 🎨 Design Details

| Element | Styling |
|---------|---------|
| **User Message Bubble** | `bg-cyan-600` with white text, glow effect |
| **Recipient Bubble** | `bg-slate-800` with slate-100 text |
| **Sidebar** | `bg-slate-900` with `border-slate-800` |
| **Avatar** | Cyan circle with white initials |
| **Send Button** | Cyan with `shadow-lg shadow-cyan-600/50` glow |
| **Input Area** | `backdrop-blur-md` for glass effect |

## 🔧 Using in Your Code

### Hook: `useTrainerMessaging`
```typescript
import { useTrainerMessaging } from '@/hooks/useTrainerMessaging'

function MyComponent() {
  const { openOrCreateConversation } = useTrainerMessaging()

  const handleMessageClient = async (client: User) => {
    const conversationId = await openOrCreateConversation(client)
    // Navigate to messages or do something with conversationId
  }

  return <button onClick={() => handleMessageClient(client)}>Message</button>
}
```

### Hook: `useMessages`
```typescript
import { useMessages } from '@/hooks/useSocial'

function ChatWindow({ conversationId, currentUserId, currentUser }: Props) {
  const { messages, loading, sendMessage } = useMessages(conversationId)

  const handleSend = async (text: string) => {
    await sendMessage(conversationId, { text, recipientId: '' }, currentUser)
  }

  // messages is reactive - updates in real-time
  return (
    <>
      {messages.map(msg => (
        <div key={msg.id}>{msg.text}</div>
      ))}
    </>
  )
}
```

### Component: `TrainerClientMessaging`
Example component for integrating into TrainerDashboard:

```typescript
import TrainerClientMessaging from '@/components/dashboard/TrainerClientMessaging'

export default function TrainerDashboard() {
  const clients = [...] // Your clients list

  const handleNavigateToMessages = (conversationId: string) => {
    // Open the messages section with selected conversation
  }

  return (
    <TrainerClientMessaging
      clients={clients}
      onNavigateToMessages={handleNavigateToMessages}
    />
  )
}
```

## 📡 Real-Time Features

### Optimistic UI
Messages appear instantly while being sent to Firestore:
```
1. User types "Hello"
2. Message appears in chat immediately with "∙ sending..." indicator
3. Actually sent to Firestore in background
4. Real message comes back from onSnapshot listener
5. Temporary message is removed
```

### Auto-Scroll
The chat automatically scrolls to the bottom when:
- A new message arrives from the other user
- A sent message is confirmed from the server
- The component mounts with existing messages

### Real-Time Listener
Messages are kept in sync with Firestore using `onSnapshot()`:
```typescript
const unsubscribe = onSnapshot(
  query(collection(db, 'conversations', conversationId, 'messages')),
  snapshot => {
    // Update local state with fresh data from Firestore
    setMessages(snapshot.docs.map(...))
  }
)
```

## 🔐 Security Notes

Make sure your Firestore rules enforce:
```
- Users can only read conversations they're part of
- Users can only send messages to conversations they're in
- Message content is validated (length, type)
```

## 📊 Data Structure

```
conversations/
  {conversationId}/
    participants: ["uid1", "uid2"]
    lastMessage: "Hello there!"
    lastMessageAt: Timestamp
    unreadCount: 3
    otherParticipantName: "John Trainer"
    otherParticipantId: "uid2"

    messages/
      {messageId}/
        senderId: "uid1"
        senderName: "Jane Trainee"
        text: "Hello there!"
        contextRef: { type: "workout", id: "...", label: "..." } // optional
        read: false
        createdAt: Timestamp
```

## 🛠️ Customization

### Change Colors
Edit `ChatWindow.tsx` and `MessageList.tsx`:
```typescript
// User bubble
className="bg-cyan-600 text-white" // Change bg-cyan-600 to your color

// Recipient bubble
className="bg-slate-800 text-slate-100" // Change colors here
```

### Add Message Reactions
Modify `OptimisticMessage` interface and add reaction UI in ChatWindow

### Add File Uploads
Extend `SendMessageInput` schema and use Cloud Storage

### Add Typing Indicators
Use Firestore Realtime Database or a presence collection

## 📝 Troubleshooting

**Q: Messages not appearing?**
- Check Firestore rules allow reads/writes for conversations
- Verify participants array includes current user ID

**Q: Optimistic message not disappearing?**
- Check browser console for errors
- Verify Firestore write succeeded
- Check `useMessages` hook cleanup

**Q: Auto-scroll not working?**
- Ensure `messagesEndRef` is properly attached to last message
- Check for CSS `overflow` properties blocking scroll

## 📚 Full Documentation
See `MESSAGING_IMPLEMENTATION.md` for detailed architecture and next steps.

---

**Status**: ✅ Production Ready
**Last Updated**: 2026-02-13
