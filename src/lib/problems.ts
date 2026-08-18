import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { asc, count, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '#/db'
import {
  actionVerbs,
  boards,
  exchanges as exchangesTable,
  problemVerbs,
  problems,
} from '#/db/schema'
import { auth } from './auth.ts'

export type ProblemSummary = {
  id: string
  title: string
  createdAt: string
  answeredCount: number
  totalCount: number
  verbs: Array<{ label: string; solution: string }>
}

/**
 * Every problem belonging to the signed-in user, newest first.
 *
 * The owner is taken from the session on the server. Nothing about which rows
 * to return comes from the caller, so there is no id to tamper with. The 2024
 * backend did the opposite: routes like /getMyProblem read `ID_user` straight
 * out of the request body and returned whatever it named.
 */
export const fetchMyProblems = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<ProblemSummary>> => {
    const session = await auth.api.getSession({
      headers: getRequest().headers,
    })
    if (!session?.user) return []

    const rows = await db.query.problems.findMany({
      where: eq(problems.userId, session.user.id),
      orderBy: (p) => desc(p.createdAt),
      with: {
        exchanges: {
          columns: { answer: true },
          orderBy: (e) => asc(e.position),
        },
        verbs: {
          columns: { solution: true, position: true },
          orderBy: (v) => asc(v.position),
          with: { verb: { columns: { label: true } } },
        },
      },
    })

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      createdAt: row.createdAt.toISOString(),
      answeredCount: row.exchanges.filter((e) => e.answer !== null).length,
      totalCount: row.exchanges.length,
      verbs: row.verbs.map((v) => ({
        label: v.verb.label,
        solution: v.solution,
      })),
    }))
  },
)

const saveRunSchema = z.object({
  title: z.string().trim().min(1).max(500),
  exchanges: z
    .array(z.object({ question: z.string().min(1), answer: z.string().min(1) }))
    .length(5),
  verbs: z
    .array(z.object({ verb: z.string().min(1), solution: z.string().min(1) }))
    .length(3),
})

/**
 * Persists a completed run: the problem, its five exchanges, the three verbs
 * with their solutions, and an empty board.
 *
 * All of it in one transaction, so a partial run can never be written. The
 * 2024 backend saved these across several unrelated endpoints with no
 * transaction, and dropped the solutions entirely.
 */
export const saveRun = createServerFn({ method: 'POST' })
  .validator(saveRunSchema)
  .handler(async ({ data }): Promise<{ problemId: string }> => {
    const session = await auth.api.getSession({
      headers: getRequest().headers,
    })
    if (!session?.user) throw new Error('Authentification requise.')
    const userId = session.user.id

    return db.transaction(async (tx) => {
      const [problem] = await tx
        .insert(problems)
        .values({ userId, title: data.title })
        .returning()

      await tx.insert(exchangesTable).values(
        data.exchanges.map((e, i) => ({
          problemId: problem.id,
          position: i + 1,
          question: e.question,
          answer: e.answer,
        })),
      )

      for (const [i, v] of data.verbs.entries()) {
        // Verbs are shared vocabulary across every user, so reuse the row.
        const label = v.verb.trim().toLowerCase()
        const [verb] = await tx
          .insert(actionVerbs)
          .values({ label })
          .onConflictDoUpdate({ target: actionVerbs.label, set: { label } })
          .returning()

        await tx.insert(problemVerbs).values({
          problemId: problem.id,
          actionVerbId: verb.id,
          position: i + 1,
          solution: v.solution,
        })
      }

      await tx
        .insert(boards)
        .values({ problemId: problem.id, data: { nodes: [], edges: [] } })

      return { problemId: problem.id }
    })
  })

export type VerbCount = { label: string; count: number }

/**
 * How often each action verb has come up across the signed-in user's problems.
 *
 * Aggregated in SQL rather than by pulling every row and counting in JS. The
 * 2024 endpoint (/getAllVerbsByProblems) issued one query per problem inside a
 * loop and called res.json from within it, so any failure mid-loop sent a
 * second response.
 */
export const fetchVerbStats = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Array<VerbCount>> => {
    const session = await auth.api.getSession({
      headers: getRequest().headers,
    })
    if (!session?.user) return []

    const rows = await db
      .select({
        label: actionVerbs.label,
        count: count(problemVerbs.actionVerbId),
      })
      .from(problemVerbs)
      .innerJoin(actionVerbs, eq(actionVerbs.id, problemVerbs.actionVerbId))
      .innerJoin(problems, eq(problems.id, problemVerbs.problemId))
      .where(eq(problems.userId, session.user.id))
      .groupBy(actionVerbs.label)
      .orderBy(desc(count(problemVerbs.actionVerbId)), asc(actionVerbs.label))

    return rows.map((r) => ({ label: r.label, count: Number(r.count) }))
  },
)
