import { SkillNode, ExerciseTypeEnum, type ExerciseCategory } from '../schemas/exercise'
import { CALISTHENICS_TREE, ExerciseNode } from './tree'
import { WEIGHTLIFTING_TREE } from './weightlifting-tree'
import { CARDIO_TREE } from './cardio-tree'

/**
 * Converts a legacy ExerciseNode (from CALISTHENICS_TREE) into a full SkillNode.
 * Explicitly maps all fields including level (1-10) and prerequisites.
 */
export function legacyNodeToSkillNode(node: ExerciseNode): SkillNode {
  return {
    // Core fields with explicit mapping
    id: node.id,
    name: node.name,
    level: node.level, // SkillLevel 1-10
    sets: node.sets,
    reps: node.reps,
    description: node.description,
    category: node.category as ExerciseCategory,

    // Prerequisites - explicit copy for clarity
    prerequisites: node.prerequisites || [],

    // New fields for SkillNode
    exerciseType: ExerciseTypeEnum.enum.CALISTHENICS,
    crossPrerequisites: [],
    targetBwRatio: 0,
  }
}

/**
 * Validates that the skill tree has proper prerequisites and levels
 */
export function validateSkillTree(tree: SkillNode[]): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const nodeIds = new Set(tree.map(n => n.id))

  tree.forEach(node => {
    // Check level is 1-10
    if (node.level < 1 || node.level > 10) {
      errors.push(`${node.id}: level ${node.level} must be 1-10`)
    }

    // Check prerequisites reference existing nodes
    node.prerequisites.forEach(prereqId => {
      if (!nodeIds.has(prereqId)) {
        errors.push(`${node.id}: prerequisite "${prereqId}" does not exist in tree`)
      }
    })

    // Warn if level 1 nodes have prerequisites
    if (node.level === 1 && node.prerequisites.length > 0) {
      errors.push(`${node.id}: level 1 node should not have prerequisites`)
    }
  })

  if (errors.length > 0) {
    console.error('[validateSkillTree] ❌ Validation errors found:', errors)
  } else {
    console.log('[validateSkillTree] ✅ Tree structure valid')
  }

  return { valid: errors.length === 0, errors }
}

export function buildSkillTree(mode: 'bodyweight' | 'iron' | 'cardio' | 'hybrid'): SkillNode[] {
  const calisthenicsNodes = CALISTHENICS_TREE.map(legacyNodeToSkillNode)
  const ironNodes = WEIGHTLIFTING_TREE
  const cardioNodes = CARDIO_TREE

  let result: SkillNode[]

  if (mode === 'bodyweight') {
    result = calisthenicsNodes
  } else if (mode === 'iron') {
    result = ironNodes
  } else if (mode === 'cardio') {
    result = cardioNodes
  } else {
    // Hybrid: Merge all trees
    result = [...calisthenicsNodes, ...ironNodes, ...cardioNodes]
  }

  // Validate tree on build
  const validation = validateSkillTree(result)
  if (!validation.valid) {
    console.warn('[buildSkillTree] ⚠️ Tree has validation errors (may still function)')
  }

  // Log tree structure for debugging
  console.log(`[buildSkillTree] 🌳 Built ${mode} tree with ${result.length} nodes`)
  const byLevel = result.reduce(
    (acc, node) => {
      if (!acc[node.level]) acc[node.level] = []
      acc[node.level].push({ id: node.id, name: node.name, prereqs: node.prerequisites })
      return acc
    },
    {} as Record<number, Array<{ id: string; name: string; prereqs: string[] }>>
  )
  console.log('[buildSkillTree] 📊 Tree by level:', byLevel)

  return result
}
