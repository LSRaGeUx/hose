import { z } from 'zod'

export const WHY_COUNT = 5
export const VERB_COUNT = 3

/** One "pourquoi ?" the assistant asks. */
export const questionSchema = z.object({
  question: z
    .string()
    .describe('La question « Pourquoi ... ? » à poser, une seule phrase.'),
})

const exchangeSchema = z.object({
  question: z.string().describe('Une question « Pourquoi ... ? ».'),
  answer: z
    .string()
    .describe('La réponse plausible de la personne, à la première personne.'),
})

/**
 * A chain of exactly `count` exchanges.
 *
 * Parameterised because continuing a corrected chain asks only for what is
 * still missing, and the count has to be in the schema for the model to be
 * held to it.
 */
export function chainSchemaOf(count: number) {
  return z.object({
    exchanges: z
      .array(exchangeSchema)
      .length(count)
      .describe('Les échanges, du plus superficiel au plus profond.'),
  })
}

/** The whole chain, generated unattended in auto mode. */
export const chainSchema = chainSchemaOf(WHY_COUNT)

/** The three action verbs and their solutions. */
export const synthesisSchema = z.object({
  verbs: z
    .array(
      z.object({
        verb: z
          .string()
          .describe(
            "Un verbe d'action à l'infinitif, en minuscules, un seul mot.",
          ),
        solution: z
          .string()
          .describe(
            'La meilleure action concrète pour ce verbe, dix mots maximum.',
          ),
      }),
    )
    .length(VERB_COUNT),
})

/** One concrete first step, small enough that it will actually happen. */
export const commitmentSchema = z.object({
  action: z
    .string()
    .describe(
      'Une seule action concrète, à la deuxième personne, commençant par un verbe.',
    ),
  when: z
    .string()
    .describe(
      'Quand la faire, en quelques mots. Par exemple « avant vendredi ».',
    ),
})

export type Commitment = z.infer<typeof commitmentSchema>
export type Question = z.infer<typeof questionSchema>
export type Chain = z.infer<typeof chainSchema>
export type Synthesis = z.infer<typeof synthesisSchema>

/** An answered or pending step, as stored and as passed back to the model. */
export type Exchange = {
  question: string
  answer: string | null
}
