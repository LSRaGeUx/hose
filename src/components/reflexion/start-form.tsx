import { useState } from 'react'

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
  onStart,
}: {
  defaultTitle?: string
  defaultMode?: Mode
  submitLabel?: string
  autoFocus?: boolean
  onStart: (title: string, mode: Mode) => void
}) {
  const [title, setTitle] = useState(defaultTitle)
  const [mode, setMode] = useState<Mode>(defaultMode)
  const problem = title.trim()

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        if (problem) onStart(problem, mode)
      }}
    >
      <Textarea
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          // Enter submits, shift+enter keeps a newline: this is one short
          // sentence far more often than it is a paragraph.
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            if (problem) onStart(problem, mode)
          }
        }}
        placeholder="Comment améliorer le monde d'aujourd'hui ?"
        rows={3}
        maxLength={500}
        autoFocus={autoFocus}
        aria-label="Ta problématique"
        className="text-base"
      />

      <ModePicker mode={mode} onChange={setMode} />

      <Button type="submit" size="lg" disabled={!problem}>
        {submitLabel}
      </Button>
    </form>
  )
}
