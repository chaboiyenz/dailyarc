import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@repo/ui'
import { useFeed } from '@/hooks/useSocial'

export default function TrainerDashboard() {
  // const { user } = useAuth()

  // Placeholder for real-time clients data
  // In the future: useTrainerClients(user.uid)
  const stats = {
    active: 12,
    risk: 3,
    warnings: 5,
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard label="Active Clients" value={stats.active} color="text-foreground" />
        <StatsCard
          label="At Risk"
          value={stats.risk}
          color="text-[hsl(var(--chart-warning))]"
          borderColor="border-[hsl(var(--chart-warning)/0.3)]"
        />
        <StatsCard
          label="Warnings"
          value={stats.warnings}
          color="text-[hsl(var(--chart-fat))]"
          borderColor="border-[hsl(var(--chart-fat)/0.3)]"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Global Feed */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Global Activity Feed</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[300px]">
            <GlobalFeed />
          </CardContent>
        </Card>

        {/* Client Quick List */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Priority Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Clients with low readiness or missed sessions.
              </p>
              {/* List would go here */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatsCard({
  label,
  value,
  color,
  borderColor = 'border-border',
}: {
  label: string
  value: number
  color: string
  borderColor?: string
}) {
  return (
    <Card className={`${borderColor} bg-card`}>
      <CardContent className="p-5">
        <span
          className={`text-xs font-semibold uppercase tracking-wider ${color === 'text-foreground' ? 'text-muted-foreground' : color}`}
        >
          {label}
        </span>
        <p className={`mt-1 text-3xl font-black ${color}`}>{value}</p>
      </CardContent>
    </Card>
  )
}

const GlobalFeed = () => {
  const { posts, loading } = useFeed()

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-3"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
      {posts.map(post => (
        <div key={post.id} className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="flex justify-between items-start mb-1">
            <span className="font-bold text-sm text-foreground">{post.authorName}</span>
            <span className="text-[10px] text-muted-foreground">
              {post.createdAt
                ? new Date(post.createdAt.toDate()).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Now'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
        </div>
      ))}
    </div>
  )
}
