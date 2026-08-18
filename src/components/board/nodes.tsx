import { Handle, Position } from '@xyflow/react'

import type { NodeProps } from '@xyflow/react'

type Data = { label: string; detail?: string }

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

export function ProblemNode({ data }: NodeProps) {
  const d = data as Data
  return (
    <Shell tone="border-foreground bg-card" hasTarget={false}>
      <p className="label-technical">Problématique</p>
      <p className="text-sm leading-snug font-semibold">{d.label}</p>
    </Shell>
  )
}

export function WhyNode({ data }: NodeProps) {
  const d = data as Data
  return (
    <Shell tone="border-rule-strong bg-card">
      <p className="text-sm leading-snug font-medium">{d.label}</p>
      {d.detail ? (
        <p className="text-muted-foreground mt-1 text-xs leading-snug">
          {d.detail}
        </p>
      ) : null}
    </Shell>
  )
}

export function VerbNode({ data }: NodeProps) {
  const d = data as Data
  return (
    <Shell tone="border-signal bg-signal-wash" hasSource={false}>
      <p className="text-signal text-sm font-semibold lowercase">{d.label}</p>
      {d.detail ? (
        <p className="text-muted-foreground mt-1 text-xs leading-snug">
          {d.detail}
        </p>
      ) : null}
    </Shell>
  )
}

export const nodeTypes = {
  problem: ProblemNode,
  why: WhyNode,
  verb: VerbNode,
}
