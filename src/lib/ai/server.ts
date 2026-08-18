import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { z } from 'zod'

import { env } from '#/env'
import { auth } from '#/lib/auth'
import { fetchFrame } from '#/lib/profile'
import { credentialState, disabledMessage } from './availability.ts'
import { getAnthropic } from './client.ts'
import {
  askFirstQuestion,
  askNextQuestion,
  commitToAction,
  continueChain,
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

/**
 * The engine's guard: a client, or a refusal the user can actually read.
 *
 * Every entry point below goes through this rather than calling getAnthropic
 * directly, so an instance running without a key answers "l'assistant est
 * désactivé" instead of failing somewhere inside the SDK. Only the message
 * survives the server-function boundary, which is why the French sentence is
 * thrown rather than an error class the client would have to reconstruct.
 */
function requireAi() {
  const state = credentialState(env.HOSE_ANTHROPIC_API_KEY)
  if (state !== 'ok') throw new Error(disabledMessage(state))
  return getAnthropic()
}

/**
 * Whether this instance can run the engine at all.
 *
 * No session required, and it says nothing about the credential beyond whether
 * one usable one exists. The root route reads it once so the home page can
 * disable the form up front rather than letting someone type a problem, submit
 * it and only then be told it was never going to work.
 */
export const fetchAiStatus = createServerFn({ method: 'GET' }).handler(
  async (): Promise<{ enabled: boolean; message: string | null }> => {
    const state = credentialState(env.HOSE_ANTHROPIC_API_KEY)
    return state === 'ok'
      ? { enabled: true, message: null }
      : { enabled: false, message: disabledMessage(state) }
  },
)

async function requireUser() {
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session?.user) throw new Error('Authentification requise.')
  return session.user
}

export const startProblem = createServerFn({ method: 'POST' })
  .validator(z.object({ title: titleSchema, avoid: z.string().optional() }))
  .handler(async ({ data }) => {
    await requireUser()
    return {
      question: await askFirstQuestion(requireAi(), data.title, data.avoid),
    }
  })

export const nextQuestion = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      title: titleSchema,
      exchanges: z.array(exchangeSchema).min(1).max(5),
      avoid: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireUser()
    return {
      question: await askNextQuestion(
        requireAi(),
        data.title,
        data.exchanges,
        data.avoid,
      ),
    }
  })

/** Rebuilds the tail of an auto-mode chain after a guess has been corrected. */
export const resumeChain = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      title: titleSchema,
      exchanges: z.array(exchangeSchema).min(1).max(4),
    }),
  )
  .handler(async ({ data }) => {
    await requireUser()
    return {
      exchanges: await continueChain(requireAi(), data.title, data.exchanges),
    }
  })

export const generateChain = createServerFn({ method: 'POST' })
  .validator(z.object({ title: titleSchema }))
  .handler(async ({ data }) => {
    await requireUser()
    return { exchanges: await runFullChain(requireAi(), data.title) }
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
      verbs: await synthesize(requireAi(), data.title, data.exchanges, frame),
    }
  })

/** Turns the verb the person picked into one small, dated first step. */
export const proposeCommitment = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      title: titleSchema,
      verb: z.string().trim().min(1).max(80),
      solution: z.string().trim().min(1).max(400),
    }),
  )
  .handler(async ({ data }) => {
    await requireUser()
    const frame = await fetchFrame()
    return commitToAction(
      requireAi(),
      data.title,
      data.verb,
      data.solution,
      frame,
    )
  })
