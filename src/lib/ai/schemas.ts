import { z } from 'zod'

export const WHY_COUNT = 5
export const VERB_COUNT = 3

/** One "pourquoi ?" the assistant asks. */
export const questionSchema = z.object({
  question: z
    .string()
    .describe('La question « Pourquoi ... ? » à poser, une seule phrase.'),
})

/** The whole chain, generated unattended in auto mode. */
export const chainSchema = z.object({
  exchanges: z
    .array(
      z.object({
        question: z.string().describe('Une question « Pourquoi ... ? ».'),
        answer: z
          .string()
          .describe(
            'La réponse plausible de la personne, à la première personne.',
          ),
      }),
    )
    .length(WHY_COUNT)
    .describe('Les cinq échanges, du plus superficiel au plus profond.'),
})

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

export type Question = z.infer<typeof questionSchema>
export type Chain = z.infer<typeof chainSchema>
export type Synthesis = z.infer<typeof synthesisSchema>

/** An answered or pending step, as stored and as passed back to the model. */
export type Exchange = {
  question: string
  answer: string | null
}
