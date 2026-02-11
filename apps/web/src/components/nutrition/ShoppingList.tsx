import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@repo/ui'
import { ShoppingCart } from 'lucide-react'
import { type Recipe } from '@/lib/edamam'
import { useInventory } from '@/hooks/useInventory'

interface Props {
  selectedRecipe: Recipe | null
}

export default function ShoppingList({ selectedRecipe }: Props) {
  const { inventory } = useInventory()
  // Derived state to prevent infinite render loops
  const missingIngredients = useMemo(() => {
    if (!selectedRecipe) return []

    const inventoryLower = inventory.map(i => i.toLowerCase())

    return selectedRecipe.ingredientLines.filter(line => {
      // Check if this line is covered by any inventory item
      const isCovered = inventoryLower.some(invItem => line.toLowerCase().includes(invItem))
      return !isCovered
    })
  }, [selectedRecipe, inventory])

  if (!selectedRecipe) {
    return (
      <Card className="glass-card h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gap List</CardTitle>
          <span className="text-xs text-muted-foreground">0 items</span>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
          <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
          <p className="text-sm">Select a recipe to generate your automated shopping list.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gap List</CardTitle>
        <span className="text-xs text-muted-foreground">{missingIngredients.length} items</span>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          <h4 className="text-sm font-semibold mb-2">{selectedRecipe.label}</h4>
          {missingIngredients.length === 0 ? (
            <div className="text-xs text-green-500">You have all ingredients!</div>
          ) : (
            missingIngredients.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 text-xs text-muted-foreground border-b border-border/50 pb-1"
              >
                <span className="text-destructive">•</span>
                <span>{item}</span>
              </div>
            ))
          )}
        </div>

        <Button
          variant="outline"
          className="w-full text-xs mt-auto"
          disabled={missingIngredients.length === 0}
        >
          Send to Instacart ({missingIngredients.length})
        </Button>
      </CardContent>
    </Card>
  )
}
