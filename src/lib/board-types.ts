/**
 * The serializable subset of a React Flow graph that we persist.
 *
 * Deliberately narrow: React Flow attaches plenty of runtime state to nodes
 * (measured sizes, drag flags, selection) that must not end up in the jsonb
 * column, and `unknown` cannot cross the server-function boundary anyway.
 */
export type BoardNode = {
  id: string
  type: string
  position: { x: number; y: number }
  data: { label: string; detail?: string }
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
