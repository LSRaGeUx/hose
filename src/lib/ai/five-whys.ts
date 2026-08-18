import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'

import { MODEL } from './model.ts'
import {
  chainSchema,
  chainSchemaOf,
  questionSchema,
  synthesisSchema,
  VERB_COUNT,
  WHY_COUNT,
} from './schemas.ts'
import {
  continueChainPrompt,
  firstQuestionPrompt,
  fullChainPrompt,
  nextQuestionPrompt,
  synthesisPrompt,
} from './prompts.ts'

import { EMPTY_FRAME } from './frame.ts'

import type Anthropic from '@anthropic-ai/sdk'
import type { PersonalFrame } from './frame.ts'
import type { z } from 'zod'
import type { Chain, Exchange, Synthesis } from './schemas.ts'

/** The model declined the request. Carries the category when one is given. */
export class RefusedError extends Error {
  constructor(readonly category?: string | null) {
    super('La demande a été refusée. Reformule ta problématique et réessaie.')
    this.name = 'RefusedError'
  }
}

/** The response came back but did not match the schema. */
export class MalformedError extends Error {
  constructor() {
    super('Réponse inattendue du modèle.')
    this.name = 'MalformedError'
  }
}

type AskOptions<TSchema extends z.ZodType> = {
  system: string
  user: string
  schema: TSchema
  effort: 'low' | 'medium' | 'high'
  maxTokens: number
}

/**
 * One schema-enforced request.
 *
 * The shape is guaranteed by `output_config.format`, so there is no regex, no
 * JSON.parse and no repair step. The 2024 code asked for JSON in prose, pulled
 * the first {...} out with a regex and parsed it during render, which is why
 * any deviation produced a white screen.
 */
async function ask<TSchema extends z.ZodType>(
  client: Anthropic,
  { system, user, schema, effort, maxTokens }: AskOptions<TSchema>,
): Promise<z.infer<TSchema>> {
  const message = await client.messages.parse({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    output_config: { format: zodOutputFormat(schema), effort },
    messages: [{ role: 'user', content: user }],
  })

  // Always checked before reading content: a refusal returns HTTP 200 with an
  // empty or partial body, so indexing straight into it would throw.
  if (message.stop_reason === 'refusal') {
    throw new RefusedError(message.stop_details?.category)
  }
  if (!message.parsed_output) throw new MalformedError()

  return message.parsed_output
}

/** The opening "pourquoi ?", used by both modes. */
export async function askFirstQuestion(
  client: Anthropic,
  title: string,
  avoid?: string,
): Promise<string> {
  const { system, user } = firstQuestionPrompt(title, avoid)
  const out = await ask(client, {
    system,
    user,
    schema: questionSchema,
    effort: 'low',
    maxTokens: 2000,
  })
  return out.question.trim()
}

/** The next "pourquoi ?", given every answer so far. Assist mode. */
export async function askNextQuestion(
  client: Anthropic,
  title: string,
  exchanges: Array<Exchange>,
  avoid?: string,
): Promise<string> {
  const { system, user } = nextQuestionPrompt(title, exchanges, avoid)
  const out = await ask(client, {
    system,
    user,
    schema: questionSchema,
    effort: 'low',
    maxTokens: 2000,
  })
  return out.question.trim()
}

/** All five questions and plausible answers in one call. Auto mode. */
export async function runFullChain(
  client: Anthropic,
  title: string,
): Promise<Chain['exchanges']> {
  const { system, user } = fullChainPrompt(title)
  const out = await ask(client, {
    system,
    user,
    schema: chainSchema,
    effort: 'medium',
    maxTokens: 4000,
  })
  return out.exchanges.map((e) => ({
    question: e.question.trim(),
    answer: e.answer.trim(),
  }))
}

/**
 * Fills a chain back out to five from a corrected prefix. Auto mode only.
 */
export async function continueChain(
  client: Anthropic,
  title: string,
  exchanges: Array<Exchange>,
): Promise<Chain['exchanges']> {
  const remaining = WHY_COUNT - exchanges.length
  if (remaining <= 0) return []

  const { system, user } = continueChainPrompt(title, exchanges, remaining)
  const out = await ask(client, {
    system,
    user,
    // Built per call: the model must return exactly what is still missing.
    schema: chainSchemaOf(remaining),
    effort: 'medium',
    maxTokens: 4000,
  })

  return out.exchanges.map((e) => ({
    question: e.question.trim(),
    answer: e.answer.trim(),
  }))
}

/**
 * The three action verbs and their solutions.
 *
 * Both modes converge here, so auto and assist cannot drift apart the way they
 * did in 2024, where one branch called a current SDK method and the other
 * called one that no longer existed.
 */
export async function synthesize(
  client: Anthropic,
  title: string,
  exchanges: Array<Exchange>,
  frame: PersonalFrame = EMPTY_FRAME,
): Promise<Synthesis['verbs']> {
  const { system, user } = synthesisPrompt(title, exchanges, frame)
  const out = await ask(client, {
    system,
    user,
    schema: synthesisSchema,
    effort: 'medium',
    maxTokens: 2000,
  })

  const verbs = out.verbs.map((v) => ({
    verb: v.verb.trim().toLowerCase(),
    solution: v.solution.trim(),
  }))

  // The schema fixes the count; distinctness is a semantic rule the model can
  // still break, and duplicates would violate the problem_verbs primary key.
  const unique = new Set(verbs.map((v) => v.verb))
  if (unique.size !== VERB_COUNT) throw new MalformedError()

  return verbs
}
