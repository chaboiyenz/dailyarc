import { describe, it, expect } from 'vitest'
import { buildSkillTree, legacyNodeToSkillNode } from './hybrid-tree'
import { CALISTHENICS_TREE } from './tree'
import { WEIGHTLIFTING_TREE } from './weightlifting-tree'

describe('Hybrid Tree Builder', () => {
  it('builds bodyweight tree correctly', () => {
    const tree = buildSkillTree('bodyweight')
    expect(tree.length).toBe(CALISTHENICS_TREE.length)
    expect(tree[0].exerciseType).toBe('CALISTHENICS')
  })

  it('builds iron tree correctly', () => {
    const tree = buildSkillTree('iron')
    expect(tree.length).toBe(WEIGHTLIFTING_TREE.length)
    expect(tree[0].exerciseType).toBe('WEIGHTLIFTING')
  })

  it('builds hybrid tree correctly', () => {
    const tree = buildSkillTree('hybrid')
    expect(tree.length).toBe(CALISTHENICS_TREE.length + WEIGHTLIFTING_TREE.length)
  })

  it('converts legacy node to skill node', () => {
    const legacy = CALISTHENICS_TREE[0]
    const skillNode = legacyNodeToSkillNode(legacy)
    expect(skillNode.exerciseType).toBe('CALISTHENICS')
    expect(skillNode.crossPrerequisites).toEqual([])
  })
})
