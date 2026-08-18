import { useState } from 'react'

import { Alert, AlertDescription } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { Textarea } from '#/components/ui/textarea'
import { updateFrame } from '#/lib/profile'

import type { PersonalFrame } from '#/lib/profile'

const FIELDS = [
  {
    name: 'energises',
    label: 'Ce qui te donne de l’énergie',
    placeholder: 'Écrire seul le matin, résoudre un problème technique…',
  },
  {
    name: 'drains',
    label: 'Ce qui t’épuise',
    placeholder: 'Les réunions à six personnes, relancer les gens…',
  },
  {
    name: 'aspiration',
    label: 'Ce vers quoi tu veux aller',
    placeholder: 'Travailler en autonomie, transmettre davantage…',
  },
] as const

/**
 * Optional, and it changes the advice.
 *
 * These three answers are passed to the synthesis, so the action verbs are
 * chosen for someone in particular rather than in the abstract.
 */
export function FrameForm({ frame }: { frame: PersonalFrame }) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  )

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setState('saving')
    try {
      await updateFrame({
        data: {
          energises: String(form.get('energises') ?? ''),
          drains: String(form.get('drains') ?? ''),
          aspiration: String(form.get('aspiration') ?? ''),
        },
      })
      setState('saved')
    } catch {
      setState('error')
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      {state === 'error' ? (
        <Alert variant="destructive">
          <AlertDescription>
            Enregistrement impossible. Réessaie dans un instant.
          </AlertDescription>
        </Alert>
      ) : null}

      {FIELDS.map((field) => (
        <div key={field.name} className="flex flex-col gap-2">
          <Label htmlFor={field.name}>{field.label}</Label>
          <Textarea
            id={field.name}
            name={field.name}
            defaultValue={frame[field.name] ?? ''}
            placeholder={field.placeholder}
            rows={2}
            maxLength={400}
            onChange={() => setState('idle')}
          />
        </div>
      ))}

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={state === 'saving'}>
          {state === 'saving' ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
        <p
          className="text-muted-foreground font-mono text-[11px]"
          aria-live="polite"
        >
          {state === 'saved' ? 'enregistré' : ''}
        </p>
      </div>
    </form>
  )
}
