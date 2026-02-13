/**
 * Trainer Pending Approval Screen
 * Shown to trainers with role === 'TRAINER' && status === 'PENDING'
 */

import { Card, CardContent, CardHeader, CardTitle, Button } from '@repo/ui'
import { Clock, CheckCircle, FileText, LogOut } from 'lucide-react'

interface TrainerPendingApprovalProps {
  displayName?: string
  onSignOut?: () => void
}

export default function TrainerPendingApproval({
  displayName = 'Trainer',
  onSignOut,
}: TrainerPendingApprovalProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 p-4">
      <Card className="border-yellow-500/30 bg-yellow-500/5 max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-yellow-500">
            <Clock className="h-6 w-6" />
            Approval Pending
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Message */}
          <div className="space-y-2 text-center">
            <p className="text-lg font-semibold text-white">Almost there, {displayName}!</p>
            <p className="text-slate-300">
              Your trainer profile is currently under review by our admin team.
            </p>
          </div>

          {/* What's Happening */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
              What's Happening
            </p>
            <div className="space-y-2">
              <div className="flex gap-3">
                <FileText className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">Certification Review</p>
                  <p className="text-xs text-slate-400">
                    Your uploaded credentials are being verified
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-white">Admin Approval</p>
                  <p className="text-xs text-slate-400">
                    An admin will review and approve your profile
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50 space-y-2">
            <p className="text-sm font-semibold text-slate-300">Typical Timeline</p>
            <p className="text-xs text-slate-400">
              Most trainer profiles are reviewed and approved within 24-48 hours. You'll receive an
              email notification when your profile is approved.
            </p>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/30 space-y-2">
            <p className="text-sm font-semibold text-blue-300">In the Meantime</p>
            <ul className="text-xs text-blue-200 space-y-1">
              <li>✓ Check your email for status updates</li>
              <li>✓ Make sure your certification details are accurate</li>
              <li>✓ Return to this page later to check status</li>
            </ul>
          </div>

          {/* Contact */}
          <div className="text-center pt-2">
            <p className="text-xs text-slate-400">
              Questions? Contact{' '}
              <a href="mailto:support@dailyarc.com" className="text-cyan-400 hover:text-cyan-300">
                support@dailyarc.com
              </a>
            </p>
          </div>

          {/* Sign Out Button */}
          {onSignOut && (
            <Button
              onClick={onSignOut}
              variant="outline"
              className="w-full mt-2 border-slate-700 hover:bg-slate-800 text-slate-300"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
