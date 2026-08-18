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
    <div
      className={`w-64 rounded-md border-2 px-4 py-3 text-left shadow-sm ${tone}`}
    >
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
    <Shell tone="border-foreground bg-background" hasTarget={false}>
      <p className="text-muted-foreground text-[10px] tracking-wide uppercase">
        Problématique
      </p>
      <p className="text-sm leading-snug font-semibold">{d.label}</p>
    </Shell>
  )
}

export function WhyNode({ data }: NodeProps) {
  const d = data as Data
  return (
    <Shell tone="border-border bg-background">
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
    <Shell tone="border-foreground/40 bg-accent/40" hasSource={false}>
      <p className="text-sm font-semibold lowercase">{d.label}</p>
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
