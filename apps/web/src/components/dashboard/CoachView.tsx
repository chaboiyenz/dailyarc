import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui'

interface CoachViewProps {
  userRole: string
}

interface Client {
  id: string
  name: string
  readiness: number
  streak: number
  lastLog: string
  status: 'healthy' | 'warning' | 'risk'
}

const DEMO_CLIENTS: Client[] = [
  { id: '1', name: 'Alex Rivera', readiness: 8.1, streak: 14, lastLog: '2 hours ago', status: 'healthy' },
  { id: '2', name: 'Jordan Kim', readiness: 5.3, streak: 7, lastLog: '1 day ago', status: 'warning' },
  { id: '3', name: 'Sam Taylor', readiness: 3.8, streak: 2, lastLog: '3 days ago', status: 'risk' },
  { id: '4', name: 'Morgan Lee', readiness: 7.5, streak: 21, lastLog: '6 hours ago', status: 'healthy' },
  { id: '5', name: 'Casey Park', readiness: 6.2, streak: 5, lastLog: '12 hours ago', status: 'healthy' },
]

export default function CoachView({ userRole }: CoachViewProps) {
  const isTrainer = userRole === 'TRAINER'

  if (!isTrainer) {
    return (
      <div className="flex flex-col gap-6">
        <Card className="border-border bg-card">
          <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--primary)/0.1)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground">Coach Communication</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Your coach can view your training logs, meal entries, and readiness data. 
              Messages from your coach will appear here, attached to specific workouts or meals for contextual feedback.
            </p>
            <div className="mt-4 rounded-xl border border-border bg-secondary/30 p-4 text-left">
              <p className="text-xs font-semibold text-muted-foreground">LATEST FROM YOUR COACH</p>
              <p className="mt-2 text-sm text-foreground">
                {"\"Great form on the pushups. Increase to 5 sets next session. Keep the tempo slow on the eccentric phase.\""}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Coach Marcus -- 2 hours ago</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Trainer Dashboard
  const riskClients = DEMO_CLIENTS.filter(c => c.status === 'risk')
  const warningClients = DEMO_CLIENTS.filter(c => c.status === 'warning')

  return (
    <div className="flex flex-col gap-6">
      {/* Risk Dashboard */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border bg-card">
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Clients</span>
            <p className="mt-1 text-3xl font-black text-foreground">{DEMO_CLIENTS.length}</p>
          </CardContent>
        </Card>
        <Card className="border-[hsl(var(--chart-warning)/0.3)] bg-card">
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--chart-warning))]">At Risk</span>
            <p className="mt-1 text-3xl font-black text-[hsl(var(--chart-warning))]">{riskClients.length}</p>
          </CardContent>
        </Card>
        <Card className="border-[hsl(var(--chart-fat)/0.3)] bg-card">
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--chart-fat))]">Warnings</span>
            <p className="mt-1 text-3xl font-black text-[hsl(var(--chart-fat))]">{warningClients.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Client List */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Client Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {/* Header */}
            <div className="grid grid-cols-5 gap-4 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Client</span>
              <span>Readiness</span>
              <span>Streak</span>
              <span>Last Log</span>
              <span>Status</span>
            </div>

            {DEMO_CLIENTS.map(client => (
              <div
                key={client.id}
                className="grid grid-cols-5 items-center gap-4 rounded-xl border border-border bg-secondary/20 px-4 py-3 transition-all hover:bg-secondary/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--primary)/0.15)] text-xs font-bold text-[hsl(var(--primary))]">
                    {client.name.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-foreground">{client.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-16 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(client.readiness / 10) * 100}%`,
                        backgroundColor:
                          client.readiness >= 7
                            ? 'hsl(var(--chart-carbs))'
                            : client.readiness >= 5
                              ? 'hsl(var(--chart-fat))'
                              : 'hsl(var(--chart-warning))',
                      }}
                    />
                  </div>
                  <span className="font-mono text-xs font-bold text-foreground">{client.readiness}</span>
                </div>
                <span className="font-mono text-sm text-foreground">{client.streak} days</span>
                <span className="text-xs text-muted-foreground">{client.lastLog}</span>
                <span
                  className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                    client.status === 'healthy'
                      ? 'bg-[hsl(var(--chart-carbs)/0.1)] text-[hsl(var(--chart-carbs))]'
                      : client.status === 'warning'
                        ? 'bg-[hsl(var(--chart-fat)/0.1)] text-[hsl(var(--chart-fat))]'
                        : 'bg-[hsl(var(--chart-warning)/0.1)] text-[hsl(var(--chart-warning))]'
                  }`}
                >
                  {client.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
