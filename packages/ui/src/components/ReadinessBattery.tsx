import React from 'react'
import { cn } from '../lib/utils'
import { Zap, Flame } from 'lucide-react'

interface ReadinessBatteryProps {
  level: number // 0-100
  streak: number
  status: string
  className?: string
}

export const ReadinessBattery: React.FC<ReadinessBatteryProps> = ({
  level,
  streak,
  status,
  className,
}) => {
  // Determine color based on level
  const getBatteryColor = (l: number) => {
    if (l >= 80) return 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
    if (l >= 50) return 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
    return 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]'
  }

  const batteryColorClass = getBatteryColor(level)

  return (
    <div className={cn('flex flex-col items-center gap-6 p-6', className)}>
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
          System Energy
        </span>
        <span className="text-3xl font-black tracking-tighter text-foreground">{level}%</span>
      </div>

      {/* Battery Container */}
      <div className="relative flex items-center pr-3">
        {/* Battery Body */}
        <div className="relative h-32 w-16 overflow-hidden rounded-xl border-[3px] border-foreground/10 bg-secondary/30 backdrop-blur-sm">
          {/* Liquid Fill */}
          <div
            className={cn(
              'absolute bottom-0 left-0 w-full transition-all duration-1000 ease-out',
              batteryColorClass
            )}
            style={{ height: `${level}%` }}
          >
            {/* Bubble Animation Effect */}
            <div className="absolute top-0 left-0 w-full h-4 bg-white/20 animate-pulse" />
          </div>

          {/* Icon Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap
              className={cn(
                'h-8 w-8 transition-colors duration-500',
                level > 30 ? 'text-white/80' : 'text-foreground/40'
              )}
            />
          </div>
        </div>

        {/* Battery Tip */}
        <div className="h-8 w-2.5 rounded-r-md border-y-[3px] border-r-[3px] border-foreground/10 bg-secondary/30" />
      </div>

      <div className="flex flex-col items-center gap-3">
        {/* Status Badge */}
        <div
          className={cn(
            'rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-widest',
            'bg-secondary/50 text-foreground/80 border border-foreground/5 shadow-sm'
          )}
        >
          {status}
        </div>

        {/* Streak Indicator */}
        <div className="flex items-center gap-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 transition-all hover:scale-105">
          <Flame className="h-4 w-4 fill-orange-500 text-orange-500" />
          <span className="text-sm font-black text-orange-600 tracking-tight">
            {streak} DAY STREAK
          </span>
        </div>
      </div>
    </div>
  )
}
