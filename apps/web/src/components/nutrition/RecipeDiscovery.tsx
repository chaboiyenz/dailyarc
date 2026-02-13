import { useState, useEffect, useMemo } from 'react'
import { Card, Button, Input } from '@repo/ui'
import { searchRecipes } from '@/lib/edamam'
import { type Recipe, getIngredientGaps, type InventoryItem } from '@repo/shared'
import { useAuth } from '@/hooks/useAuth'

interface RecipeDiscoveryProps {
  onSelectRecipe?: (recipe: Recipe) => void
  onLogMeal?: (recipe: Recipe) => void
}

export default function RecipeDiscovery({ onSelectRecipe, onLogMeal }: RecipeDiscoveryProps) {
  const { profile } = useAuth()
  const [query, setQuery] = useState('')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [inventory, setInventory] = useState<(InventoryItem | string)[]>([])

  useEffect(() => {
    if (profile?.inventory) {
      setInventory(profile.inventory as (InventoryItem | string)[])
    }
  }, [profile])

  const handleSearch = async () => {
    setLoading(true)
    const results = await searchRecipes(query)
    setRecipes(results)
    setLoading(false)
  }

  // Initial load — fetch all recipes
  useEffect(() => {
    handleSearch()
  }, [])

  // Real-time title filter + sort by inventory availability
  const filteredRecipes = useMemo(() => {
    let filtered = recipes

    // Real-time title filter
    if (query.trim()) {
      const q = query.toLowerCase()
      filtered = filtered.filter(
        r =>
          r.label.toLowerCase().includes(q) ||
          r.ingredients.some(i => i.food.toLowerCase().includes(q))
      )
    }

    // Sort: fewest gaps first (ready to cook = top)
    return [...filtered].sort((a, b) => {
      const gapsA = getIngredientGaps(inventory, a).length
      const gapsB = getIngredientGaps(inventory, b).length
      return gapsA - gapsB
    })
  }, [recipes, query, inventory])

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex gap-2">
        <Input
          placeholder="Search recipes (e.g. 'Chicken', 'Keto')..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="bg-slate-900/50 border-slate-800 h-10 text-sm"
        />
        <Button onClick={handleSearch} disabled={loading} className="px-6">
          {loading ? '...' : 'Find'}
        </Button>
      </div>

      <div className="grid gap-3 overflow-y-auto pr-2 pb-20 max-h-[600px] scrollbar-hide">
        {filteredRecipes.map(recipe => {
          const gaps = getIngredientGaps(inventory, recipe)
          const isReady = gaps.length === 0

          return (
            <Card
              key={recipe.id}
              onClick={() => onSelectRecipe?.(recipe)}
              className="overflow-hidden border-border/50 bg-slate-950 hover:bg-slate-900 transition-colors group cursor-pointer"
            >
              <div className="flex flex-row h-28">
                <div className="w-28 h-full bg-slate-800 shrink-0 overflow-hidden relative">
                  {recipe.image ? (
                    <img
                      src={recipe.image}
                      alt={recipe.label}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🍳
                    </div>
                  )}
                  {isReady && (
                    <div className="absolute top-1 left-1 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                      READY
                    </div>
                  )}
                </div>

                <div className="p-3 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="font-bold text-foreground line-clamp-1 text-sm">
                      {recipe.label}
                    </h3>
                    <div className="flex gap-2 text-[10px] text-muted-foreground mt-1">
                      <span>{recipe.calories} kcal</span>
                      <span className="text-primary font-bold">{recipe.macros.protein}g P</span>
                      <span>{recipe.macros.carbs}g C</span>
                      <span>{recipe.macros.fat}g F</span>
                    </div>
                  </div>

                  <div className="mt-1 flex items-center justify-between">
                    {isReady ? (
                      <div className="text-[10px] text-green-400 font-mono flex items-center gap-1">
                        <span>✅ Ready to Cook</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-[9px] text-orange-400 font-bold uppercase mr-1">
                          Missing:
                        </span>
                        {gaps.slice(0, 3).map((g, i) => (
                          <span
                            key={i}
                            className="text-[9px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-slate-400 truncate max-w-[60px]"
                          >
                            {g}
                          </span>
                        ))}
                        {gaps.length > 3 && (
                          <span className="text-[9px] text-muted-foreground">
                            +{gaps.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Log Meal Button */}
                    {onLogMeal && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[10px] font-bold"
                        onClick={e => {
                          e.stopPropagation() // Don't trigger card click
                          onLogMeal(recipe)
                        }}
                      >
                        Log Meal
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
