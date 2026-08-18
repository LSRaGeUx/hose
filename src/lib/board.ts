import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { and, asc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '#/db'
import { boards, problems } from '#/db/schema'
import { auth } from './auth.ts'

import type { BoardGraph } from './board-types.ts'

const nodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  data: z.object({ label: z.string(), detail: z.string().optional() }),
})

const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
})

export type BoardPayload = {
  title: string
  exchanges: Array<{ question: string; answer: string | null }>
  verbs: Array<{ label: string; solution: string }>
  /** null when the board has never been arranged, so the caller seeds it. */
  data: BoardGraph | null
}

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: getRequest().headers })
  if (!session?.user) throw new Error('Authentification requise.')
  return session.user.id
}

/**
 * Ownership is part of the WHERE clause rather than a check afterwards, so a
 * problem belonging to someone else is simply not found. There is no code path
 * where the row is read first and the permission decided second.
 */
export const fetchBoard = createServerFn({ method: 'GET' })
  .validator(z.object({ problemId: z.string().uuid() }))
  .handler(async ({ data }): Promise<BoardPayload> => {
    const userId = await requireUserId()

    const problem = await db.query.problems.findFirst({
      where: and(eq(problems.id, data.problemId), eq(problems.userId, userId)),
      with: {
        exchanges: {
          columns: { question: true, answer: true },
          orderBy: (e) => asc(e.position),
        },
        verbs: {
          columns: { solution: true },
          orderBy: (v) => asc(v.position),
          with: { verb: { columns: { label: true } } },
        },
        board: { columns: { data: true } },
      },
    })

    if (!problem) throw new Error('Problématique introuvable.')

    const stored = problem.board?.data
    const hasLayout =
      stored != null && Array.isArray(stored.nodes) && stored.nodes.length > 0

    return {
      title: problem.title,
      exchanges: problem.exchanges,
      verbs: problem.verbs.map((v) => ({
        label: v.verb.label,
        solution: v.solution,
      })),
      data: hasLayout ? stored : null,
    }
  })

export const saveBoard = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      problemId: z.string().uuid(),
      nodes: z.array(nodeSchema),
      edges: z.array(edgeSchema),
    }),
  )
  .handler(async ({ data }): Promise<{ saved: true }> => {
    const userId = await requireUserId()

    // Same pattern: the ownership test is the query, not a later branch.
    const owned = await db.query.problems.findFirst({
      columns: { id: true },
      where: and(eq(problems.id, data.problemId), eq(problems.userId, userId)),
    })
    if (!owned) throw new Error('Problématique introuvable.')

    await db
      .insert(boards)
      .values({
        problemId: data.problemId,
        data: { nodes: data.nodes, edges: data.edges },
      })
      .onConflictDoUpdate({
        target: boards.problemId,
        set: {
          data: { nodes: data.nodes, edges: data.edges },
          updatedAt: new Date(),
        },
      })

    return { saved: true }
  })
