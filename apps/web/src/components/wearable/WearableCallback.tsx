import { useEffect } from 'react'

/**
 * OAuth callback handler for Google Fit
 * Receives auth code from Google and posts it back to parent window
 */
export default function WearableCallback() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const error = urlParams.get('error')

    if (window.opener) {
      window.opener.postMessage({ code, error }, window.location.origin)
    }

    // Close popup after posting message
    setTimeout(() => window.close(), 500)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent mx-auto mb-4" />
        <p className="text-foreground">Connecting your device...</p>
      </div>
    </div>
  )
}
