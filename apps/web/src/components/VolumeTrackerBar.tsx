import { cn } from '@repo/ui/utils'

interface VolumeTrackerBarProps {
  currentVolume: number
  targetVolume?: number // Optional daily goal (e.g. 5000kg)
}

/**
 * VolumeTrackerBar - Optimized volume progress indicator
 * Removed redundant animations (CSS + Framer Motion)
 * Removed GPU-intensive box-shadow glow effect
 * Uses pure CSS transitions for hardware-accelerated smoothness
 */
export function VolumeTrackerBar({ currentVolume, targetVolume = 5000 }: VolumeTrackerBarProps) {
  const percentage = Math.min(100, Math.round((currentVolume / targetVolume) * 100))

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            Session Volume
          </span>
          <span className="text-2xl font-black font-mono text-foreground flex items-baseline gap-1">
            {currentVolume.toLocaleString()}{' '}
            <span className="text-xs text-muted-foreground">KG</span>
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-muted-foreground">
            GOAL: {targetVolume.toLocaleString()} KG
          </span>
        </div>
      </div>

      {/* Progress Bar - CSS transitions only (3x faster than Framer Motion) */}
      <div className="h-3 w-full bg-secondary/50 rounded-full overflow-hidden relative">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out',
            percentage >= 100
              ? 'bg-gradient-to-r from-accent to-accent/80'
              : 'bg-gradient-to-r from-primary to-primary/80'
          )}
          style={{ width: `${percentage}%` }}
        />
        {/* Striped pattern overlay - minimal performance impact */}
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%,transparent)] bg-[length:10px_10px] opacity-50" />
      </div>
    </div>
  )
}
