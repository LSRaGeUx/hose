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
}: {
  exchanges: Array<Exchange>
  status: Status
  mode: Mode
}) {
  const message = pending(status, mode)

  return (
    <ol className="border-rule-strong relative flex flex-col border-l">
      {exchanges.map((exchange, i) => (
        <li key={i} className="relative pb-7 pl-6">
          <span
            className="bg-background border-rule-strong text-muted-foreground absolute -left-[11px] flex size-[22px] items-center justify-center border font-mono text-[10px] leading-none"
            aria-hidden
          >
            {String(i + 1).padStart(2, '0')}
          </span>

          <p className="text-[15px] leading-snug font-medium text-balance">
            {exchange.question}
          </p>

          {exchange.answer ? (
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {exchange.answer}
            </p>
          ) : null}
        </li>
      ))}

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
