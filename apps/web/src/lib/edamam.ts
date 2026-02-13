import type { Recipe as SharedRecipe } from '@repo/shared'

export type Recipe = SharedRecipe & { matchPercentage?: number }

const APP_ID = import.meta.env.VITE_EDAMAM_APP_ID
const APP_KEY = import.meta.env.VITE_EDAMAM_API_KEY
const BASE_URL = 'https://api.edamam.com/api/recipes/v2'

/** Raw Edamam API ingredient shape */
interface EdamamRawIngredient {
  text: string
  food: string
  quantity?: number
  measure?: string
  foodCategory?: string
  image?: string
}

/** Raw Edamam API recipe shape */
interface EdamamRawRecipe {
  uri: string
  label: string
  image?: string
  source?: string
  url?: string
  yield?: number
  calories: number
  totalNutrients: {
    PROCNT?: { quantity: number }
    FAT?: { quantity: number }
    CHOCDF?: { quantity: number }
  }
  ingredientLines: string[]
  ingredients: EdamamRawIngredient[]
  healthLabels?: string[]
}

export interface EdamamHit {
  recipe: EdamamRawRecipe
}

export interface EdamamResponse {
  hits: EdamamHit[]
}

/**
 * searches for recipes using the Edamam API.
 * @param query - The search term (e.g. "chicken", "high protein")
 * @returns Array of recipes formatted to our internal schema
 */
export async function searchRecipes(query: string): Promise<Recipe[]> {
  if (!APP_ID || !APP_KEY) {
    console.warn('⚠️ Edamam API credentials missing. Using mock data.')
    const allMocks = getMockRecipes()
    // Perform robust filtering
    return allMocks.filter(
      r =>
        r.label.toLowerCase().includes(query.toLowerCase()) ||
        r.ingredients.some(i => i.food.toLowerCase().includes(query.toLowerCase()))
    )
  }

  try {
    const url = `${BASE_URL}?type=public&q=${encodeURIComponent(query)}&app_id=${APP_ID}&app_key=${APP_KEY}`
    const res = await fetch(url)

    if (!res.ok) {
      throw new Error(`Edamam API Error: ${res.statusText}`)
    }

    const data: EdamamResponse = await res.json()

    // Transform to our internal schema
    return data.hits.map(hit => transformEdamamRecipe(hit.recipe))
  } catch (error) {
    console.error('Failed to fetch recipes:', error)
    return []
  }
}

/**
 * Transforms raw Edamam data into our safe Zod schema
 */
function transformEdamamRecipe(raw: EdamamRawRecipe): Recipe {
  return {
    id: raw.uri.split('#recipe_')[1] || raw.uri,
    label: raw.label,
    image: raw.image,
    source: raw.source,
    url: raw.url,
    yield: raw.yield,
    preparation: generatePreparationFromIngredients(raw.ingredientLines),
    calories: Math.round(raw.calories),
    macros: {
      protein: Math.round(raw.totalNutrients.PROCNT?.quantity || 0),
      fat: Math.round(raw.totalNutrients.FAT?.quantity || 0),
      carbs: Math.round(raw.totalNutrients.CHOCDF?.quantity || 0),
    },
    ingredientLines: raw.ingredientLines,
    ingredients: raw.ingredients.map((ing: EdamamRawIngredient) => ({
      text: ing.text,
      food: ing.food,
      quantity: ing.quantity,
      measure: ing.measure,
      foodCategory: ing.foodCategory,
      image: ing.image,
    })),
    healthLabels: raw.healthLabels,
  }
}

/**
 * Generate a simple 2-3 sentence preparation instruction from ingredient list
 */
function generatePreparationFromIngredients(ingredientLines: string[]): string {
  const ingredientCount = ingredientLines.length
  if (ingredientCount === 0) return ''

  // Create a simple generic instruction based on ingredient count
  if (ingredientCount <= 3) {
    return `Combine all ${ingredientCount} ingredients in a bowl or pan. Mix until well incorporated. Cook or serve according to taste.`
  } else if (ingredientCount <= 6) {
    return `Prepare all ${ingredientCount} ingredients. Start by cooking the base ingredients, then add the remaining ingredients. Finish cooking until done.`
  } else {
    return `Gather all ${ingredientCount} ingredients. Prepare each component separately, starting with the longer-cooking items. Combine everything at the end and finish cooking.`
  }
}

