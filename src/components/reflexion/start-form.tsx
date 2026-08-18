import { useState } from 'react'

import { Alert, AlertDescription } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'
import { Textarea } from '#/components/ui/textarea'
import { ModePicker } from './mode-picker.tsx'

import type { Mode } from './types.ts'

/**
 * The entry point into a run: the problem and how to work through it.
 *
 * Shared between the home page and /reflexion so the call to action is the
 * thing itself rather than a button that leads to it. Submitting from a signed
 * out home page still works: the guard on /reflexion bounces to sign-in
 * carrying the full path, search included, so the problem survives the detour.
 */
export function StartForm({
  defaultTitle = '',
  defaultMode = 'assist',
  submitLabel = 'Démarrer',
  autoFocus = false,
  disabledReason = null,
  onStart,
}: {
  defaultTitle?: string
  defaultMode?: Mode
  submitLabel?: string
  autoFocus?: boolean
  /**
   * Why this instance cannot run the engine. Set means the form is inert: an
   * instance without a Claude key says so here, before anything is typed,
   * rather than accepting a problem and failing on submit.
   */
  disabledReason?: string | null
  onStart: (title: string, mode: Mode) => void
}) {
  const [title, setTitle] = useState(defaultTitle)
  const [mode, setMode] = useState<Mode>(defaultMode)
  const problem = title.trim()
  const disabled = disabledReason !== null

  function submit() {
    if (problem && !disabled) onStart(problem, mode)
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      {disabled ? (
        <Alert>
          <AlertDescription>{disabledReason}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <label htmlFor="probleme" className="label-technical">
          Ta problématique
        </label>
        <Textarea
          id="probleme"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            // Enter submits, shift+enter keeps a newline: this is one short
            // sentence far more often than it is a paragraph.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder="Je n’ose jamais demander de l’aide au travail…"
          rows={3}
          maxLength={500}
          autoFocus={autoFocus}
          disabled={disabled}
          aria-label="Ta problématique"
          className="border-rule-strong bg-card resize-none rounded-none px-4 py-3 text-base leading-relaxed"
        />
        <p className="text-muted-foreground text-right font-mono text-[11px] tabular-nums">
          {title.length}/500
        </p>
      </div>

      <ModePicker mode={mode} onChange={setMode} />

      <Button
        type="submit"
        size="lg"
        disabled={!problem || disabled}
        className="label-technical h-12 rounded-none text-[12px]"
      >
        {submitLabel}
      </Button>
    </form>
  )
}
