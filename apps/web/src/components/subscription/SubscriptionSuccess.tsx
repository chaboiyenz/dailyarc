import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@repo/ui'
import { CheckCircle, Crown, Zap } from 'lucide-react'

/**
 * Success page after Stripe Checkout completion
 * Stripe redirects here with session_id query param
 */
export default function SubscriptionSuccess() {
  const navigate = useNavigate()

  useEffect(() => {
    // Auto-redirect to profile after 5 seconds
    const timer = setTimeout(() => {
      navigate('/profile')
    }, 5000)

    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <Card className="max-w-md w-full border-border bg-card">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30">
              <CheckCircle className="h-12 w-12 text-emerald-400" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Welcome to DailyArc Pro!</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            Your subscription is now active. You have full access to all Pro features.
          </p>

          {/* Pro features unlocked */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Now you can:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Connect your wearable devices for automatic sync</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Access advanced analytics and trend predictions</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Build custom training programs</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>Export your data and reports</span>
              </li>
            </ul>
          </div>

          <Button
            onClick={() => navigate('/profile')}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            size="lg"
          >
            <Crown className="h-5 w-5 mr-2" />
            Go to Settings
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Redirecting automatically in 5 seconds...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
