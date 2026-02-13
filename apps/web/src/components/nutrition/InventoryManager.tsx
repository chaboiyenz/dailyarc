import { useState, useEffect } from 'react'
import { Input, Card, CardContent, CardHeader, CardTitle } from '@repo/ui'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'
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

export default function InventoryManager() {
  const { user, profile } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [localInventory, setLocalInventory] = useState<string[]>([])

  useEffect(() => {
    if (profile?.inventory) {
      const visibleItems = profile.inventory.map((i: string | { name: string }) =>
        typeof i === 'string' ? i : i.name
      )
      setLocalInventory(visibleItems)
    }
  }, [profile])

  const toggleItem = async (itemName: string) => {
    if (!user) return

    const exists = localInventory.includes(itemName)
    const newInventory = exists
      ? localInventory.filter(i => i !== itemName)
      : [...localInventory, itemName]

    setLocalInventory(newInventory) // Optimistic update

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        inventory: newInventory,
      })
    } catch (err) {
      console.error('Failed to update inventory:', err)
      // Revert on error
      if (profile?.inventory) {
        setLocalInventory(
          profile.inventory.map((i: string | { name: string }) =>
            typeof i === 'string' ? i : i.name
          )
        )
      }
    }
  }

  const filteredBasics = BASICS.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Card className="border-border bg-card">
      <CardHeader className="py-3">
        <CardTitle className="text-foreground text-sm uppercase tracking-wider flex justify-between items-center">
          <span>Staples Pantry</span>
          <span className="text-xs text-muted-foreground">{localInventory.length} active</span>
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
            const isActive = localInventory.includes(item.name)
            return (
              <button
                type="button"
                key={item.name}
                onClick={() => toggleItem(item.name)}
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
      </CardContent>
    </Card>
  )
}
