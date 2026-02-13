import { motion } from 'framer-motion'
import { cn } from '@repo/ui/utils'

type TrainingMode = 'bodyweight' | 'iron' | 'cardio' | 'hybrid'

interface TrainingModeToggleProps {
  mode: TrainingMode
  onChange: (mode: TrainingMode) => void
}

export function TrainingModeToggle({ mode, onChange }: TrainingModeToggleProps) {
  const modes: { id: TrainingMode; label: string; icon: string }[] = [
    { id: 'bodyweight', label: 'Bodyweight', icon: '🤸' },
    { id: 'iron', label: 'Iron', icon: '🏋️' },
    { id: 'cardio', label: 'Cardio', icon: '🏃' },
    { id: 'hybrid', label: 'Hybrid', icon: '⚡' },
  ]

  return (
    <div className="flex p-1 space-x-1 bg-slate-900/50 backdrop-blur-md rounded-xl border border-white/10 w-full max-w-md mx-auto">
      {modes.map(m => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className={cn(
            'relative flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors rounded-lg',
            mode === m.id ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          )}
        >
          {mode === m.id && (
            <motion.div
              layoutId="active-pill"
              className="absolute inset-0 bg-primary/20 border border-primary/50 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)]"
              initial={false}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative z-10 text-lg">{m.icon}</span>
          <span className="relative z-10 uppercase tracking-wider text-xs">{m.label}</span>
        </button>
      ))}
    </div>
  )
}
