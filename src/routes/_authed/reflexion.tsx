import { useEffect, useRef, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { Alert, AlertDescription } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'
import { Textarea } from '#/components/ui/textarea'
import {
  generateChain,
  nextQuestion,
  resumeChain,
  startProblem,
  synthesizeVerbs,
} from '#/lib/ai/server'
import { saveRun } from '#/lib/problems'
import { Conversation } from '#/components/reflexion/conversation'
import { StartForm } from '#/components/reflexion/start-form'
import { Verbs } from '#/components/reflexion/verbs'

import type { Exchange, Mode, Status, Verb } from '#/components/reflexion/types'

const WHY_COUNT = 5

const searchSchema = z.object({
  /** Carried from the home page so the run starts without retyping. */
  probleme: z.string().trim().min(1).max(500).optional(),
  mode: z.enum(['auto', 'assist']).optional(),
})

export const Route = createFileRoute('/_authed/reflexion')({
  validateSearch: searchSchema,
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
  const search = Route.useSearch()
  const [title, setTitle] = useState(search.probleme ?? '')
  const [mode, setMode] = useState<Mode>(search.mode ?? 'assist')
  const [status, setStatus] = useState<Status>({ kind: 'setup' })
  const [exchanges, setExchanges] = useState<Array<Exchange>>([])
  const [verbs, setVerbs] = useState<Array<Verb>>([])
  const [draft, setDraft] = useState('')
  const [savedId, setSavedId] = useState<string | null>(null)

  const problem = title.trim()

  async function runSynthesis(
    complete: Array<Exchange>,
    explicitTitle?: string,
  ) {
    const subject = (explicitTitle ?? title).trim()
    setStatus({ kind: 'synthesizing' })
    const { verbs: result } = await synthesizeVerbs({
      data: { title: subject, exchanges: complete },
    })
    setVerbs(result)

    // Persisted only once the run is actually complete, in a single
    // transaction, so a half-finished chain never reaches the database.
    setStatus({ kind: 'saving' })
    const { problemId } = await saveRun({
      data: {
        title: subject,
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

  async function start(chosen: Mode, explicitTitle?: string) {
    const subject = (explicitTitle ?? title).trim()
    if (!subject) return
    setTitle(subject)
    setMode(chosen)
    setStatus({ kind: 'starting' })
    setExchanges([])
    setVerbs([])
    setSavedId(null)

    try {
      if (chosen === 'auto') {
        const { exchanges: chain } = await generateChain({
          data: { title: subject },
        })
        setExchanges(chain)
        await runSynthesis(chain, subject)
      } else {
        const { question } = await startProblem({ data: { title: subject } })
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

  // Arriving from the home page already carries a problem, so the run begins
  // rather than asking for it a second time. Guarded so a re-render, or coming
  // back to this URL later, cannot start it twice.
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    if (!search.probleme) return
    started.current = true
    void start(search.mode ?? 'assist', search.probleme)
  }, [search.probleme, search.mode, start])

  /**
   * Swaps the question currently waiting for an answer.
   *
   * A misread question is not a small problem: every later question is
   * reasoned from it, so one bad step quietly wastes the remaining four.
   */
  async function regenerate() {
    const pendingIndex = exchanges.length - 1
    if (pendingIndex < 0) return
    const current = exchanges[pendingIndex]
    if (current.answer !== null) return

    const answered = exchanges.slice(0, pendingIndex)
    setStatus({ kind: 'thinking' })
    try {
      const { question } =
        answered.length === 0
          ? await startProblem({
              data: { title: problem, avoid: current.question },
            })
          : await nextQuestion({
              data: {
                title: problem,
                exchanges: answered,
                avoid: current.question,
              },
            })
      setExchanges([...answered, { question, answer: null }])
      setStatus({ kind: 'waiting-for-answer' })
    } catch (error) {
      setStatus({ kind: 'error', message: errorMessage(error) })
    }
  }

  /**
   * Corrects an earlier answer and reasons the rest again.
   *
   * Everything after that point was derived from the old answer, so keeping it
   * would leave a chain that no longer follows from itself.
   */
  async function editAnswer(index: number, corrected: string) {
    const kept = exchanges
      .slice(0, index + 1)
      .map((e, i) => (i === index ? { ...e, answer: corrected } : e))

    setExchanges(kept)
    setVerbs([])
    setSavedId(null)
    setStatus({ kind: 'rewinding' })

    try {
      if (kept.length >= WHY_COUNT) {
        await runSynthesis(kept)
        return
      }

      // Auto mode invented the answers, so it rebuilds its own tail. Assist
      // mode hands the next question back to the person, as it always does.
      if (mode === 'auto') {
        const { exchanges: rest } = await resumeChain({
          data: { title: problem, exchanges: kept },
        })
        const full = [...kept, ...rest]
        setExchanges(full)
        await runSynthesis(full)
        return
      }

      const { question } = await nextQuestion({
        data: { title: problem, exchanges: kept },
      })
      setExchanges([...kept, { question, answer: null }])
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
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 py-20">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-[-0.02em] text-balance">
            Nouvelle réflexion
          </h1>
          <p className="text-muted-foreground">
            Écris ce qui te bloque, même mal formulé. On remonte la chaîne
            ensemble.
          </p>
        </div>

        <StartForm
          defaultTitle={title}
          defaultMode={mode}
          autoFocus
          onStart={(value, chosen) => void start(chosen, value)}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10 px-5 py-14">
      <div className="flex flex-col gap-1">
        <p className="label-technical">Ta problématique</p>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-balance">
          {problem}
        </h1>
      </div>

      {status.kind === 'error' ? (
        <Alert variant="destructive">
          <AlertDescription>{status.message}</AlertDescription>
        </Alert>
      ) : null}

      <Conversation
        exchanges={exchanges}
        status={status}
        mode={mode}
        onRegenerate={regenerate}
        onEditAnswer={editAnswer}
      />

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
