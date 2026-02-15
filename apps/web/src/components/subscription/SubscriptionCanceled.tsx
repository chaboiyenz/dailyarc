import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@repo/ui'
import { XCircle } from 'lucide-react'

/**
 * Canceled page when user exits Stripe Checkout without completing
 */
export default function SubscriptionCanceled() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <Card className="max-w-md w-full border-border bg-card">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-red-500/10 border border-red-500/30">
              <XCircle className="h-12 w-12 text-red-400" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Subscription Canceled</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <p className="text-center text-muted-foreground">
            Your subscription was not completed. You can try again anytime from your profile
            settings.
          </p>

          <div className="flex gap-3">
            <Button onClick={() => navigate('/profile')} variant="outline" className="flex-1">
              Back to Profile
            </Button>
            <Button
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
