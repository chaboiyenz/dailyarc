export interface Recipe {
  label: string
  image: string
  url: string
  calories: number
  totalNutrients: {
    PROCNT: { quantity: number; unit: string }
    CHOCDF: { quantity: number; unit: string }
    FAT: { quantity: number; unit: string }
  }
  ingredientLines: string[]
  matchPercentage?: number // Calculated locally
}

interface EdamamResponse {
  hits: {
    recipe: Recipe
  }[]
}

const APP_ID = import.meta.env.VITE_EDAMAM_APP_ID
const APP_KEY = import.meta.env.VITE_EDAMAM_APP_KEY

// Helper to calculate match percentage
function calculateMatch(recipeIngredients: string[], pantryInventory: string[]): number {
  if (!recipeIngredients || recipeIngredients.length === 0) return 0

  let matchCount = 0
  const lowercaseInventory = pantryInventory.map(i => i.toLowerCase())

  recipeIngredients.forEach(line => {
    // Simple check: does the ingredient line contain any pantry item?
    // This is a naive check. A better one would parse ingredients.
    const hasMatch = lowercaseInventory.some(item => line.toLowerCase().includes(item))
    if (hasMatch) matchCount++
  })

  return Math.round((matchCount / recipeIngredients.length) * 100)
}

export async function fetchInventoryMatches(inventory: string[]): Promise<Recipe[]> {
  if (!inventory || inventory.length === 0) return []
  if (!APP_ID || !APP_KEY) {
    console.warn('Edamam API credentials missing')
    return []
  }

  // Construct query: "chicken rice broccoli"
  // We take up to 3-4 items to avoid over-constraining the search
  const query = inventory.slice(0, 5).join(' ')

  const url = `https://api.edamam.com/search?q=${encodeURIComponent(query)}&app_id=${APP_ID}&app_key=${APP_KEY}&from=0&to=10`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Edamam API Error: ${response.statusText}`)
    }

    const data: EdamamResponse = await response.json()

    // Map and calculate match percentage
    const recipes = data.hits.map(hit => {
      const match = calculateMatch(hit.recipe.ingredientLines, inventory)
      return {
        ...hit.recipe,
        matchPercentage: match,
      }
    })

    // Sort by match percentage DESC
    return recipes.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0))
  } catch (error) {
    console.error('Failed to fetch recipes:', error)
    return []
  }
}
