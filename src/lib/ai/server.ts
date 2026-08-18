import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'

import { auth } from '#/lib/auth'
import { fetchFrame } from '#/lib/profile'
import { getAnthropic } from './client.ts'
import {
  askFirstQuestion,
  askNextQuestion,
  runFullChain,
  synthesize,
} from './five-whys.ts'

/**
 * Server-side entry points for the five-whys engine.
 *
 * Every one of these requires a session. The credential never reaches the
 * browser, which is the whole reason the engine lives behind server functions:
 * the 2024 app constructed a Mistral client in the React bundle with the key
 * inlined, so anyone could read it from the page source.
 */

const exchangeSchema = z.object({
  question: z.string().min(1),
  answer: z.string().nullable(),
})

const titleSchema = z.string().trim().min(1).max(500)

async function requireUser() {
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session?.user) throw new Error('Authentification requise.')
  return session.user
}

export const startProblem = createServerFn({ method: 'POST' })
  .validator(z.object({ title: titleSchema }))
  .handler(async ({ data }) => {
    await requireUser()
    return { question: await askFirstQuestion(getAnthropic(), data.title) }
  })

export const nextQuestion = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      title: titleSchema,
      exchanges: z.array(exchangeSchema).min(1).max(5),
    }),
  )
  .handler(async ({ data }) => {
    await requireUser()
    return {
      question: await askNextQuestion(
        getAnthropic(),
        data.title,
        data.exchanges,
      ),
    }
  })

export const generateChain = createServerFn({ method: 'POST' })
  .validator(z.object({ title: titleSchema }))
  .handler(async ({ data }) => {
    await requireUser()
    return { exchanges: await runFullChain(getAnthropic(), data.title) }
  })

export const synthesizeVerbs = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      title: titleSchema,
      exchanges: z.array(exchangeSchema).length(5),
    }),
  )
  .handler(async ({ data }) => {
    await requireUser()
    // Read on the server from the signed-in user's own row. The client never
    // supplies it, so it cannot be spoofed or used to prompt-inject.
    const frame = await fetchFrame()
    return {
      verbs: await synthesize(
        getAnthropic(),
        data.title,
        data.exchanges,
        frame,
      ),
    }
  })
