import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui'
import { type InventoryItem } from '@repo/shared'
import LocalInventoryManager from './LocalInventoryManager'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

interface QuickAddModalProps {
  open: boolean
  onClose: () => void
  onLogManual: (entry: {
    title: string
    calories: number
    macros: { protein: number; carbs: number; fat: number }
  }) => Promise<void>
  inventory: (InventoryItem | string)[]
}

// Standard portion sizes for common items (grams -> macros per 100g baseline)
const STAPLE_MACROS: Record<
  string,
  { protein: number; carbs: number; fat: number; calories: number }
> = {
  // Proteins
  'chicken breast': { protein: 31, carbs: 0, fat: 3.6, calories: 165 },
  'ground beef': { protein: 17, carbs: 0, fat: 15, calories: 217 },
  salmon: { protein: 25, carbs: 0, fat: 13, calories: 208 },
  eggs: { protein: 13, carbs: 1.1, fat: 11, calories: 155 },
  'greek yogurt': { protein: 10, carbs: 3.6, fat: 5, calories: 100 },
  'cottage cheese': { protein: 11, carbs: 3.4, fat: 5, calories: 98 },
  tuna: { protein: 29, carbs: 0, fat: 1.3, calories: 132 },
  turkey: { protein: 29, carbs: 0, fat: 1.3, calories: 135 },

  // Carbs
  rice: { protein: 2.7, carbs: 28, fat: 0.3, calories: 130 },
  oats: { protein: 10, carbs: 66, fat: 7, calories: 389 },
  pasta: { protein: 5.3, carbs: 71, fat: 1.1, calories: 371 },
  'sweet potato': { protein: 1.6, carbs: 20, fat: 0.1, calories: 86 },
  'brown rice': { protein: 2.6, carbs: 23, fat: 1, calories: 111 },
  bread: { protein: 9, carbs: 49, fat: 3.3, calories: 265 },
  quinoa: { protein: 14, carbs: 57, fat: 6, calories: 368 },

  // Fats
  'olive oil': { protein: 0, carbs: 0, fat: 100, calories: 884 },
  'peanut butter': { protein: 25, carbs: 20, fat: 50, calories: 588 },
  almonds: { protein: 21, carbs: 22, fat: 50, calories: 579 },
  avocado: { protein: 3, carbs: 9, fat: 15, calories: 160 },

  // Vegetables
  broccoli: { protein: 2.8, carbs: 7, fat: 0.4, calories: 34 },
  spinach: { protein: 2.7, carbs: 3.6, fat: 0.4, calories: 23 },
  carrots: { protein: 0.9, carbs: 10, fat: 0.2, calories: 41 },
  'bell pepper': { protein: 0.9, carbs: 6, fat: 0.3, calories: 31 },
}

