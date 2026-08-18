import { describe, expect, it } from 'vitest'

import {
  MalformedError,
  RefusedError,
  askFirstQuestion,
  askNextQuestion,
  runFullChain,
  synthesize,
} from './five-whys.ts'

import type Anthropic from '@anthropic-ai/sdk'

/**
 * A stand-in for the SDK that records the request and returns a canned
 * response, so the engine's contract is tested without spending tokens.
 */
function fakeClient(response: Record<string, unknown>) {
  const calls: Array<Record<string, any>> = []
  const client = {
    messages: {
      parse: async (params: Record<string, unknown>) => {
        calls.push(params)
        return { stop_reason: 'end_turn', stop_details: null, ...response }
      },
    },
  } as unknown as Anthropic
  return { client, calls }
}

const EXCHANGES = [
  { question: 'Pourquoi A ?', answer: 'Parce que B.' },
  { question: 'Pourquoi B ?', answer: 'Parce que C.' },
]

describe('askFirstQuestion', () => {
  it('returns the question, trimmed', async () => {
    const { client } = fakeClient({
      parsed_output: { question: '  Pourquoi maintenant ?  ' },
    })
    await expect(askFirstQuestion(client, 'Je procrastine')).resolves.toBe(
      'Pourquoi maintenant ?',
    )
  })

  it('sends the problem and a schema-enforced output format', async () => {
    const { client, calls } = fakeClient({
      parsed_output: { question: 'Pourquoi ?' },
    })
    await askFirstQuestion(client, 'Je procrastine')

    expect(calls).toHaveLength(1)
    expect(calls[0].messages[0].content).toContain('Je procrastine')
    // The guarantee that removes the whole parse-failure class.
    expect(calls[0].output_config.format).toBeDefined()
  })
})

describe('askNextQuestion', () => {
  it('passes previous answers so the model can build on them', async () => {
    const { client, calls } = fakeClient({
      parsed_output: { question: 'Pourquoi C ?' },
    })
    await askNextQuestion(client, 'Ma problématique', EXCHANGES)

    const prompt = calls[0].messages[0].content as string
    expect(prompt).toContain('Parce que B.')
    expect(prompt).toContain('Parce que C.')
    // Two answered, so it must be asking the third.
    expect(calls[0].system).toContain('question 3 sur 5')
  })
})

describe('runFullChain', () => {
  it('returns five trimmed exchanges', async () => {
    const exchanges = Array.from({ length: 5 }, (_, i) => ({
      question: ` Pourquoi ${i} ? `,
      answer: ` Parce que ${i}. `,
    }))
    const { client } = fakeClient({ parsed_output: { exchanges } })

    const out = await runFullChain(client, 'Ma problématique')
    expect(out).toHaveLength(5)
    expect(out[0]).toEqual({ question: 'Pourquoi 0 ?', answer: 'Parce que 0.' })
  })
})

describe('synthesize', () => {
  const verbs = [
    { verb: ' Documenter ', solution: ' Écrire un guide. ' },
    { verb: 'Répartir', solution: 'Former un binôme.' },
    { verb: 'Protéger', solution: 'Bloquer deux plages.' },
  ]

  it('normalizes verbs to lowercase and trims', async () => {
    const { client } = fakeClient({ parsed_output: { verbs } })
    const out = await synthesize(client, 'Ma problématique', EXCHANGES)

    expect(out).toEqual([
      { verb: 'documenter', solution: 'Écrire un guide.' },
      { verb: 'répartir', solution: 'Former un binôme.' },
      { verb: 'protéger', solution: 'Bloquer deux plages.' },
    ])
  })

  it('rejects duplicate verbs, which would break the problem_verbs key', async () => {
    const { client } = fakeClient({
      parsed_output: {
        verbs: [
          { verb: 'documenter', solution: 'A.' },
          { verb: 'Documenter', solution: 'B.' },
          { verb: 'protéger', solution: 'C.' },
        ],
      },
    })
    await expect(
      synthesize(client, 'Ma problématique', EXCHANGES),
    ).rejects.toBeInstanceOf(MalformedError)
  })
})

describe('failure handling', () => {
  it('raises RefusedError before touching the body', async () => {
    const { client } = fakeClient({
      stop_reason: 'refusal',
      stop_details: { category: 'cyber' },
      parsed_output: null,
    })
    await expect(askFirstQuestion(client, 'x')).rejects.toBeInstanceOf(
      RefusedError,
    )
  })

  it('carries the refusal category', async () => {
    const { client } = fakeClient({
      stop_reason: 'refusal',
      stop_details: { category: 'cyber' },
      parsed_output: null,
    })
    await expect(askFirstQuestion(client, 'x')).rejects.toMatchObject({
      category: 'cyber',
    })
  })

  it('raises MalformedError when nothing parsed', async () => {
    const { client } = fakeClient({ parsed_output: null })
    await expect(askFirstQuestion(client, 'x')).rejects.toBeInstanceOf(
      MalformedError,
    )
  })
})
