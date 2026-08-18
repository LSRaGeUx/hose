import type { Verb } from './types.ts'

/**
 * The payoff, and the only place the signal colour is spent at full strength.
 * Presented as three branches off the end of the spine rather than a card, so
 * it reads as the conclusion of the descent instead of a separate panel.
 */
export function Verbs({ verbs }: { verbs: Array<Verb> }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="label-technical">Verbes d’action</h2>

      <ol className="border-rule-strong grid border sm:grid-cols-3">
        {verbs.map((verb, i) => (
          <li
            key={verb.verb}
            className={`flex flex-col gap-2 p-4 ${
              i < verbs.length - 1 ? 'sm:border-rule-strong sm:border-r' : ''
            } ${i > 0 ? 'border-rule border-t sm:border-t-0' : ''}`}
          >
            <span className="text-signal font-mono text-[11px] leading-none">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="text-signal text-lg leading-none font-semibold lowercase">
              {verb.verb}
            </span>
            <span className="text-muted-foreground text-sm leading-snug">
              {verb.solution}
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
