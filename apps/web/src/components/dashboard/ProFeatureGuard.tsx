import { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { Lock, Zap, Crown } from 'lucide-react'
import { useStripeCheckout } from '@/hooks/useStripeCheckout'

interface ProFeatureGuardProps {
  children: ReactNode
  featureName?: string
  description?: string
  /** If true, shows upgrade CTA. If false, blocks completely */
  showUpgradePrompt?: boolean
  /** Inline mode shows a banner, block mode shows full card */
  mode?: 'inline' | 'block'
}

/**
 * Guard component that conditionally renders Pro features
 * Checks user subscription.tier status and displays upgrade prompt if needed
 */
export function ProFeatureGuard({
  children,
  featureName = 'Pro Feature',
  description = 'Unlock advanced features with DailyArc Pro',
  showUpgradePrompt = true,
  mode = 'block',
}: ProFeatureGuardProps) {
  const { user, profile } = useAuth()
  const { startCheckout, isLoading } = useStripeCheckout(
    user?.uid || null,
    user?.email || null,
    profile?.subscription?.stripeCustomerId
  )

  const isPro = profile?.subscription?.tier === 'PRO'

  // Allow access if user is Pro
  if (isPro) {
    return <>{children}</>
  }

  // If no upgrade prompt, just return null
  if (!showUpgradePrompt) {
    return null
  }

  // Inline banner mode
  if (mode === 'inline') {
    return (
      <div className="relative p-4 rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Crown className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">{featureName}</h4>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          <Button
            onClick={() => startCheckout({ priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID })}
            disabled={isLoading}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            size="sm"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isLoading ? 'Loading...' : 'Upgrade to Pro'}
          </Button>
        </div>
      </div>
    )
  }

  // Block mode - full card replacement
  return (
    <Card className="border-border bg-card relative overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 pointer-events-none" />

      <CardHeader className="relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <Lock className="h-6 w-6 text-amber-400" />
          </div>
          <Crown className="h-8 w-8 text-amber-400" />
        </div>
        <CardTitle className="text-xl">{featureName}</CardTitle>
      </CardHeader>

      <CardContent className="relative space-y-4">
        <p className="text-muted-foreground">{description}</p>

        {/* Pro benefits list */}
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>Automatic wearable device sync (Google Fit, Apple Health)</span>
          </li>
          <li className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>Advanced analytics and trend predictions</span>
          </li>
          <li className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>Custom training program builder</span>
          </li>
          <li className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>Export data and reports</span>
          </li>
        </ul>

        <Button
          onClick={() => startCheckout({ priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID })}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold"
          size="lg"
        >
          <Crown className="h-5 w-5 mr-2" />
          {isLoading ? 'Loading...' : 'Upgrade to Pro - $9.99/month'}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Cancel anytime. Powered by Stripe.
        </p>
      </CardContent>
    </Card>
  )
}
