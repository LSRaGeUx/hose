import { useState } from 'react'

import { Button } from '#/components/ui/button'
import { Textarea } from '#/components/ui/textarea'

import type { Exchange, Mode, Status } from './types.ts'

/**
 * Status copy is specific rather than a spinner, because these waits are
 * genuinely long: about 4.5s for a single question, 11s for the whole chain in
 * auto mode, 6.5s for the synthesis. Naming what is happening, and how long the
 * slow one takes, beats a spinner that cannot be told apart from a hang.
 */
function pending(status: Status, mode: Mode): string | null {
  switch (status.kind) {
    case 'starting':
      return mode === 'auto'
        ? 'Déroulé des cinq pourquoi, une dizaine de secondes…'
        : 'Première question…'
    case 'thinking':
      return 'Question suivante…'
    case 'rewinding':
      return 'Je reprends à partir de ta correction…'
    case 'synthesizing':
      return 'Extraction des verbes d’action…'
    case 'saving':
      return 'Enregistrement…'
    default:
      return null
  }
}

/**
 * The spine: a single rule down the left with the questions hanging off it.
 *
 * The five whys are a descent, so the layout says so. Each step is numbered in
 * mono, the answer sits indented beneath its question, and the rule carries the
 * eye downward to the verbs at the bottom.
 */
export function Conversation({
  exchanges,
  status,
  mode,
  onRegenerate,
  onEditAnswer,
}: {
  exchanges: Array<Exchange>
  status: Status
  mode: Mode
  /** Ask a different question in place of the current one. */
  onRegenerate?: () => void
  /** Correct an earlier answer; everything after it is reasoned again. */
  onEditAnswer?: (index: number, answer: string) => void
}) {
  const message = pending(status, mode)
  const idle = message === null && status.kind !== 'error'
  const [editing, setEditing] = useState<number | null>(null)
  const [draft, setDraft] = useState('')

  return (
    <ol className="border-rule-strong relative flex flex-col border-l">
      {exchanges.map((exchange, i) => {
        const last = i === exchanges.length - 1
        const isEditing = editing === i

        return (
          <li key={i} className="group relative pb-7 pl-6">
            <span
              className="bg-background border-rule-strong text-muted-foreground absolute -left-[11px] flex size-[22px] items-center justify-center border font-mono text-[10px] leading-none"
              aria-hidden
            >
              {String(i + 1).padStart(2, '0')}
            </span>

            <p className="text-[15px] leading-snug font-medium text-balance">
              {exchange.question}
            </p>

            {isEditing ? (
              <div className="mt-2 flex flex-col gap-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  autoFocus
                  aria-label="Corriger ta réponse"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="label-technical"
                    disabled={!draft.trim()}
                    onClick={() => {
                      setEditing(null)
                      onEditAnswer?.(i, draft.trim())
                    }}
                  >
                    Reprendre ici
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="label-technical"
                    onClick={() => setEditing(null)}
                  >
                    Annuler
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs">
                  Les échanges suivants seront refaits à partir de cette
                  réponse.
                </p>
              </div>
            ) : exchange.answer ? (
              <div className="mt-2 flex items-start gap-3">
                <p className="text-muted-foreground flex-1 text-sm leading-relaxed">
                  {exchange.answer}
                </p>
                {idle && onEditAnswer ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(exchange.answer ?? '')
                      setEditing(i)
                    }}
                    className="label-technical hover:text-signal shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    Corriger
                  </button>
                ) : null}
              </div>
            ) : null}

            {/* Only the question waiting for an answer can be swapped out. */}
            {last && !exchange.answer && idle && onRegenerate ? (
              <button
                type="button"
                onClick={onRegenerate}
                className="label-technical hover:text-signal mt-2"
              >
                Autre question
              </button>
            ) : null}
          </li>
        )
      })}

      {message ? (
        <li className="relative pl-6" aria-live="polite">
          <span
            className="bg-background border-signal absolute -left-[11px] flex size-[22px] items-center justify-center border"
            aria-hidden
          >
            <span className="bg-signal size-1.5 animate-pulse" />
          </span>
          <p className="label-technical text-signal">{message}</p>
        </li>
      ) : null}
    </ol>
  )
}
