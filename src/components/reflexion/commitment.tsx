import { useState } from 'react'

import { Button } from '#/components/ui/button'
import { Textarea } from '#/components/ui/textarea'
import { proposeCommitment } from '#/lib/ai/server'

import type { Verb } from './types.ts'

/**
 * The step where insight becomes change, or usually does not.
 *
 * The 2024 app ended at three verbs and a "Retour à l'accueil" button, which
 * is where most reflection quietly dies. "Documenter" is a category, not
 * something you do on Tuesday, so the person picks one and the model shrinks
 * it to a first step small enough that it cannot be postponed.
 */
export function Commitment({
  title,
  verbs,
  onCommit,
}: {
  title: string
  verbs: Array<Verb>
  onCommit: (verb: string, action: string) => void
}) {
  const [chosen, setChosen] = useState<Verb | null>(null)
  const [proposed, setProposed] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  async function choose(verb: Verb) {
    setChosen(verb)
    setProposed(null)
    setFailed(false)
    setPending(true)
    try {
      const { action, when } = await proposeCommitment({
        data: { title, verb: verb.verb, solution: verb.solution },
      })
      setProposed(`${action} (${when})`)
    } catch {
      setFailed(true)
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="border-rule-strong flex flex-col gap-5 border-t pt-8">
      <div className="flex flex-col gap-2">
        <h2 className="label-technical">Et maintenant</h2>
        <p className="text-[15px] leading-snug">
          Lequel de ces trois vas-tu vraiment faire ?
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {verbs.map((verb) => (
          <Button
            key={verb.verb}
            size="sm"
            variant={chosen?.verb === verb.verb ? 'default' : 'outline'}
            className="label-technical"
            onClick={() => choose(verb)}
          >
            {verb.verb}
          </Button>
        ))}
      </div>

      {pending ? (
        <p className="label-technical text-signal" aria-live="polite">
          Je cherche une première action assez petite…
        </p>
      ) : null}

      {failed ? (
        <p className="text-destructive text-sm">
          Impossible de proposer une action. Réessaie.
        </p>
      ) : null}

      {proposed !== null && chosen ? (
        <div className="flex flex-col gap-3">
          <label htmlFor="commitment" className="label-technical">
            Ta première action
          </label>
          {/* Editable on purpose: the model proposes, the person commits. */}
          <Textarea
            id="commitment"
            value={proposed}
            onChange={(e) => setProposed(e.target.value)}
            rows={2}
            maxLength={400}
          />
          <Button
            className="label-technical self-start"
            disabled={!proposed.trim()}
            onClick={() => onCommit(chosen.verb, proposed.trim())}
          >
            Je m’y engage
          </Button>
        </div>
      ) : null}
    </section>
  )
}
