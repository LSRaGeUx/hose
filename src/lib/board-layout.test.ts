import { describe, expect, it } from 'vitest'

import { seedGraph } from './board-layout.ts'

const EXCHANGES = Array.from({ length: 5 }, (_, i) => ({
  question: `Pourquoi ${i + 1} ?`,
  answer: `Parce que ${i + 1}.`,
}))
const VERBS = [
  { label: 'documenter', solution: 'A' },
  { label: 'répartir', solution: 'B' },
  { label: 'protéger', solution: 'C' },
]

describe('seedGraph', () => {
  it('creates a node per element of the run', () => {
    const { nodes } = seedGraph('Ma problématique', EXCHANGES, VERBS)
    // 1 problem + 5 whys + 3 verbs
    expect(nodes).toHaveLength(9)
    expect(nodes.filter((n) => n.type === 'why')).toHaveLength(5)
    expect(nodes.filter((n) => n.type === 'verb')).toHaveLength(3)
  })

  it('chains the whys so the descent is visible', () => {
    const { edges } = seedGraph('Ma problématique', EXCHANGES, VERBS)
    expect(edges).toContainEqual({
      id: 'e-problem-why-1',
      source: 'problem',
      target: 'why-1',
    })
    expect(edges).toContainEqual({
      id: 'e-why-1-why-2',
      source: 'why-1',
      target: 'why-2',
    })
  })

  it('hangs every verb off the deepest why, not off the problem', () => {
    const { edges } = seedGraph('Ma problématique', EXCHANGES, VERBS)
    const verbEdges = edges.filter((e) => e.target.startsWith('verb-'))
    expect(verbEdges).toHaveLength(3)
    expect(verbEdges.every((e) => e.source === 'why-5')).toBe(true)
  })

  it('gives every node a unique id', () => {
    const { nodes } = seedGraph('Ma problématique', EXCHANGES, VERBS)
    expect(new Set(nodes.map((n) => n.id)).size).toBe(nodes.length)
  })

  it('carries the answer as node detail', () => {
    const { nodes } = seedGraph('Ma problématique', EXCHANGES, VERBS)
    const first = nodes.find((n) => n.id === 'why-1')
    expect(first?.data.detail).toBe('Parce que 1.')
  })
})
