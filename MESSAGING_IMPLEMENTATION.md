# Real-Time Messaging System Implementation

## Overview
Implemented a complete real-time messaging system for DailyArc with optimistic UI, auto-scrolling, and Hytel Pro aesthetics (cyan bubbles, slate backgrounds, glow effects).

## 🎯 What Was Built

### 1. **Core Utilities**
- **`apps/web/src/lib/conversations.ts`**: `getOrCreateConversation()` utility
  - Queries existing conversations between two users
  - Creates new conversation if none exists
  - Used by trainers/trainees to open conversations

### 2. **Enhanced Hooks**
- **`apps/web/src/hooks/useSocial.ts`**: Updated `useMessages()`
  - Optimistic UI: Adds messages to local state immediately before server confirmation
  - Uses `_optimistic` and `_sending` flags to show pending state
  - Real-time listener via `onSnapshot()` for incoming messages
  - Auto-removal of temporary messages once confirmed

- **`apps/web/src/hooks/useTrainerMessaging.ts`**: New hook for trainer integrations
  - Wraps `getOrCreateConversation()` with auth context
  - Returns `openOrCreateConversation(otherUser: User)` function
  - Safe error handling and user validation

### 3. **UI Components**
- **`apps/web/src/components/social/MessageList.tsx`**: Sidebar component
  - Lists all conversations for the current user
  - Shows avatars (initials in cyan circle)
  - Displays relative timestamps (e.g., "2m ago")
  - Unread count badges
  - Hover effects and selection state
  - **Aesthetics**: `bg-slate-900`, `border-slate-800`, cyan avatars

- **`apps/web/src/components/social/ChatWindow.tsx`**: Main message stream
  - Auto-scrolls to bottom when new messages arrive
  - Optimistic UI indicators ("∙ sending..." text)
  - Message bubbles with context references
  - Textarea input with Shift+Enter support
  - Glowing cyan send button with shadow effects
  - **Aesthetics**:
    - User messages: `bg-cyan-600` text-white `rounded-br-none`
    - Recipient messages: `bg-slate-800` text-slate-100 `rounded-bl-none`
    - Input bar: `backdrop-blur-md` with cyan glow on button

- **`apps/web/src/components/social/ChatPortal.tsx`**: Main container
  - Reorganized to use new MessageList and ChatWindow components
  - Responsive grid layout: `lg:grid-cols-3`
  - Sidebar takes 1 column, chat takes 2 columns
  - Mobile-friendly (hidden on small screens, can be improved)

### 4. **Existing Schema (Already in place)**
- `packages/shared/src/schemas/message.ts`
  - `MessageSchema`: Individual messages with sender, text, timestamps, read status
  - `ConversationSchema`: Conversation metadata (participants, last message, unread count)
  - Supports contextual references (workouts, meals, arc data)

### 5. **Firestore Structure**
```
conversations/
  {conversationId}/
    - participants: string[] (2 users)
    - lastMessage: string
    - lastMessageAt: Timestamp
    - unreadCount: number
    - otherParticipantName: string
    - otherParticipantId: string

    messages/
      {messageId}/
        - senderId: string
        - senderName: string
        - text: string
        - contextRef?: { type, id, label }
        - read: boolean
        - createdAt: Timestamp
```

## 🔗 Integration Points

### Dashboard Navigation
- Already integrated at `DashboardLayout` (line 57-58)
- Route: `activeSection === 'messages'` → `<ChatPortal />`
- Accessible from sidebar as "Comms" section

### Trainer-to-Trainee Flow
Trainers can initiate conversations:
```typescript
const { openOrCreateConversation } = useTrainerMessaging()

// When clicking a trainee:
const conversationId = await openOrCreateConversation(trainee)
// Navigate to messages section or open ChatWindow
```

## ✨ Key Features

### Real-Time Updates
- `onSnapshot()` listeners on messages sub-collection
- Automatic refresh when new messages arrive
- Bi-directional communication

