import { NutritionTargets, InventoryItem, Recipe } from '../schemas/nutrition'

/**
 * Calculates adjusted macro targets based on Readiness Factor (RF).
 *
 * Logic:
 * - Protein remains constant (structural repair).
 * - Carbs range from 0.8x (Low RF) to 1.2x (High RF).
 * - Fats range from 0.9x (Low RF) to 1.1x (High RF).
 * - Calories derived from adjusted macros.
 *
 * @param baseTargets - The user's baseline macro targets.
 * @param rf - The daily readiness factor (0.0 to 1.2+).
 */
export function calculateAdjustedMacros(
  baseTargets: NutritionTargets,
  rf: number
): NutritionTargets {
  // Clamp RF to reasonable bounds for nutrition scaling (e.g. 0.5 to 1.5)
  // We want the multiplier to center around 1.0 (which is "Normal" readiness)
  // If RF is high (e.g. 1.2), we scale carbs/fats up.
  // If RF is low (e.g. 0.8), we scale down.

  // Logic from PDD/Prompt: "0.8x-1.2x Readiness Factors"
  // Let's assume the passed RF is the raw factor (e.g. 0.75 or 1.1)

  // Carb Multiplier: Directly proportional to intensity capacity
  // We'll damp it slightly so it's not too extreme.
  // e.g. if RF is 0.5, we don't want 0.5x carbs, maybe 0.75x minimum.
  const carbMultiplier = Math.max(0.8, Math.min(1.2, rf))

  // Fat Multiplier: Less elastic, but still moves
  const fatMultiplier = Math.max(0.9, Math.min(1.1, rf))

  const adjustedCarbs = Math.round(baseTargets.carbs * carbMultiplier)
  const adjustedFat = Math.round(baseTargets.fat * fatMultiplier)
  const protein = baseTargets.protein // Constant

  const adjustedCalories = protein * 4 + adjustedCarbs * 4 + adjustedFat * 9

  return {
    calories: Math.round(adjustedCalories),
    protein,
    carbs: adjustedCarbs,
    fat: adjustedFat,
  }
}

/**
 * Identifies missing ingredients for a recipe based on user inventory.
 *
 * @param inventory - List of items the user has.
 * @param recipe - The recipe to check.
 * @returns Array of ingredient names that are missing.
 */
export function getIngredientGaps(inventory: (InventoryItem | string)[], recipe: Recipe): string[] {
  // Normalize inventory to a Set of lowercase names
  const presentItems = new Set(
    inventory
      .filter(i => {
        if (typeof i === 'string') return true // Strings are present by definition
        return i.isPresent // Objects checked for flag
      })
      .map(i => (typeof i === 'string' ? i.toLowerCase() : i.name.toLowerCase()))
  )

  const missingIngredients: string[] = []

  recipe.ingredients.forEach(ing => {
    // Simple text matching for now.
    // In a real app, we'd use robust NLP or ID matching.
    // We check if the 'food' name fits any inventory item.
    const foodName = ing.food.toLowerCase()

    // Check for partial matches (e.g. "Chicken Breast" in recipe matches "Chicken" in pantry)
    // Or vice versa.
    const hasItem = Array.from(presentItems).some(
      pantryItem => foodName.includes(pantryItem) || pantryItem.includes(foodName)
    )

    if (!hasItem) {
      missingIngredients.push(ing.food)
    }
  })

  return [...new Set(missingIngredients)] // Deduplicate
}