function getMockRecipes(): Recipe[] {
  return [
    {
      id: 'mock_1',
      label: 'Chicken & Rice Power Bowl',
      image:
        'https://images.unsplash.com/photo-1700323449261-5332ce054718?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      calories: 650,
      macros: { protein: 45, fat: 12, carbs: 85 },
      preparation:
        'Season chicken breast and grill or pan-sear until cooked through, about 6-8 minutes per side. Meanwhile, cook rice according to package instructions and steam broccoli until tender. Slice the chicken and arrange over rice with broccoli on the side.',
      ingredientLines: ['200g Chicken Breast', '150g Rice', 'Broccoli'],
      ingredients: [
        { text: '200g Chicken Breast', food: 'Chicken' },
        { text: '150g Rice', food: 'Rice' },
        { text: '1 cup Broccoli', food: 'Broccoli' },
      ],
    },
    {
      id: 'mock_2',
      label: 'Morning Oatmeal',
      image:
        'https://images.unsplash.com/photo-1691134933638-4c35828b22ad?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      calories: 350,
      macros: { protein: 12, fat: 6, carbs: 55 },
      preparation:
        'Bring milk to a boil and stir in oats, cooking for 3-5 minutes until creamy. Pour into a bowl and top with sliced banana and a drizzle of honey if desired. Enjoy warm and comforting.',
      ingredientLines: ['100g Oats', '1 Banana', 'Milk'],
      ingredients: [
        { text: '100g Oats', food: 'Oats' },
        { text: '1 Banana', food: 'Banana' },
        { text: '200ml Milk', food: 'Milk' },
      ],
    },
    {
      id: 'mock_3',
      label: 'Steak & Potato',
      image:
        'https://plus.unsplash.com/premium_photo-1723672929404-36ba6ed8ab50?q=80&w=1063&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      calories: 750,
      macros: { protein: 60, fat: 35, carbs: 45 },
      preparation:
        'Cube potatoes and roast with olive oil at 400°F for 20-25 minutes until golden. Season steak generously and sear in a hot pan 3-4 minutes per side for medium-rare, then rest for 5 minutes. Serve together with your favorite seasonings.',
      ingredientLines: ['250g Beef Steak', '200g Potatoes'],
      ingredients: [
        { text: '250g Beef Steak', food: 'Beef' },
        { text: '200g Potatoes', food: 'Potatoes' },
      ],
    },
    {
      id: 'mock_4',
      label: 'Avocado Toast & Eggs',
      image:
        'https://images.unsplash.com/photo-1642689690565-bf0afb7eb41e?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      calories: 450,
      macros: { protein: 18, fat: 22, carbs: 35 },
      preparation:
        'Toast bread until golden and crispy. While toasting, fry or scramble eggs to your liking in a heated pan. Mash ripe avocado with a pinch of salt on the toast, then top with the cooked eggs and a sprinkle of pepper.',
      ingredientLines: ['2 slices Bread', '1 Avocado', '2 Eggs'],
      ingredients: [
        { text: '2 slices Bread', food: 'Bread' },
        { text: '1 Avocado', food: 'Avocado' },
        { text: '2 Eggs', food: 'Eggs' },
      ],
    },
    {
      id: 'mock_5',
      label: 'Berry Yogurt Parfait',
      image:
        'https://plus.unsplash.com/premium_photo-1669680784325-f8de41034ad9?q=80&w=688&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      calories: 320,
      macros: { protein: 22, fat: 4, carbs: 40 },
      preparation:
        'Layer creamy yogurt at the bottom of a bowl or glass. Top with fresh berries for a burst of color and flavor. Sprinkle nuts on top for crunch and healthy fats. Enjoy immediately for the best texture.',
      ingredientLines: ['200g Yogurt', '100g Berries', '30g Nuts'],
      ingredients: [
        { text: '200g Yogurt', food: 'Yogurt' },
        { text: '100g Berries', food: 'Berries' },
        { text: '30g Nuts', food: 'Nuts' },
      ],
    },
    {
      id: 'mock_6',
      label: 'Pasta Bolognese',
      image:
        'https://images.unsplash.com/photo-1622973536968-3ead9e780960?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      calories: 800,
      macros: { protein: 40, fat: 25, carbs: 90 },
      preparation:
        'Brown the beef in a pan with onions and garlic until cooked through. Add tomato sauce and simmer for 10-15 minutes to let flavors meld. Meanwhile, cook pasta according to package directions and drain. Serve sauce over pasta and top with parmesan cheese.',
      ingredientLines: ['150g Pasta', '150g Beef', 'Tomato Sauce'],
      ingredients: [
        { text: '150g Pasta', food: 'Pasta' },
        { text: '150g Beef', food: 'Beef' },
      ],
    },
    {
      id: 'mock_7',
      label: 'Spinach & Egg Scramble',
      image:
        'https://images.unsplash.com/photo-1673925962465-7bfd6339ab2e?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      calories: 300,
      macros: { protein: 24, fat: 18, carbs: 5 },
      preparation:
        'Heat oil in a non-stick pan and add fresh spinach, cooking until wilted about 2 minutes. Beat eggs in a bowl and pour into the pan with the spinach. Stir gently and cook for 3-4 minutes until eggs are set and fluffy.',
      ingredientLines: ['3 Eggs', '100g Spinach'],
      ingredients: [
        { text: '3 Eggs', food: 'Eggs' },
        { text: '100g Spinach', food: 'Spinach' },
      ],
    },
    {
      id: 'mock_8',
      label: 'Post-Workout Shake',
      image:
        'https://plus.unsplash.com/premium_photo-1727201929026-f0e786b85d08?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      calories: 250,
      macros: { protein: 40, fat: 2, carbs: 10 },
      preparation:
        'Add water and protein powder to a blender or shaker container. Blend or shake until smooth and creamy with no lumps. Drink immediately after your workout for optimal muscle recovery and growth.',
      ingredientLines: ['1 scoop Protein', 'Water'],
      ingredients: [{ text: '1 scoop Whey Protein', food: 'Whey Protein' }],
    },
  ]
}

/**
 * fetchInventoryMatches searches for recipes and calculates how much of a match
 * they are based on the user's current inventory.
 */
export async function fetchInventoryMatches(inventory: string[]): Promise<Recipe[]> {
  if (inventory.length === 0) return []

  // Create a query from top items
  const query = inventory.slice(0, 3).join(' ')

  const results = await searchRecipes(query)

  // Calculate match percentage
  const matched = results.map(recipe => {
    const recipeIngredients = recipe.ingredients.map(i => i.food.toLowerCase())
    const pantryItems = inventory.map(item => item.toLowerCase())

    const matches = recipeIngredients.filter(ri =>
      pantryItems.some(pi => ri.includes(pi) || pi.includes(ri))
    )

    const matchPercentage =
      recipeIngredients.length > 0
        ? Math.round((matches.length / recipeIngredients.length) * 100)
        : 0

    return {
      ...recipe,
      matchPercentage,
    }
  })

  // Sort by match percentage
  return matched.sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0))
}
