import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Skeleton } from '@repo/ui'
import { fetchInventoryMatches, type Recipe } from '@/lib/edamam'
import { useInventory } from '@/hooks/useInventory'

interface Props {
  onSelectRecipe: (recipe: Recipe) => void
}

export default function RecipeSuggestions({ onSelectRecipe }: Props) {
  const { inventory } = useInventory()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadRecipes() {
      if (inventory.length === 0) return
      setLoading(true)
      try {
        const matches = await fetchInventoryMatches(inventory)
        setRecipes(matches)
      } catch (error) {
        console.error('Failed to load recipes', error)
      } finally {
        setLoading(false)
      }
    }

    loadRecipes()
  }, [inventory])

  if (inventory.length === 0) {
    return (
      <Card className="glass-card h-full flex items-center justify-center p-8 text-center text-muted-foreground">
        <div>
          <h3 className="text-lg font-bold mb-2">No Ingredients</h3>
          <p className="text-sm">Add items to your pantry to see recipe suggestions.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="glass-card h-full flex flex-col">
      <CardHeader>
        <CardTitle>Smart Suggestions</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pr-2">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No matching recipes found. Try adding more common ingredients.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {recipes.map((recipe, idx) => (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-xl border border-border bg-card/50 transition-all hover:bg-card"
              >
                {/* Image Background */}
                <div className="aspect-video w-full overflow-hidden">
                  <img
                    src={recipe.image}
                    alt={recipe.label}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-white line-clamp-1">{recipe.label}</h4>
                      <div className="flex gap-3 text-xs text-slate-300 mt-1">
                        <span>{Math.round(recipe.calories)} cal</span>
                        <span>{Math.round(recipe.totalNutrients.PROCNT.quantity)}g Protein</span>
                      </div>
                    </div>
                    {/* Match Badge */}
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-lg">
                      {recipe.matchPercentage}%
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2 opacity-0 transform translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                    <Button
                      size="sm"
                      className="w-full text-xs"
                      variant="secondary"
                      onClick={() => onSelectRecipe(recipe)}
                    >
                      View Gap List
                    </Button>
                    <Button size="sm" className="w-full text-xs">
                      Log Meal
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
