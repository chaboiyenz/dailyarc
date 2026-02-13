import { useState } from 'react'
import { Input, Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { cn } from '@repo/ui'

// Common staples for the "Visual Pantry"
const BASICS = [
  { name: 'Chicken', icon: '🍗' },
  { name: 'Eggs', icon: '🥚' },
  { name: 'Rice', icon: '🍚' },
  { name: 'Potatoes', icon: '🥔' },
  { name: 'Oats', icon: '🥣' },
  { name: 'Milk', icon: '🥛' },
  { name: 'Spinach', icon: '🥬' },
  { name: 'Broccoli', icon: '🥦' },
  { name: 'Banana', icon: '🍌' },
  { name: 'Berries', icon: '🫐' },
  { name: 'Pasta', icon: '🍝' },
  { name: 'Bread', icon: '🍞' },
  { name: 'Avocado', icon: '🥑' },
  { name: 'Nuts', icon: '🥜' },
  { name: 'Yogurt', icon: '🥣' },
  { name: 'Beef', icon: '🥩' },
]

interface LocalInventoryManagerProps {
  /** Initial inventory items from profile */
  initialInventory: (string | { name: string })[]
  /** Callback when selected items change (local state only, no Firestore) */
  onSelectionChange: (selected: string[]) => void
}

export default function LocalInventoryManager({
  initialInventory,
  onSelectionChange,
}: LocalInventoryManagerProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [localSelected, setLocalSelected] = useState<string[]>(() => {
    return initialInventory.map(i => (typeof i === 'string' ? i : i.name))
  })

  const handleToggle = (itemName: string) => {
    const newSelected = localSelected.includes(itemName)
      ? localSelected.filter(i => i !== itemName)
      : [...localSelected, itemName]

    setLocalSelected(newSelected)
    onSelectionChange(newSelected) // Notify parent of local change
  }

  const filteredBasics = BASICS.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card className="border-border bg-card">
      <CardHeader className="py-3">
        <CardTitle className="text-foreground text-sm uppercase tracking-wider flex justify-between items-center">
          <span>Staples Pantry (Local)</span>
          <span className="text-xs text-muted-foreground">{localSelected.length} selected</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <Input
          placeholder="Filter staples..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="bg-slate-900/50 border-slate-800 h-8 text-xs"
        />

        {/* Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {filteredBasics.map(item => {
            const isActive = localSelected.includes(item.name)
            return (
              <button
                type="button"
                key={item.name}
                onClick={() => handleToggle(item.name)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-bold transition-colors border',
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                )}
              >
                {item.name}
              </button>
            )
          })}
        </div>

        <p className="text-xs text-muted-foreground italic">
          Changes are local only. They will be saved to your pantry when you log the meal.
        </p>
      </CardContent>
    </Card>
  )
}
