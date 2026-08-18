import { useEffect, useRef, useState } from 'react'
import { Handle, Position, useReactFlow } from '@xyflow/react'

import type { NodeProps } from '@xyflow/react'

type Data = { label: string; detail?: string; done?: boolean }

/**
 * Inline editing, shared by every node kind.
 *
 * Nodes reach into the store themselves rather than taking callbacks through
 * React Flow's node props, which would mean rebuilding nodeTypes on every
 * render and remounting the whole graph.
 */
function useNodeText(id: string) {
  const { setNodes } = useReactFlow()
  return (field: 'label' | 'detail', value: string) => {
    setNodes((nodes) =>
      nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, [field]: value } } : n,
      ),
    )
  }
}

function EditableText({
  id,
  field,
  value,
  placeholder,
  className,
}: {
  id: string
  field: 'label' | 'detail'
  value: string
  placeholder: string
  className: string
}) {
  const write = useNodeText(id)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  useEffect(() => {
    if (editing) ref.current?.focus()
  }, [editing])

  function commit() {
    setEditing(false)
    if (draft !== value) write(field, draft)
  }

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Escape') {
            setDraft(value)
            setEditing(false)
          }
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            commit()
          }
        }}
        rows={Math.max(1, Math.ceil(draft.length / 34))}
        className={`nodrag border-signal bg-background w-full resize-none border px-1 py-0.5 outline-none ${className}`}
      />
    )
  }

  return (
    <p
      onDoubleClick={() => setEditing(true)}
      className={`cursor-text ${className} ${value ? '' : 'text-muted-foreground italic'}`}
      title="Double-clic pour modifier"
    >
      {value || placeholder}
    </p>
  )
}

function Shell({
  children,
  tone,
  hasSource = true,
  hasTarget = true,
}: {
  children: React.ReactNode
  tone: string
  hasSource?: boolean
  hasTarget?: boolean
}) {
  return (
    <div className={`w-64 border px-4 py-3 text-left ${tone}`}>
      {hasTarget ? (
        <Handle type="target" position={Position.Top} className="!size-2" />
      ) : null}
      {children}
      {hasSource ? (
        <Handle type="source" position={Position.Bottom} className="!size-2" />
      ) : null}
    </div>
  )
}

export function ProblemNode({ id, data }: NodeProps) {
  const d = data as Data
  return (
    <Shell tone="border-foreground bg-card" hasTarget={false}>
      <p className="label-technical mb-1">Problématique</p>
      <EditableText
        id={id}
        field="label"
        value={d.label}
        placeholder="Ta problématique"
        className="text-sm leading-snug font-semibold"
      />
    </Shell>
  )
}

export function WhyNode({ id, data }: NodeProps) {
  const d = data as Data
  return (
    <Shell tone="border-rule-strong bg-card">
      <EditableText
        id={id}
        field="label"
        value={d.label}
        placeholder="Pourquoi ?"
        className="text-sm leading-snug font-medium"
      />
      <EditableText
        id={id}
        field="detail"
        value={d.detail ?? ''}
        placeholder="Réponse…"
        className="text-muted-foreground mt-1 text-xs leading-snug"
      />
    </Shell>
  )
}

export function VerbNode({ id, data }: NodeProps) {
  const d = data as Data
  return (
    <Shell tone="border-signal bg-signal-wash" hasSource>
      <EditableText
        id={id}
        field="label"
        value={d.label}
        placeholder="verbe"
        className="text-signal text-sm font-semibold lowercase"
      />
      <EditableText
        id={id}
        field="detail"
        value={d.detail ?? ''}
        placeholder="Piste concrète…"
        className="text-muted-foreground mt-1 text-xs leading-snug"
      />
    </Shell>
  )
}

/** A free thought. The reason the board is a place to think and not a diagram. */
export function NoteNode({ id, data }: NodeProps) {
  const d = data as Data
  return (
    <Shell tone="border-rule-strong bg-muted/50 border-dashed">
      <p className="label-technical mb-1">Note</p>
      <EditableText
        id={id}
        field="label"
        value={d.label}
        placeholder="Écris ici…"
        className="text-sm leading-snug"
      />
    </Shell>
  )
}

/** A thing to actually do, with a state, so the board can hold the plan. */
export function ActionNode({ id, data }: NodeProps) {
  const d = data as Data
  const { setNodes } = useReactFlow()

  function toggle() {
    setNodes((nodes) =>
      nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, done: !d.done } } : n,
      ),
    )
  }

  return (
    <Shell tone="border-foreground bg-card">
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={toggle}
          aria-pressed={d.done ?? false}
          aria-label={d.done ? 'Marquer à faire' : 'Marquer comme fait'}
          className={`nodrag mt-0.5 flex size-4 shrink-0 items-center justify-center border font-mono text-[10px] leading-none ${
            d.done
              ? 'border-signal bg-signal text-primary-foreground'
              : 'border-rule-strong'
          }`}
        >
          {d.done ? '×' : ''}
        </button>
        <div className="min-w-0 flex-1">
          <p className="label-technical mb-1">Action</p>
          <EditableText
            id={id}
            field="label"
            value={d.label}
            placeholder="Quoi faire…"
            className={`text-sm leading-snug ${d.done ? 'text-muted-foreground line-through' : ''}`}
          />
        </div>
      </div>
    </Shell>
  )
}

export const nodeTypes = {
  problem: ProblemNode,
  why: WhyNode,
  verb: VerbNode,
  note: NoteNode,
  action: ActionNode,
}
