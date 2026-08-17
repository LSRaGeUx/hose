import { drizzle } from 'drizzle-orm/node-postgres'

import { env } from '#/env'
import * as schema from './schema.ts'

/**
 * Importing `env` here is deliberate: it is what forces the environment
 * contract to be validated the first time anything touches the database,
 * rather than failing later with an opaque connection error.
 */
export const db = drizzle(env.DATABASE_URL, { schema })