export function QuickAddModal({ open, onClose, onLogManual, inventory }: QuickAddModalProps) {
  const { user } = useAuth()
  const [manualTitle, setManualTitle] = useState('')
  const [manualCalories, setManualCalories] = useState(500)
  const [manualProtein, setManualProtein] = useState(30)
  const [manualCarbs, setManualCarbs] = useState(50)
  const [manualFat, setManualFat] = useState(15)
  const [isLogging, setIsLogging] = useState(false)

  // Staple Builder state — LOCAL ONLY (doesn't update Firestore until commit)
  const [selectedStaples, setSelectedStaples] = useState<Record<string, boolean>>({})
  const [staplePortion, setStaplePortion] = useState<Record<string, number>>({})

  // Local inventory state for pantry manager
  const [localInventory, setLocalInventory] = useState<string[]>(() => {
    return inventory.map(i => (typeof i === 'string' ? i : i.name))
  })

  // Get available staples from LOCAL inventory only
  const availableStaples = useMemo(() => {
    const inventoryLower = localInventory.map(item => item.toLowerCase())
    return Object.keys(STAPLE_MACROS).filter(staple =>
      inventoryLower.some(inv => inv.includes(staple) || staple.includes(inv))
    )
  }, [localInventory])

  // Calculate staple totals
  const stapleTotals = useMemo(() => {
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0
    let totalCalories = 0

    Object.entries(selectedStaples).forEach(([staple, selected]) => {
      if (selected) {
        const macros = STAPLE_MACROS[staple]
        const portion = staplePortion[staple] || 100 // Default 100g
        const multiplier = portion / 100

        totalProtein += macros.protein * multiplier
        totalCarbs += macros.carbs * multiplier
        totalFat += macros.fat * multiplier
        totalCalories += macros.calories * multiplier
      }
    })

    return {
      protein: Math.round(totalProtein),
      carbs: Math.round(totalCarbs),
      fat: Math.round(totalFat),
      calories: Math.round(totalCalories),
    }
  }, [selectedStaples, staplePortion])

  const handleLogManual = async () => {
    if (!manualTitle.trim()) {
      alert('Please enter a title')
      return
    }

    setIsLogging(true)
    try {
      await onLogManual({
        title: manualTitle,
        calories: manualCalories,
        macros: {
          protein: manualProtein,
          carbs: manualCarbs,
          fat: manualFat,
        },
      })

      // Reset form
      setManualTitle('')
      setManualCalories(500)
      setManualProtein(30)
      setManualCarbs(50)
      setManualFat(15)
      onClose()
    } catch (err) {
      console.error('Failed to log manual meal:', err)
      alert('Failed to log meal')
    } finally {
      setIsLogging(false)
    }
  }

  const handleLogStaple = async () => {
    const selectedCount = Object.values(selectedStaples).filter(Boolean).length
    if (selectedCount === 0) {
      alert('Please select at least one staple')
      return
    }

    const stapleNames = Object.entries(selectedStaples)
      .filter(([, selected]) => selected)
      .map(([name]) => name)
      .join(', ')

    setIsLogging(true)
    try {
      // 1. Save the meal
      await onLogManual({
        title: `Staple: ${stapleNames}`,
        calories: stapleTotals.calories,
        macros: {
          protein: stapleTotals.protein,
          carbs: stapleTotals.carbs,
          fat: stapleTotals.fat,
        },
      })

      // 2. Commit inventory changes to Firestore
      if (user?.uid) {
        await updateDoc(doc(db, 'users', user.uid), {
          inventory: localInventory,
        })
      }

      // 3. Reset form and close
      resetAllState()
      onClose()
    } catch (err) {
      console.error('Failed to log staple meal:', err)
      alert('Failed to log meal')
    } finally {
      setIsLogging(false)
    }
  }

  const resetAllState = () => {
    setManualTitle('')
    setManualCalories(500)
    setManualProtein(30)
    setManualCarbs(50)
    setManualFat(15)
    setSelectedStaples({})
    setStaplePortion({})
    setLocalInventory(inventory.map(i => (typeof i === 'string' ? i : i.name)))
  }

  const handleCancel = () => {
    resetAllState()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Log Meal</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Input</TabsTrigger>
            <TabsTrigger value="staples">
              Staple Builder {availableStaples.length > 0 && `(${availableStaples.length})`}
            </TabsTrigger>
          </TabsList>

          {/* Manual Input Tab */}
          <TabsContent value="manual" className="space-y-5 mt-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Meal Title</label>
              <Input
                placeholder="e.g. Breakfast, Lunch, Snack..."
                value={manualTitle}
                onChange={e => setManualTitle(e.target.value)}
                className="bg-slate-900 border-slate-800"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Calories: {manualCalories}
              </label>
              <input
                type="range"
                min="0"
                max="2000"
                step="10"
                value={manualCalories}
                onChange={e => setManualCalories(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Protein: {manualProtein}g
              </label>
              <input
                type="range"
                min="0"
                max="200"
                step="1"
                value={manualProtein}
                onChange={e => setManualProtein(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Carbs: {manualCarbs}g
              </label>
              <input
                type="range"
                min="0"
                max="300"
                step="1"
                value={manualCarbs}
                onChange={e => setManualCarbs(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Fat: {manualFat}g
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={manualFat}
                onChange={e => setManualFat(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            <div className="bg-secondary/30 rounded-lg p-4 text-sm text-muted-foreground">
              <p>Calculated calories: {manualProtein * 4 + manualCarbs * 4 + manualFat * 9} kcal</p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleLogManual} disabled={isLogging} className="flex-1">
                {isLogging ? 'Logging...' : '✏️ Log Manual Entry'}
              </Button>
              <Button
                onClick={handleCancel}
                disabled={isLogging}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </TabsContent>

          {/* Staple Builder Tab */}
          <TabsContent value="staples" className="space-y-5 mt-5">
            {/* Pantry Manager — LOCAL STATE ONLY */}
            <div className="border-b border-border pb-5">
              <LocalInventoryManager
                initialInventory={inventory}
                onSelectionChange={setLocalInventory}
              />
            </div>

            {availableStaples.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No staples found in your inventory. Add ingredients to your pantry first.
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {availableStaples.map(staple => (
                    <div key={staple} className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedStaples[staple] || false}
                          onChange={e =>
                            setSelectedStaples(prev => ({
                              ...prev,
                              [staple]: e.target.checked,
                            }))
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium text-foreground capitalize">
                          {staple}
                        </span>
                      </label>

                      {selectedStaples[staple] && (
                        <div className="ml-6">
                          <label className="block text-xs text-muted-foreground mb-1">
                            Portion: {staplePortion[staple] || 100}g
                          </label>
                          <input
                            type="range"
                            min="10"
                            max="500"
                            step="10"
                            value={staplePortion[staple] || 100}
                            onChange={e =>
                              setStaplePortion(prev => ({
                                ...prev,
                                [staple]: Number(e.target.value),
                              }))
                            }
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="bg-secondary/30 rounded-lg p-4 space-y-1 text-sm">
                  <p className="text-foreground font-medium">Total: {stapleTotals.calories} kcal</p>
                  <p className="text-muted-foreground text-xs">
                    P: {stapleTotals.protein}g | C: {stapleTotals.carbs}g | F: {stapleTotals.fat}g
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleLogStaple} disabled={isLogging} className="flex-1">
                    {isLogging ? 'Saving...' : '✅ Log Meal & Update Pantry'}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    disabled={isLogging}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
export default QuickAddModal
