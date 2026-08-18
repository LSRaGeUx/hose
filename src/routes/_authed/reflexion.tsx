import { useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'

import { Alert, AlertDescription } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'
import { Textarea } from '#/components/ui/textarea'
import {
  generateChain,
  nextQuestion,
  startProblem,
  synthesizeVerbs,
} from '#/lib/ai/server'
import { saveRun } from '#/lib/problems'
import { Conversation } from '#/components/reflexion/conversation'
import { ModePicker } from '#/components/reflexion/mode-picker'
import { Verbs } from '#/components/reflexion/verbs'

import type { Exchange, Mode, Status, Verb } from '#/components/reflexion/types'

const WHY_COUNT = 5

export const Route = createFileRoute('/_authed/reflexion')({
  component: Reflexion,
})

function errorMessage(error: unknown): string {
  // The user gets a sentence they can act on; the real error still has to be
  // findable, so it goes to the console rather than being swallowed.
  console.error('[reflexion]', error)

  // RefusedError's message is already written for the user, in French.
  if (error instanceof Error && error.message.includes('refus')) {
    return error.message
  }
  return 'Quelque chose a échoué de mon côté. Réessaie dans un instant.'
}

function Reflexion() {
  const [title, setTitle] = useState('')
  const [mode, setMode] = useState<Mode>('assist')
  const [status, setStatus] = useState<Status>({ kind: 'setup' })
  const [exchanges, setExchanges] = useState<Array<Exchange>>([])
  const [verbs, setVerbs] = useState<Array<Verb>>([])
  const [draft, setDraft] = useState('')
  const [savedId, setSavedId] = useState<string | null>(null)

  const problem = title.trim()

  async function runSynthesis(complete: Array<Exchange>) {
    setStatus({ kind: 'synthesizing' })
    const { verbs: result } = await synthesizeVerbs({
      data: { title: problem, exchanges: complete },
    })
    setVerbs(result)

    // Persisted only once the run is actually complete, in a single
    // transaction, so a half-finished chain never reaches the database.
    setStatus({ kind: 'saving' })
    const { problemId } = await saveRun({
      data: {
        title: problem,
        exchanges: complete.map((e) => ({
          question: e.question,
          answer: e.answer ?? '',
        })),
        verbs: result,
      },
    })
    setSavedId(problemId)
    setStatus({ kind: 'done' })
  }

  async function start(chosen: Mode) {
    if (!problem) return
    setMode(chosen)
    setStatus({ kind: 'starting' })
    setExchanges([])
    setVerbs([])
    setSavedId(null)

    try {
      if (chosen === 'auto') {
        const { exchanges: chain } = await generateChain({
          data: { title: problem },
        })
        setExchanges(chain)
        await runSynthesis(chain)
      } else {
        const { question } = await startProblem({ data: { title: problem } })
        setExchanges([{ question, answer: null }])
        setStatus({ kind: 'waiting-for-answer' })
      }
    } catch (error) {
      setStatus({ kind: 'error', message: errorMessage(error) })
    }
  }

  async function answer(event: React.FormEvent) {
    event.preventDefault()
    const value = draft.trim()
    if (!value) return

    const answered = exchanges.map((e, i) =>
      i === exchanges.length - 1 ? { ...e, answer: value } : e,
    )
    setExchanges(answered)
    setDraft('')
    setStatus({ kind: 'thinking' })

    try {
      if (answered.length >= WHY_COUNT) {
        await runSynthesis(answered)
        return
      }
      const { question } = await nextQuestion({
        data: { title: problem, exchanges: answered },
      })
      setExchanges([...answered, { question, answer: null }])
      setStatus({ kind: 'waiting-for-answer' })
    } catch (error) {
      setStatus({ kind: 'error', message: errorMessage(error) })
    }
  }

  function reset() {
    setStatus({ kind: 'setup' })
    setExchanges([])
    setVerbs([])
    setDraft('')
    setSavedId(null)
  }

  if (status.kind === 'setup') {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-16">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            Challenge ta problématique
          </h1>
          <p className="text-muted-foreground">
            Écris ce qui te bloque, même mal formulé. On remonte la chaîne
            ensemble.
          </p>
        </div>

        <Textarea
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Comment améliorer le monde d'aujourd'hui ?"
          rows={3}
          maxLength={500}
          aria-label="Ta problématique"
        />

        <ModePicker mode={mode} onChange={setMode} />

        <Button disabled={!problem} onClick={() => start(mode)}>
          Démarrer
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-12">
      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground text-sm">Ta problématique</p>
        <h1 className="text-xl font-semibold tracking-tight text-balance">
          {problem}
        </h1>
      </div>

      {status.kind === 'error' ? (
        <Alert variant="destructive">
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      ) : null}

      <Conversation exchanges={exchanges} status={status} mode={mode} />

      {status.kind === 'waiting-for-answer' ? (
        <form onSubmit={answer} className="flex flex-col gap-3">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ta réponse…"
            rows={3}
            autoFocus
            aria-label="Ta réponse"
          />
          <Button type="submit" disabled={!draft.trim()}>
            Répondre
          </Button>
        </form>
      ) : null}

      {verbs.length > 0 ? <Verbs verbs={verbs} /> : null}

      {status.kind === 'done' && savedId ? (
        <p className="text-muted-foreground text-sm">
          Cette réflexion est enregistrée dans{' '}
          <Link to="/mon-compte" className="text-foreground underline">
            tes problématiques
          </Link>
          .
        </p>
      ) : null}

      {status.kind === 'done' || status.kind === 'error' ? (
        <Button variant="outline" onClick={reset}>
          Recommencer
        </Button>
      ) : null}
    </div>
  )
}
