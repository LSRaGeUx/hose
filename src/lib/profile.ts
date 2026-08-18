import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '#/db'
import { profiles, user } from '#/db/schema'
import { auth } from './auth.ts'
import { EMPTY_FRAME } from './ai/frame.ts'

import type { PersonalFrame } from './ai/frame.ts'

export { EMPTY_FRAME } from './ai/frame.ts'
export type { PersonalFrame } from './ai/frame.ts'

function blankToNull(value: string) {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

/**
 * Profile editing: display name and avatar.
 *
 * The avatar is a URL the person supplies rather than an upload. That keeps
 * object storage, its credentials and its bill out of the project for a
 * feature whose whole job is to put a small picture in the header. The 2024
 * version read the file off disk with multer and pushed it into a MySQL BLOB.
 */
export const updateProfile = createServerFn({ method: 'POST' })
  .validator(
    z.object({
      name: z.string().trim().min(1).max(120),
      // https only: an http URL would be blocked as mixed content in the
      // browser anyway, and this is going straight into an <img src>.
      image: z
        .union([
          z.string().trim().url().startsWith('https://').max(500),
          z.literal(''),
        ])
        .transform((v) => (v === '' ? null : v)),
    }),
  )
  .handler(async ({ data }): Promise<{ updated: true }> => {
    const session = await auth.api.getSession({
      headers: getRequest().headers,
    })
    if (!session?.user) throw new Error('Authentification requise.')

    await db
      .update(user)
      .set({ name: data.name, image: data.image })
      .where(eq(user.id, session.user.id))

    return { updated: true }
  })

export const fetchFrame = createServerFn({ method: 'GET' }).handler(
  async (): Promise<PersonalFrame> => {
    const session = await auth.api.getSession({
      headers: getRequest().headers,
    })
    if (!session?.user) return EMPTY_FRAME

    const row = await db.query.profiles.findFirst({
      where: eq(profiles.userId, session.user.id),
    })

    return {
      energises: row?.energises ?? null,
      drains: row?.drains ?? null,
      aspiration: row?.aspiration ?? null,
    }
  },
)

const frameSchema = z.object({
  energises: z.string().max(400).transform(blankToNull),
  drains: z.string().max(400).transform(blankToNull),
  aspiration: z.string().max(400).transform(blankToNull),
})

export const updateFrame = createServerFn({ method: 'POST' })
  .validator(frameSchema)
  .handler(async ({ data }): Promise<{ updated: true }> => {
    const session = await auth.api.getSession({
      headers: getRequest().headers,
    })
    if (!session?.user) throw new Error('Authentification requise.')

    await db
      .insert(profiles)
      .values({ userId: session.user.id, ...data })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: { ...data, updatedAt: new Date() },
      })

    return { updated: true }
  })
