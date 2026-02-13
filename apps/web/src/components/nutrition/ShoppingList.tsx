import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@repo/ui'
import { Recipe, getIngredientGaps, InventoryItem } from '@repo/shared'
import { useAuth } from '@/hooks/useAuth'

interface ShoppingListProps {
  selectedRecipe: Recipe | null
  rf?: number
}

export default function ShoppingList({ selectedRecipe, rf = 1.0 }: ShoppingListProps) {
  const { profile } = useAuth()

  const inventory = useMemo(() => {
    return (profile?.inventory as (InventoryItem | string)[]) || []
  }, [profile])

  const handleExport = async () => {
    if (!selectedRecipe) return

    const protein = Math.round(selectedRecipe.macros.protein * rf)
    const carbs = Math.round(selectedRecipe.macros.carbs * rf)
    const fat = Math.round(selectedRecipe.macros.fat * rf)

    const text = `
🛒 **Shopping List for ${selectedRecipe.label}**
----------------------------------------
*Adjusted for Daily Readiness: ${rf}x*

**Macros:**
- Protein: ${protein}g
- Carbs: ${carbs}g
- Fat: ${fat}g

**Ingredients:**
${selectedRecipe.ingredients.map(ing => `- [ ] ${ing.text}`).join('\n')}

**Instructions:**
(Check app for details)
    `.trim()

    try {
      await navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }
  const gaps = useMemo(() => {
    if (!selectedRecipe) return []
    return getIngredientGaps(inventory, selectedRecipe)
  }, [selectedRecipe, inventory])

  const fullList = [...gaps]

  return (
    <Card className="h-full border-border/50 bg-background/60">
      <CardHeader className="py-3">
        <CardTitle className="text-foreground text-sm uppercase tracking-wider flex justify-between items-center">
          <span>Shopping List</span>
          <span className="text-xs text-muted-foreground">{fullList.length} items</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedRecipe ? (
          <div className="rounded-md bg-secondary/30 p-3 mb-4">
            <p className="text-xs text-muted-foreground uppercase mb-1">For Recipe:</p>
            <p className="font-bold text-sm text-foreground">{selectedRecipe.label}</p>
          </div>
        ) : (
          <div className="rounded-md border border-dashed border-border/50 p-4 text-center">
            <p className="text-xs text-muted-foreground">Select a recipe to see missing items</p>
          </div>
        )}

        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {fullList.length === 0 && selectedRecipe && (
            <div className="text-center p-4">
              <span className="text-2xl">🎉</span>
              <p className="text-xs text-green-400 font-bold mt-2">You have everything!</p>
            </div>
          )}

          {fullList.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2 rounded bg-background/40 border border-border/20"
            >
              <div className="w-4 h-4 rounded-full border border-primary/50" />
              <span className="text-sm text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>

        {fullList.length > 0 && (
          <Button className="w-full mt-4" variant="outline" onClick={handleExport}>
            Export to Notes
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