### Optimistic UI
- Messages appear instantly while sending
- Shows "∙ sending..." indicator
- Automatically replaces with confirmed message from server
- Failed messages are removed with error logging

### Auto-Scroll
- `useRef` + `useEffect` monitors message array
- Smooth scroll to bottom on new messages
- Implemented in `ChatWindow.tsx`

### Accessibility
- Textarea supports Shift+Enter for multiline
- Enter key sends message (standard UX)
- Focus states on button (glow effect)
- Disabled states while sending

## 🎨 Aesthetics (Hytel Pro)

### Color Scheme
- **User bubbles**: `bg-cyan-600` (#06b6d4) with white text
- **Recipient bubbles**: `bg-slate-800` (#1e293b) with slate-100 text
- **Sidebar**: `bg-slate-900` (#0f172a) with `border-slate-800`
- **Input area**: Backdrop blur with transparent slate background
- **Button**: Cyan with `shadow-lg shadow-cyan-600/50` glow effect

### Layout
- Message bubbles: `rounded-2xl` with asymmetric corners (`rounded-br-none` / `rounded-bl-none`)
- Avatars: Small circles with initials, fixed size `h-8 w-8` or `h-10 w-10`
- Spacing: Consistent `gap-3` throughout
- Typography: Mix of text-sm, text-xs for hierarchy

## 🚀 Next Steps (Future Enhancements)

### Recommended
1. **Unread Count Tracking**
   - Update `conversations.unreadCount` on message delivery
   - Mark messages as read when user views conversation

2. **Typing Indicators**
   - Show "User is typing..." while trainer/trainee types
   - Use presence/heartbeat mechanism

3. **Message Search**
   - Search within conversation
   - Filter conversations by participant name

4. **Rich Message Features**
   - Image/file attachments
   - Emoji reactions
   - Message editing/deletion

5. **Mobile Responsiveness**
   - Full-screen chat on mobile
   - Collapsible sidebar or bottom navigation
   - Proper touch interactions

6. **Notifications**
   - Browser notifications for new messages
   - Unread badge in sidebar nav
   - Sound/toast alerts

### Advanced
- End-to-end encryption
- Message persistence/offline support
- Message translation
- Voice messages
- Video call integration

## 📋 Testing Checklist

- [ ] Create new conversation between two users
- [ ] Send message and verify optimistic UI ("∙ sending...")
- [ ] Verify message appears in onSnapshot listener
- [ ] Test auto-scroll to latest message
- [ ] Send multiline message (Shift+Enter)
- [ ] Verify timestamps update correctly
- [ ] Test with context references (workout/meal)
- [ ] Check UI on different screen sizes
- [ ] Verify avatars display correctly
- [ ] Test conversation list sorting by lastMessageAt

## 🔧 Code Locations

| File | Purpose |
|------|---------|
| `apps/web/src/lib/conversations.ts` | Utility for creating/fetching conversations |
| `apps/web/src/hooks/useSocial.ts` | Core messaging hooks (useMessages, useConversations) |
| `apps/web/src/hooks/useTrainerMessaging.ts` | Trainer-specific messaging hook |
| `apps/web/src/components/social/MessageList.tsx` | Sidebar conversation list |
| `apps/web/src/components/social/ChatWindow.tsx` | Main message stream UI |
| `apps/web/src/components/social/ChatPortal.tsx` | Container component |
| `packages/shared/src/schemas/message.ts` | Zod schemas for messages/conversations |

## 🛡️ Security Considerations

- Firestore rules should validate:
  - User can only see conversations they're part of
  - Users can only send messages to conversations they're in
  - Message content is validated (length, type)
  - `read` status updates only by recipient

## 📱 Responsive Design

- **Desktop (lg+)**: 3-column grid (1 sidebar : 2 chat)
- **Tablet**: Similar to desktop or adjusted
- **Mobile**: Should be updated to full-screen chat with back button

---

**Status**: ✅ Core implementation complete and integrated into dashboard
**Last Updated**: 2026-02-13
