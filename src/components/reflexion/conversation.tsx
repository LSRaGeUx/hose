import type { Exchange, Mode, Status } from './types.ts'

/**
 * Status copy is specific rather than a generic spinner, because these waits
 * are genuinely long: about 4.5s for a single question, 11s for the whole
 * chain in auto mode, and 6.5s for the synthesis. Telling the person what is
 * happening, and roughly how long the slow one takes, beats a spinner that
 * gives them no way to tell progress from a hang.
 */
function pending(status: Status, mode: Mode): string | null {
  switch (status.kind) {
    case 'starting':
      return mode === 'auto'
        ? 'Je déroule les cinq pourquoi, ça prend une dizaine de secondes…'
        : 'Je réfléchis à ta première question…'
    case 'thinking':
      return 'Je réfléchis à la question suivante…'
    case 'synthesizing':
      return 'Je cherche tes trois verbes d’action…'
    default:
      return null
  }
}

export function Conversation({
  exchanges,
  status,
  mode,
}: {
  exchanges: Array<Exchange>
  status: Status
  mode: Mode
}) {
  const message = pending(status, mode)

  return (
    <ol className="flex flex-col gap-6">
      {exchanges.map((exchange, i) => (
        <li key={i} className="flex flex-col gap-2">
          <div className="flex gap-3">
            <span
              className="text-muted-foreground shrink-0 tabular-nums"
              aria-hidden
            >
              {i + 1}
            </span>
            <p className="font-medium text-balance">{exchange.question}</p>
          </div>
          {exchange.answer ? (
            <p className="text-muted-foreground border-border ml-3 border-l-2 pl-4 text-sm">
              {exchange.answer}
            </p>
          ) : null}
        </li>
      ))}

      {message ? (
        <li
          className="text-muted-foreground flex items-center gap-2 text-sm"
          aria-live="polite"
        >
          <span className="bg-muted-foreground/60 size-1.5 animate-pulse rounded-full" />
          {message}
        </li>
      ) : null}
    </ol>
  )
}
