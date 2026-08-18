import type { BoardGraph } from './board-types.ts'
import type { PersonalFrame } from './ai/frame.ts'

const COLUMN_X = 0
const VERB_SPACING = 320
const ROW_HEIGHT = 150

/**
 * Builds the starting graph from a completed run.
 *
 * The board opens containing the person's own reasoning rather than an empty
 * canvas: the problem at the top, the five whys descending from it, and the
 * three action verbs fanning out at the bottom. That descent is the shape of
 * the method, so the layout says something rather than just arranging boxes.
 */
export function seedGraph(
  title: string,
  exchanges: Array<{ question: string; answer: string | null }>,
  verbs: Array<{ label: string; solution: string }>,
  frame?: PersonalFrame,
): BoardGraph {
  const nodes: BoardGraph['nodes'] = [
    {
      id: 'problem',
      type: 'problem',
      position: { x: COLUMN_X, y: 0 },
      data: { label: title },
    },
  ]
  const edges: BoardGraph['edges'] = []

  exchanges.forEach((exchange, i) => {
    const id = `why-${i + 1}`
    nodes.push({
      id,
      type: 'why',
      position: { x: COLUMN_X, y: (i + 1) * ROW_HEIGHT },
      data: {
        label: exchange.question,
        detail: exchange.answer ?? undefined,
      },
    })
    edges.push({
      id: `e-${i === 0 ? 'problem' : `why-${i}`}-${id}`,
      source: i === 0 ? 'problem' : `why-${i}`,
      target: id,
    })
  })

  const verbRow = (exchanges.length + 1) * ROW_HEIGHT
  const offset = ((verbs.length - 1) * VERB_SPACING) / 2

  verbs.forEach((verb, i) => {
    const id = `verb-${i + 1}`
    nodes.push({
      id,
      type: 'verb',
      position: { x: COLUMN_X - offset + i * VERB_SPACING, y: verbRow },
      data: { label: verb.label, detail: verb.solution },
    })
    edges.push({
      id: `e-last-${id}`,
      source: exchanges.length > 0 ? `why-${exchanges.length}` : 'problem',
      target: id,
    })
  })

  // The constraints the verbs were judged against, drawn beside the reasoning
  // rather than hidden in the account page. This is the column the 2024 board
  // drew as "Ce que j'aime faire" and friends, except now it is the same data
  // the model actually used.
  const framing: Array<[string, string | null | undefined]> = [
    ['Ce qui me donne de l’énergie', frame?.energises],
    ['Ce qui m’épuise', frame?.drains],
    ['Ce vers quoi je vais', frame?.aspiration],
  ]

  framing
    .filter(([, value]) => Boolean(value))
    .forEach(([label, value], i) => {
      nodes.push({
        id: `frame-${i + 1}`,
        type: 'frame',
        position: { x: COLUMN_X - 420, y: i * ROW_HEIGHT + ROW_HEIGHT },
        data: { label, detail: value ?? undefined },
      })
    })

  return { nodes, edges }
}
