import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useFeed } from '@/hooks/useSocial'
import { Card, CardContent, Button } from '@repo/ui'
import { formatDistanceToNow } from 'date-fns'

export default function CommunityFeed() {
  const { user, profile } = useAuth()
  const { posts, loading, createPost, toggleLike } = useFeed()
  const [newPostContent, setNewPostContent] = useState('')

  const handlePost = async () => {
    if (!newPostContent.trim() || !profile) return
    await createPost({ content: newPostContent, type: 'general' }, profile)
    setNewPostContent('')
  }

  if (loading) {
    return <div className="p-12 text-center text-muted-foreground">Loading feed...</div>
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Compose */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.15)] text-sm font-bold text-[hsl(var(--primary))]">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 space-y-3">
              <textarea
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                placeholder="Share your progress..."
                rows={2}
                value={newPostContent}
                onChange={e => setNewPostContent(e.target.value)}
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={handlePost} disabled={!newPostContent.trim()}>
                  Post
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feed */}
      <div className="space-y-4">
        {posts.map(post => (
          <Card key={post.id} className="glass-card hover:bg-card/40 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-muted-foreground">
                  {post.authorName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{post.authorName}</span>
                    <span className="text-xs text-muted-foreground">
                      {post.createdAt
                        ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true })
                        : 'Just now'}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{post.content}</p>

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-4">
                    <button
                      className={`flex items-center gap-1.5 text-xs font-semibold ${post.likes.includes(user?.uid || '') ? 'text-[hsl(var(--primary))]' : 'text-muted-foreground hover:text-foreground'}`}
                      onClick={() => user && toggleLike(post.id, user.uid, post.likes)}
                    >
                      <svg
                        className="w-4 h-4"
                        fill={post.likes.includes(user?.uid || '') ? 'currentColor' : 'none'}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {post.likes.length}
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
