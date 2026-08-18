import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'

import { Button } from '#/components/ui/button'
import { nodeTypes } from './nodes.tsx'

import type {
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
} from '@xyflow/react'
import type { BoardGraph } from '#/lib/board-types'

import '@xyflow/react/dist/style.css'

const AUTOSAVE_DELAY = 1200
const HISTORY_LIMIT = 50
const NODE_W = 260
const NODE_H = 120

type SaveState = 'idle' | 'pending' | 'saved' | 'error'

/**
 * Strips React Flow's runtime state before persisting.
 *
 * It attaches measured sizes, drag and selection flags to every node; writing
 * those into jsonb would store view state as if it were content, and they go
 * stale the moment the viewport changes.
 */
function toGraph(nodes: Array<Node>, edges: Array<Edge>): BoardGraph {
  return {
    nodes: nodes.map((n) => {
      const data = n.data as { label?: string; detail?: string; done?: boolean }
      return {
        id: n.id,
        type: n.type ?? 'note',
        position: { x: Math.round(n.position.x), y: Math.round(n.position.y) },
        data: {
          label: String(data.label ?? ''),
          detail: data.detail,
          done: data.done,
        },
      }
    }),
    edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
  }
}

/**
 * Whether a change is the person editing rather than React Flow housekeeping.
 *
 * `dimensions` fires when nodes are first measured and `select` on every click,
 * so counting either as an edit makes simply opening the board write to the
 * database.
 */
function isRealEdit(change: NodeChange | EdgeChange): boolean {
  if (change.type === 'position') return change.dragging === false
  return (
    change.type === 'add' ||
    change.type === 'remove' ||
    change.type === 'replace'
  )
}

/**
 * Finds somewhere the new node will not land on top of an existing one.
 *
 * Toolbar-added nodes used to appear at the centre of the viewport, which is
 * usually exactly where the seeded tree already is. Starts to the right of
 * everything and walks down until the space is clear.
 */
function freeSpot(nodes: Array<Node>): { x: number; y: number } {
  if (nodes.length === 0) return { x: 0, y: 0 }

  const right = Math.max(...nodes.map((n) => n.position.x)) + NODE_W + 80
  const top = Math.min(...nodes.map((n) => n.position.y))

  for (let y = top; y < top + 4000; y += NODE_H + 20) {
    const clash = nodes.some(
      (n) =>
        Math.abs(n.position.x - right) < NODE_W &&
        Math.abs(n.position.y - y) < NODE_H,
    )
    if (!clash) return { x: right, y }
  }
  return { x: right, y: top }
}

export function BoardCanvas(props: {
  graph: BoardGraph
  onSave: (graph: BoardGraph) => Promise<void>
}) {
  return (
    <ReactFlowProvider>
      <Board {...props} />
    </ReactFlowProvider>
  )
}

function Board({
  graph,
  onSave,
}: {
  graph: BoardGraph
  onSave: (graph: BoardGraph) => Promise<void>
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(graph.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(graph.edges)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const { screenToFlowPosition } = useReactFlow()

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dirty = useRef(false)
  const history = useRef<Array<BoardGraph>>([])

  /** Snapshot before a mutation, so it can be undone. */
  const remember = useCallback(() => {
    history.current.push(toGraph(nodes, edges))
    if (history.current.length > HISTORY_LIMIT) history.current.shift()
  }, [nodes, edges])

  const undo = useCallback(() => {
    const previous = history.current.pop()
    if (!previous) return
    setNodes(previous.nodes)
    setEdges(previous.edges)
    dirty.current = true
  }, [setNodes, setEdges])

  const addNode = useCallback(
    (type: 'note' | 'action', at?: { x: number; y: number }) => {
      remember()
      const id = `${type}-${Date.now().toString(36)}`
      setNodes((current) => [
        ...current,
        {
          id,
          type,
          position: at ?? freeSpot(current),
          data: { label: '' },
          selected: false,
        },
      ])
      dirty.current = true
    },
    [remember, setNodes],
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      remember()
      dirty.current = true
      setEdges((current) => addEdge(connection, current))
    },
    [remember, setEdges],
  )

  // Undo on the usual shortcut. Ignored while a text field has focus so it does
  // not fight the browser's own undo inside a node being edited.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return
      if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
        event.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo])

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
    <div className="border-rule-strong relative h-[72vh] w-full overflow-hidden border">
      <div className="border-rule-strong bg-background/90 absolute top-0 right-0 left-0 z-10 flex flex-wrap items-center gap-2 border-b px-3 py-2 backdrop-blur-sm">
        <Button
          size="sm"
          variant="outline"
          className="label-technical"
          onClick={() => addNode('note')}
        >
          + Note
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="label-technical"
          onClick={() => addNode('action')}
        >
          + Action
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="label-technical"
          onClick={undo}
        >
          Annuler
        </Button>

        <p className="text-muted-foreground ml-auto hidden font-mono text-[11px] sm:block">
          double-clic : ajouter ou modifier · suppr : effacer
        </p>
        <p
          className="border-rule text-muted-foreground min-w-[7.5rem] border-l pl-3 text-right font-mono text-[11px]"
          aria-live="polite"
        >
          {saveState === 'pending'
            ? 'enregistrement…'
            : saveState === 'saved'
              ? 'enregistré'
              : saveState === 'error'
                ? 'échec'
                : ''}
        </p>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(changes) => {
          if (changes.some(isRealEdit)) {
            if (changes.some((c) => c.type === 'remove')) remember()
            dirty.current = true
          }
          onNodesChange(changes)
        }}
        onEdgesChange={(changes) => {
          if (changes.some(isRealEdit)) {
            if (changes.some((c) => c.type === 'remove')) remember()
            dirty.current = true
          }
          onEdgesChange(changes)
        }}
        onConnect={onConnect}
        onDoubleClick={(event) => {
          // Only the empty canvas: a double-click on a node is text editing.
          const target = event.target as HTMLElement
          if (!target.classList.contains('react-flow__pane')) return
          addNode(
            'note',
            screenToFlowPosition({ x: event.clientX, y: event.clientY }),
          )
        }}
        nodeTypes={nodeTypes}
        deleteKeyCode={['Backspace', 'Delete']}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: false }}
        className="pt-11"
      >
        <Background gap={28} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
