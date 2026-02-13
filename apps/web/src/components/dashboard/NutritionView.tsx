import { useState, useMemo, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@repo/ui'
import MacroRing from './MacroRing'
import QuickAddModal from '../nutrition/QuickAddModal'
import { cn } from '@repo/ui'
import {
  type Recipe,
  type NutritionTargets,
  calculateAdjustedMacros,
  getIngredientGaps,
  type InventoryItem,
} from '@repo/shared'
import { useAuth } from '@/hooks/useAuth'
import { useTodaysArc } from '@/hooks/useTodaysArc'
import {
  useTodaysMealLogs,
  logMealToFirestore,
  logManualMealToFirestore,
} from '@/hooks/useMealLogs'
import { searchRecipes } from '@/lib/edamam'

const BASE_TARGETS: NutritionTargets = {
  calories: 2500,
  protein: 180,
  carbs: 250,
  fat: 70,
}

export default function NutritionView() {
  const { user, profile } = useAuth()
  const { data: todaysArc } = useTodaysArc(user?.uid || null)
  const { logs, consumed, isLoading, syncStatus, error } = useTodaysMealLogs(user?.uid || null)

  // RF from dailyArcs (single source of truth)
  const rf = todaysArc?.readinessFactor ?? 1.0
  const targets = useMemo(() => calculateAdjustedMacros(BASE_TARGETS, rf), [rf])

  // Calculate total calories from macros (in useMemo for consistency)
  const totalCalories = useMemo(() => {
    return consumed.protein * 4 + consumed.carbs * 4 + consumed.fat * 9
  }, [consumed])

  // Recipes
  const [searchQuery, setSearchQuery] = useState('')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [recipesLoading, setRecipesLoading] = useState(true)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [logLoading, setLogLoading] = useState(false)

  // Quick-Add Modal
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  // Ingredient filter badges
  const FILTER_INGREDIENTS = [
    'Chicken',
    'Eggs',
    'Rice',
    'Potatoes',
    'Oats',
    'Milk',
    'Spinach',
    'Broccoli',
    'Banana',
    'Berries',
    'Pasta',
    'Bread',
    'Avocado',
    'Nuts',
    'Yogurt',
    'Beef',
  ]
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set())

  // Inventory from profile
  const inventory = useMemo<(InventoryItem | string)[]>(() => {
    return (profile?.inventory as (InventoryItem | string)[]) || []
  }, [profile])

  // Check if Recovery Prompt should show (no logs by 6 PM)
  const showRecoveryPrompt = useMemo(() => {
    const now = new Date()
    const hour = now.getHours()
    const hasLogs = logs.length > 0
    return hour >= 18 && !hasLogs // 6 PM = 18:00
  }, [logs])

  // Initial recipe load
  useEffect(() => {
    loadRecipes('')
  }, [])

  const loadRecipes = async (q: string) => {
    setRecipesLoading(true)
    const results = await searchRecipes(q)
    setRecipes(results)
    setRecipesLoading(false)
  }

  // Filter and sort by inventory match and selected ingredients
  const filteredRecipes = useMemo(() => {
    let filtered = recipes

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        r =>
          r.label.toLowerCase().includes(q) ||
          r.ingredients.some(i => i.food.toLowerCase().includes(q))
      )
    }

    // Filter by selected ingredients
    if (selectedIngredients.size > 0) {
      filtered = filtered.filter(recipe => {
        const recipeIngredientNames = recipe.ingredients.map(i => i.food.toLowerCase())
        return Array.from(selectedIngredients).every(ing =>
          recipeIngredientNames.some(recipeIng => recipeIng.includes(ing.toLowerCase()))
        )
      })
    }

    return [...filtered]
      .sort((a, b) => {
        const gapsA = getIngredientGaps(inventory, a).length
        const gapsB = getIngredientGaps(inventory, b).length
        return gapsA - gapsB
      })
      .slice(0, 8)
  }, [recipes, searchQuery, inventory, selectedIngredients])

  const handleLogMeal = async (recipe: Recipe) => {
    if (!user) return
    setLogLoading(true)
    try {
      await logMealToFirestore(user.uid, recipe, rf)
      setSelectedRecipe(null)
    } catch (err) {
      console.error('Failed to log meal:', err)
    } finally {
      setLogLoading(false)
    }
  }

  const handleLogManual = async (entry: {
    title: string
    calories: number
    macros: { protein: number; carbs: number; fat: number }
  }) => {
    if (!user) return
    await logManualMealToFirestore(user.uid, entry.title, entry.macros, entry.calories, rf)
  }

  const toggleIngredientFilter = (ingredient: string) => {
    const newSelected = new Set(selectedIngredients)
    if (newSelected.has(ingredient)) {
      newSelected.delete(ingredient)
    } else {
      newSelected.add(ingredient)
    }
    setSelectedIngredients(newSelected)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* ─── 1. Nutrition Engine Analytics (Top) ─── */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  NUTRITION ENGINE
                </h2>
                <div className="px-2 py-0.5 rounded bg-secondary text-xs font-bold text-muted-foreground">
                  RF: {rf.toFixed(2)}x
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {isLoading || syncStatus === 'syncing' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="animate-spin">⚙️</span>
                    Fetching your data...
                  </span>
                ) : (
                  <>
                    {totalCalories} / {targets.calories} kcal consumed today
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <MacroRing
                label="Protein"
                current={consumed.protein}
                target={targets.protein}
                unit="g"
                color="hsl(var(--chart-protein))"
                size={90}
              />
              <MacroRing
                label="Carbs"
                current={consumed.carbs}
                target={targets.carbs}
                unit="g"
                color="hsl(var(--chart-carbs))"
                size={90}
              />
              <MacroRing
                label="Fat"
                current={consumed.fat}
                target={targets.fat}
                unit="g"
                color="hsl(var(--chart-fat))"
                size={90}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Syncing Status (when index is building) ─── */}
      {syncStatus === 'syncing' && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin">
                <span className="text-xl">⚙️</span>
              </div>
              <div>
                <p className="text-sm font-medium text-blue-100">Syncing your nutrition data...</p>
                <p className="text-xs text-blue-200/70 mt-1">
                  {error || 'Setting up real-time tracking. This should only happen once.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── 2. Recipe Grid (8 cards) ─── */}
      <div>
        <div className="space-y-3 mb-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search recipes (e.g. 'Chicken', 'Keto')..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadRecipes(searchQuery)}
              className="bg-slate-900 border-slate-800 h-10 text-sm"
            />
            <Button
              onClick={() => loadRecipes(searchQuery)}
              disabled={recipesLoading}
              className="px-6"
            >
              {recipesLoading ? '...' : 'Find'}
            </Button>
          </div>

          {/* Ingredient Filter Badges */}
          <div className="flex flex-wrap gap-2">
            {FILTER_INGREDIENTS.map(ingredient => (
              <button
                key={ingredient}
                onClick={() => toggleIngredientFilter(ingredient)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-bold transition-all border',
                  selectedIngredients.has(ingredient)
                    ? 'bg-primary text-primary-foreground border-primary shadow-md'
                    : 'bg-slate-800 text-muted-foreground border-slate-700 hover:border-slate-600'
                )}
              >
                {ingredient}
              </button>
            ))}
            {selectedIngredients.size > 0 && (
              <button
                onClick={() => setSelectedIngredients(new Set())}
                className="px-3 py-1.5 rounded-full text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        {/* Vertical Portrait Recipe Cards Grid */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {recipesLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-slate-900/50" />
            ))
          ) : filteredRecipes.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-sm mb-4">No recipes match your filters.</p>
              <button
                onClick={() => setQuickAddOpen(true)}
                className="text-primary hover:text-primary/80 font-semibold text-sm"
              >
                Open Staple Builder →
              </button>
            </div>
          ) : (
            filteredRecipes.map(recipe => (
              <div
                key={recipe.id}
                onClick={() => setSelectedRecipe(recipe)}
                className="aspect-[3/4] rounded-xl overflow-hidden border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition-all cursor-pointer group flex flex-col"
              >
                {/* Image Section - 70% of card height with gradient overlay */}
                <div className="relative h-[70%] w-full shrink-0 overflow-hidden bg-slate-800">
                  {recipe.image ? (
                    <>
                      <img
                        src={recipe.image}
                        alt={recipe.label}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Dark gradient overlay at bottom for text legibility */}
                      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-800">
                      🍳
                    </div>
                  )}
                  {/* Plus icon overlay hint */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/20">
                    <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-xl">
                      +
                    </div>
                  </div>
                </div>

                {/* Content Section - 30% of card height */}
                <div className="h-[30%] p-2.5 flex flex-col justify-between">
                  {/* Title */}
                  <h3 className="font-semibold text-foreground text-xs line-clamp-2 leading-tight">
                    {recipe.label}
                  </h3>

                  {/* Macro Badges - Compact Layout */}
                  <div className="space-y-1">
                    {/* Calories - Prominent */}
                    <div className="text-[10px] font-bold text-slate-300">
                      {recipe.calories} <span className="text-muted-foreground">kcal</span>
                    </div>
                    {/* P | C | F - Compact Row */}
                    <div className="flex gap-2 text-[9px] font-semibold text-muted-foreground">
                      <span className="text-primary">{recipe.macros.protein}g</span>
                      <span>|</span>
                      <span className="text-emerald-400">{recipe.macros.carbs}g</span>
                      <span>|</span>
                      <span className="text-orange-400">{recipe.macros.fat}g</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── 3. Recipe Detail Modal ─── */}
      <Dialog open={!!selectedRecipe} onOpenChange={() => setSelectedRecipe(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          {selectedRecipe && (
            <RecipeModal
              recipe={selectedRecipe}
              onLogMeal={handleLogMeal}
              logLoading={logLoading}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ─── 5. Recovery Prompt (if after 6 PM and no meals) ─── */}
      {showRecoveryPrompt && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl mt-0.5">⚠️</span>
              <div>
                <p className="text-sm font-medium text-amber-100">
                  Keep your arc consistent—log your fuel for today.
                </p>
                <p className="text-xs text-amber-200/70 mt-1">
                  It's {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},
                  and you haven't logged any meals yet.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── 6. Recent Meal Logs (real-time) ─── */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2">
            Today's Meals
            {syncStatus === 'syncing' && (
              <span className="inline-flex text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300 gap-1">
                <span className="animate-spin">●</span>
                Syncing
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{logs.length} logged</span>
            <Button
              onClick={() => setQuickAddOpen(true)}
              size="sm"
              className="bg-primary hover:bg-primary/90"
            >
              + Quick Log
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <span className="animate-spin">⚙️</span>
              <span className="text-sm">Loading your meal logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground text-sm">
              No meals logged yet. Click a recipe above to log it.
            </div>
          ) : (
            logs.map(log => (
              <div
                key={log.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-secondary/30 px-4 py-3"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-800">
                  <span className="text-lg">{log.type === 'MANUAL' ? '✏️' : '📖'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate block">
                      {log.recipeName}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                      {log.type === 'MANUAL' ? 'Manual' : 'Recipe'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex gap-4 text-right shrink-0">
                  <div className="text-xs text-muted-foreground">
                    <span className="font-bold text-foreground">{log.macros.protein}</span>p
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-bold text-foreground">{log.macros.carbs}</span>c
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-bold text-foreground">{log.macros.fat}</span>f
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* ─── Quick Add Modal ─── */}
      <QuickAddModal
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        onLogManual={handleLogManual}
        inventory={inventory}
      />
    </div>
  )
}

/**
 * Recipe detail modal with ingredients list and source link.
 */
function RecipeModal({
  recipe,
  onLogMeal,
  logLoading,
}: {
  recipe: Recipe
  onLogMeal: (recipe: Recipe) => void
  logLoading: boolean
}) {
  // Get the best available image: prefer recipe image, fallback to first ingredient image
  const bestImage = recipe.image || recipe.ingredients.find(ing => ing.image)?.image

  return (
    <>
      <DialogHeader className="border-b border-slate-800 pb-4">
        <DialogTitle className="text-center text-xl font-bold">{recipe.label}</DialogTitle>
      </DialogHeader>

      <div className="space-y-6">
        {/* Best available image with fallback */}
        {bestImage && (
          <div className="w-full max-w-sm mx-auto rounded-lg overflow-hidden bg-slate-800 aspect-video">
            <img
              src={bestImage}
              alt={recipe.label}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={e => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </div>
        )}

        {/* Macros - Center-Aligned Grid */}
        <div className="flex justify-center gap-4 text-xs font-semibold">
          <div className="flex flex-col items-center">
            <div className="text-lg font-bold text-slate-300">{recipe.calories}</div>
            <div className="text-muted-foreground text-[10px]">kcal</div>
          </div>
          <div className="w-px bg-slate-700" />
          <div className="flex flex-col items-center">
            <div className="text-lg font-bold text-primary">{recipe.macros.protein}g</div>
            <div className="text-muted-foreground text-[10px]">Protein</div>
          </div>
          <div className="w-px bg-slate-700" />
          <div className="flex flex-col items-center">
            <div className="text-lg font-bold text-emerald-400">{recipe.macros.carbs}g</div>
            <div className="text-muted-foreground text-[10px]">Carbs</div>
          </div>
          <div className="w-px bg-slate-700" />
          <div className="flex flex-col items-center">
            <div className="text-lg font-bold text-orange-400">{recipe.macros.fat}g</div>
            <div className="text-muted-foreground text-[10px]">Fat</div>
          </div>
        </div>

        {/* Ingredients list - Clean centered layout */}
        <div className="max-w-sm mx-auto w-full">
          <h4 className="text-xs font-bold uppercase tracking-wide text-primary mb-3">
            Ingredients
          </h4>
          <ul className="space-y-2">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="shrink-0 text-primary font-bold mt-0.5">•</span>
                <span>{ing.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Preparation instructions - Centered block */}
        {recipe.preparation && (
          <div className="max-w-sm mx-auto w-full rounded-lg bg-slate-800/50 border border-slate-700 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wide text-primary mb-2">
              HOW TO PREPARE
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">{recipe.preparation}</p>
          </div>
        )}

        {/* Log Meal button - Full width */}
        <Button className="w-full" onClick={() => onLogMeal(recipe)} disabled={logLoading}>
          {logLoading ? 'Logging...' : 'Add to Daily Log'}
        </Button>
      </div>
    </>
  )
}
