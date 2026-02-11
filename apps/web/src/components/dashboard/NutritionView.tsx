import { useState } from 'react'
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@repo/ui'
import MacroRing from './MacroRing'

const COMMON_INGREDIENTS = [
  'Chicken Breast', 'Rice', 'Broccoli', 'Eggs', 'Oats',
  'Sweet Potato', 'Banana', 'Greek Yogurt', 'Almonds', 'Salmon',
  'Spinach', 'Avocado', 'Quinoa', 'Cottage Cheese', 'Olive Oil',
  'Tuna', 'Brown Rice', 'Blueberries', 'Whey Protein', 'Peanut Butter',
]

interface MealEntry {
  id: string
  name: string
  time: string
  macros: { p: number; c: number; f: number }
}

const DEMO_MEALS: MealEntry[] = [
  { id: '1', name: 'Greek Yogurt Bowl', time: '08:30', macros: { p: 42, c: 38, f: 12 } },
  { id: '2', name: 'Chicken & Rice Bowl', time: '12:30', macros: { p: 48, c: 62, f: 14 } },
  { id: '3', name: 'Protein Shake', time: '15:00', macros: { p: 30, c: 8, f: 3 } },
]

export default function NutritionView() {
  const [inventory, setInventory] = useState<string[]>(['Chicken Breast', 'Rice', 'Broccoli', 'Eggs', 'Oats', 'Greek Yogurt'])
  const [newItem, setNewItem] = useState('')
  const [meals] = useState<MealEntry[]>(DEMO_MEALS)
  const [showQuickScan, setShowQuickScan] = useState(false)

  const totalMacros = meals.reduce(
    (acc, m) => ({
      p: acc.p + m.macros.p,
      c: acc.c + m.macros.c,
      f: acc.f + m.macros.f,
    }),
    { p: 0, c: 0, f: 0 }
  )

  const totalCalories = totalMacros.p * 4 + totalMacros.c * 4 + totalMacros.f * 9

  const addItem = () => {
    if (newItem.trim() && !inventory.includes(newItem.trim())) {
      setInventory(prev => [...prev, newItem.trim()])
      setNewItem('')
    }
  }

  const removeItem = (item: string) => {
    setInventory(prev => prev.filter(i => i !== item))
  }

  const toggleQuickItem = (item: string) => {
    if (inventory.includes(item)) {
      removeItem(item)
    } else {
      setInventory(prev => [...prev, item])
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Calorie Summary */}
      <Card className="border-border bg-card">
        <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-foreground">NUTRITION ENGINE</h2>
            <p className="text-sm text-muted-foreground">
              {totalCalories} kcal consumed -- {2340 - totalCalories} kcal remaining
            </p>
          </div>
          <div className="flex items-center gap-6">
            <MacroRing label="Protein" current={totalMacros.p} target={180} unit="g" color="hsl(var(--chart-protein))" size={90} />
            <MacroRing label="Carbs" current={totalMacros.c} target={250} unit="g" color="hsl(var(--chart-carbs))" size={90} />
            <MacroRing label="Fat" current={totalMacros.f} target={70} unit="g" color="hsl(var(--chart-fat))" size={90} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Meal Log */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Today's Meals</CardTitle>
            <Button size="sm" variant="outline" className="text-xs">
              + Log Meal
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {meals.map(meal => (
              <div key={meal.id} className="flex items-center gap-4 rounded-xl border border-border bg-secondary/30 px-4 py-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--chart-fat)/0.1)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--chart-fat))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a5 5 0 0 1 5 5c0 2-1.5 3.5-3 4.5V22h-4v-10.5C8.5 10.5 7 9 7 7a5 5 0 0 1 5-5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">{meal.name}</span>
                  <p className="text-xs text-muted-foreground">{meal.time}</p>
                </div>
                <div className="flex gap-4 text-right">
                  <div>
                    <span className="font-mono text-xs font-bold text-[hsl(var(--chart-protein))]">{meal.macros.p}g</span>
                    <p className="text-xs text-muted-foreground">P</p>
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-[hsl(var(--chart-carbs))]">{meal.macros.c}g</span>
                    <p className="text-xs text-muted-foreground">C</p>
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-[hsl(var(--chart-fat))]">{meal.macros.f}g</span>
                    <p className="text-xs text-muted-foreground">F</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Calorie Bar */}
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Daily Progress</span>
                <span className="font-mono font-bold text-foreground">{totalCalories} / 2,340 kcal</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-[hsl(var(--primary))] transition-all"
                  style={{ width: `${Math.min((totalCalories / 2340) * 100, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Manager */}
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Pantry Inventory</CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={() => setShowQuickScan(!showQuickScan)}
            >
              {showQuickScan ? 'Hide Quick Add' : 'Quick Scan'}
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Quick Scan Grid */}
            {showQuickScan && (
              <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-secondary/30 p-4">
                {COMMON_INGREDIENTS.map(item => (
                  <button
                    key={item}
                    onClick={() => toggleQuickItem(item)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                      inventory.includes(item)
                        ? 'border-[hsl(var(--chart-carbs))] bg-[hsl(var(--chart-carbs)/0.1)] text-[hsl(var(--chart-carbs))]'
                        : 'border-border bg-background text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {inventory.includes(item) ? '- ' : '+ '}
                    {item}
                  </button>
                ))}
              </div>
            )}

            {/* Manual Add */}
            <div className="flex gap-2">
              <Input
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                placeholder="Add ingredient..."
                className="bg-background text-foreground"
                onKeyDown={e => e.key === 'Enter' && addItem()}
              />
              <Button onClick={addItem} size="sm">
                Add
              </Button>
            </div>

            {/* Current Inventory */}
            <div className="flex flex-wrap gap-2">
              {inventory.map(item => (
                <span
                  key={item}
                  className="flex items-center gap-1.5 rounded-lg bg-[hsl(var(--primary)/0.1)] px-3 py-1.5 text-xs font-medium text-[hsl(var(--primary))]"
                >
                  {item}
                  <button
                    onClick={() => removeItem(item)}
                    className="ml-0.5 text-[hsl(var(--primary)/0.6)] hover:text-[hsl(var(--primary))]"
                    aria-label={`Remove ${item}`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>

            <p className="text-xs text-muted-foreground">
              {inventory.length} items in inventory -- Recipe suggestions based on available ingredients.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
