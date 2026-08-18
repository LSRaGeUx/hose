import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Background,
  Controls,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'

import { nodeTypes } from './nodes.tsx'

import type { Connection, Edge, Node } from '@xyflow/react'
import type { BoardGraph } from '#/lib/board-types'

import '@xyflow/react/dist/style.css'

const AUTOSAVE_DELAY = 1200

export type SaveState = 'idle' | 'pending' | 'saved' | 'error'

/**
 * Whether a change is the user editing rather than React Flow housekeeping.
 *
 * `dimensions` fires when nodes are first measured and `select` on every
 * click, so counting either as an edit makes simply opening the board write to
 * the database. Only real mutations mark the graph dirty.
 */
function isRealEdit(change: { type: string; dragging?: boolean }): boolean {
  if (change.type === 'position') return change.dragging === false
  return (
    change.type === 'add' ||
    change.type === 'remove' ||
    change.type === 'replace'
  )
}

/**
 * Strips React Flow's runtime state before persisting.
 *
 * It attaches measured sizes, drag and selection flags to every node; writing
 * those into jsonb would store view state as if it were content, and they go
 * stale the moment the viewport changes.
 */
function toGraph(nodes: Array<Node>, edges: Array<Edge>): BoardGraph {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type ?? 'why',
      position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
      data: {
        label: String((n.data as { label?: string }).label ?? ''),
        detail: (n.data as { detail?: string }).detail,
      },
    })),
    edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
  }
}

export function BoardCanvas({
  graph,
  onSave,
}: {
  graph: BoardGraph
  onSave: (graph: BoardGraph) => Promise<void>
}) {
  const [nodes, , onNodesChange] = useNodesState<Node>(graph.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(graph.edges)
  const [saveState, setSaveState] = useState<SaveState>('idle')

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dirty = useRef(false)

  const onConnect = useCallback(
    (connection: Connection) => {
      dirty.current = true
      setEdges((current) => addEdge(connection, current))
    },
    [setEdges],
  )

  // Debounced, so dragging a node does not fire a request per frame.
  useEffect(() => {
    if (!dirty.current) return
    setSaveState('pending')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      onSave(toGraph(nodes, edges))
        .then(() => setSaveState('saved'))
        .catch(() => setSaveState('error'))
      dirty.current = false
    }, AUTOSAVE_DELAY)

    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [nodes, edges, onSave])

  return (
    <div className="border-border relative h-[70vh] w-full overflow-hidden rounded-md border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => {
          if (changes.some(isRealEdit)) dirty.current = true
          onNodesChange(changes)
        }}
        onEdgesChange={(changes) => {
          if (changes.some(isRealEdit)) dirty.current = true
          onEdgesChange(changes)
        }}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: false }}
      >
        <Background />
        <Controls />
      </ReactFlow>

      <p
        className="text-muted-foreground bg-background/80 absolute top-2 right-2 rounded px-2 py-1 text-xs"
        aria-live="polite"
      >
        {saveState === 'pending'
          ? 'Enregistrement…'
          : saveState === 'saved'
            ? 'Enregistré'
            : saveState === 'error'
              ? 'Échec de l’enregistrement'
              : ''}
      </p>
    </div>
  )
}
