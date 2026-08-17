import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { asc, desc, eq } from 'drizzle-orm'

import { db } from '#/db'
import { problems } from '#/db/schema'
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
