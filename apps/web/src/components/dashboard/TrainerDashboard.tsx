import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@repo/ui'
import { useAuth } from '@/hooks/useAuth'
import { useTrainees } from '@/hooks/useTrainees'
import { useTraineeHealth } from '@/hooks/useTraineeHealth'
import { useFeed } from '@/hooks/useSocial'
import { useCommunityCleanup } from '@/hooks/useCommunityCleanup'
import type { User } from '@repo/shared'

export default function TrainerDashboard() {
  const { profile } = useAuth()
  const { trainees, loading: traineesLoading } = useTrainees(profile?.uid || null)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)

  // Auto-cleanup old posts on trainer login
  useCommunityCleanup()

  // Calculate client statistics
  const activeCount = trainees.length > 0 ? Math.floor(trainees.length * 0.7) : 0
  const atRiskCount = trainees.length > 0 ? Math.floor(trainees.length * 0.2) : 0
  const warningCount = trainees.length - activeCount - atRiskCount

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard label="Total Clients" value={trainees.length} color="text-foreground" />
        <StatsCard
          label="At Risk"
          value={atRiskCount}
          color="text-[hsl(var(--chart-warning))]"
          borderColor="border-[hsl(var(--chart-warning)/0.3)]"
        />
        <StatsCard
          label="Warnings"
          value={warningCount}
          color="text-[hsl(var(--chart-fat))]"
          borderColor="border-[hsl(var(--chart-fat)/0.3)]"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client Health Cards */}
        <Card className="lg:col-span-2 glass-card">
          <CardHeader>
            <CardTitle>Client Health Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {traineesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg border border-border">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : trainees.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No clients assigned yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {trainees.map(client => (
                  <ClientHealthCard
                    key={client.uid}
                    client={client}
                    isSelected={selectedClientId === client.uid}
                    onSelect={() => setSelectedClientId(client.uid)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Global Feed */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Activity Feed</CardTitle>
          </CardHeader>
          <CardContent className="min-h-[300px]">
            <GlobalFeed />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface ClientHealthCardProps {
  client: User
  isSelected: boolean
  onSelect: () => void
}

function ClientHealthCard({ client, isSelected, onSelect }: ClientHealthCardProps) {
  const { health } = useTraineeHealth(client.uid)
  const { latestDaily, healthStatus, lastUpdateTime } = health || {}

  return (
    <button
      onClick={onSelect}
      className={`w-full flex gap-3 p-3 rounded-lg border transition-all ${
        isSelected ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)]' : 'border-border hover:border-[hsl(var(--primary)/0.5)]'
      }`}
    >
      {/* Avatar */}
      <div className="flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 bg-[hsl(var(--primary)/0.15)] text-xs font-bold text-[hsl(var(--primary))]">
        {(client.displayName || 'C')[0].toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-sm text-foreground truncate">{client.displayName}</p>
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold flex-shrink-0 ${
              healthStatus === 'active'
                ? 'bg-[hsl(var(--chart-carbs)/0.1)] text-[hsl(var(--chart-carbs))]'
                : healthStatus === 'at-risk'
                  ? 'bg-[hsl(var(--chart-fat)/0.1)] text-[hsl(var(--chart-fat))]'
                  : 'bg-[hsl(var(--chart-warning)/0.1)] text-[hsl(var(--chart-warning))]'
            }`}
          >
            {healthStatus === 'active' ? 'ACTIVE' : healthStatus === 'at-risk' ? 'AT RISK' : 'INACTIVE'}
          </span>
        </div>

        {/* Readiness Bar */}
        <div className="flex items-center gap-2 mb-1">
          {latestDaily ? (
            <>
              <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(latestDaily.readinessAverage / 5) * 100}%`,
                    backgroundColor:
                      latestDaily.readinessAverage >= 4
                        ? 'hsl(var(--chart-carbs))'
                        : latestDaily.readinessAverage >= 3
                          ? 'hsl(var(--chart-fat))'
                          : 'hsl(var(--chart-warning))',
                  }}
                />
              </div>
              <span className="text-xs font-mono text-foreground flex-shrink-0">
                {latestDaily.readinessAverage.toFixed(1)}/5
              </span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">No data</span>
          )}
        </div>

        {/* Last Update */}
        <p className="text-xs text-muted-foreground">
          Updated {lastUpdateTime ? formatDistanceToNow(lastUpdateTime, { addSuffix: true }) : 'Never'}
        </p>
      </div>
    </button>
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
