import { relations, sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core'

import { user } from './auth-schema.ts'

// Better Auth owns user / session / account / verification. Re-exported so the
// adapter and drizzle-kit both see one schema module.
export * from './auth-schema.ts'

/**
 * A problem someone is working through. Owned by exactly one user.
 *
 * The 2024 schema modelled this as many-to-many via a `usersproblem` join and
 * then deduplicated new problems against old ones with a Levenshtein distance
 * of 3, which silently merged unrelated problems. Ownership is now a plain
 * foreign key and merging is an explicit choice in the UI.
 */
export const problems = pgTable(
  'problems',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => [index('problems_user_id_idx').on(t.userId, t.createdAt)],
)

/**
 * One "pourquoi ?" and its answer. Five per problem.
 *
 * `position` is explicit so ordering never depends on insertion order or on a
 * `SELECT DISTINCT` happening to come back sorted, which is how the old
 * `dialog` table worked.
 */
export const exchanges = pgTable(
  'exchanges',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    problemId: uuid('problem_id')
      .notNull()
      .references(() => problems.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    question: text('question').notNull(),
    answer: text('answer'),
  },
  (t) => [
    unique('exchanges_problem_position_key').on(t.problemId, t.position),
    check('exchanges_position_range', sql`${t.position} between 1 and 5`),
  ],
)

/**
 * An action verb, shared across every user so the frequency chart is
 * meaningful. `label` is stored already normalized (trimmed, lowercased).
 */
export const actionVerbs = pgTable('action_verbs', {
  id: uuid('id').primaryKey().defaultRandom(),
  label: text('label').notNull().unique(),
})

/**
 * The three verbs a problem resolved to, each with the solution the model
 * proposed for it.
 *
 * `solution` is the important column: the 2024 AI generated Solution1..3 on
 * every run and the backend persisted none of them, so half the product's
 * output was discarded. It is NOT NULL here on purpose.
 */
export const problemVerbs = pgTable(
  'problem_verbs',
  {
    problemId: uuid('problem_id')
      .notNull()
      .references(() => problems.id, { onDelete: 'cascade' }),
    actionVerbId: uuid('action_verb_id')
      .notNull()
      .references(() => actionVerbs.id, { onDelete: 'restrict' }),
    position: integer('position').notNull(),
    solution: text('solution').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.problemId, t.actionVerbId] }),
    unique('problem_verbs_problem_position_key').on(t.problemId, t.position),
    check('problem_verbs_position_range', sql`${t.position} between 1 and 3`),
  ],
)

export type BoardState = {
  nodes: Array<unknown>
  edges: Array<unknown>
}

/** The React Flow board for a problem. At most one per problem. */
export const boards = pgTable('boards', {
  problemId: uuid('problem_id')
    .primaryKey()
    .references(() => problems.id, { onDelete: 'cascade' }),
  data: jsonb('data').$type<BoardState>().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const problemsRelations = relations(problems, ({ one, many }) => ({
  owner: one(user, { fields: [problems.userId], references: [user.id] }),
  exchanges: many(exchanges),
  verbs: many(problemVerbs),
  board: one(boards),
}))

export const exchangesRelations = relations(exchanges, ({ one }) => ({
  problem: one(problems, {
    fields: [exchanges.problemId],
    references: [problems.id],
  }),
}))

export const actionVerbsRelations = relations(actionVerbs, ({ many }) => ({
  problems: many(problemVerbs),
}))

export const problemVerbsRelations = relations(problemVerbs, ({ one }) => ({
  problem: one(problems, {
    fields: [problemVerbs.problemId],
    references: [problems.id],
  }),
  verb: one(actionVerbs, {
    fields: [problemVerbs.actionVerbId],
    references: [actionVerbs.id],
  }),
}))

export const boardsRelations = relations(boards, ({ one }) => ({
  problem: one(problems, {
    fields: [boards.problemId],
    references: [problems.id],
  }),
}))
