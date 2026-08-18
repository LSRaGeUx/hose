/**
 * The serializable subset of a React Flow graph that we persist.
 *
 * Deliberately narrow: React Flow attaches plenty of runtime state to nodes
 * (measured sizes, drag flags, selection) that must not end up in the jsonb
 * column, and `unknown` cannot cross the server-function boundary anyway.
 */

/** Seeded from the run, or added by the person while thinking. */
export type BoardNodeKind = 'problem' | 'why' | 'verb' | 'note' | 'action'

export type BoardNode = {
  id: string
  type: string
  position: { x: number; y: number }
  data: {
    label: string
    detail?: string
    /** Action nodes only: whether the person has done the thing. */
    done?: boolean
  }
}

export type BoardEdge = {
  id: string
  source: string
  target: string
}

export type BoardGraph = {
  nodes: Array<BoardNode>
  edges: Array<BoardEdge>
}
