import { z } from 'zod'

export const IngredientSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string().optional(),
  image: z.string().optional(), // For visual pantry
})

export type Ingredient = z.infer<typeof IngredientSchema>

export const InventoryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  isPresent: z.boolean(),
  lastUpdated: z.date().or(z.string()).optional(), // Firestore timestamp handling
  category: z.string().optional(),
})

export type InventoryItem = z.infer<typeof InventoryItemSchema>

export const RecipeSchema = z.object({
  id: z.string(), // Edamam URI or custom ID
  label: z.string(),
  image: z.string().optional(),
  source: z.string().optional(),
  url: z.string().optional(),
  yield: z.number().optional(),
  preparation: z.string().optional(), // 2-3 sentence cooking instructions
  calories: z.number(),
  macros: z.object({
    protein: z.number(),
    fat: z.number(),
    carbs: z.number(),
  }),
  ingredientLines: z.array(z.string()),
  ingredients: z.array(
    z.object({
      text: z.string(),
      food: z.string(),
      quantity: z.number().optional(),
      measure: z.string().optional(),
      foodCategory: z.string().optional(),
      image: z.string().optional(),
    })
  ),
  healthLabels: z.array(z.string()).optional(),
})

export type Recipe = z.infer<typeof RecipeSchema>

export const NutritionTargetsSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
})

export type NutritionTargets = z.infer<typeof NutritionTargetsSchema>

export const MealLogSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  type: z.enum(['RECIPE', 'MANUAL']).default('RECIPE'),
  recipeId: z.string().optional(),
  recipeName: z.string().optional(),
  title: z.string().optional(), // For manual logs
  macros: z.object({
    protein: z.number(),
    carbs: z.number(),
    fat: z.number(),
  }),
  calories: z.number(),
  readinessFactor: z.number(),
  timestamp: z.any(), // Firestore Timestamp
})

export type MealLog = z.infer<typeof MealLogSchema>
