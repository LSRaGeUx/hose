/**
 * Development seed.
 *
 * Creates one account and two problems that have been worked all the way
 * through, so every later phase has something real to render: five exchanges
 * each, three action verbs with their solutions, and a board.
 *
 * Run with: npm run db:seed
 */
import { config } from 'dotenv'

config({ path: ['.env.local', '.env'], quiet: true })

const { db } = await import('#/db')
const schema = await import('#/db/schema')
const { auth } = await import('#/lib/auth')
const { eq } = await import('drizzle-orm')

const SEED_EMAIL = 'test@hose.local'
const SEED_PASSWORD = 'hose-dev-password'

type Seed = {
  title: string
  exchanges: Array<{ question: string; answer: string }>
  verbs: Array<{ label: string; solution: string }>
}

const SEEDS: Array<Seed> = [
  {
    title: "Je n'arrive pas à me concentrer au travail",
    exchanges: [
      {
        question: 'Pourquoi as-tu du mal à te concentrer au travail ?',
        answer: 'Je suis interrompu toutes les dix minutes.',
      },
      {
        question: 'Pourquoi es-tu interrompu aussi souvent ?',
        answer: "Mes collègues me sollicitent dès qu'ils ont une question.",
      },
      {
        question: 'Pourquoi passent-ils systématiquement par toi ?',
        answer: 'Je suis le seul à connaître la partie paiement du produit.',
      },
      {
        question: 'Pourquoi es-tu le seul à la connaître ?',
        answer:
          "Personne d'autre n'a jamais travaillé dessus et rien n'est écrit.",
      },
      {
        question: "Pourquoi n'y a-t-il rien d'écrit ?",
        answer:
          "On n'a jamais pris le temps de documenter, toujours dans l'urgence.",
      },
    ],
    verbs: [
      {
        label: 'documenter',
        solution: 'Écrire un guide du module paiement en une page.',
      },
      {
        label: 'répartir',
        solution: 'Former un binôme sur la partie paiement chaque sprint.',
      },
      {
        label: 'protéger',
        solution: 'Bloquer deux plages sans interruption par jour.',
      },
    ],
  },
  {
    title: 'Mon équipe livre toujours en retard',
    exchanges: [
      {
        question: 'Pourquoi les livraisons sont-elles en retard ?',
        answer: 'On découvre des imprévus en fin de sprint.',
      },
      {
        question: 'Pourquoi ces imprévus arrivent-ils si tard ?',
        answer: "On ne teste l'intégration qu'au dernier moment.",
      },
      {
        question: "Pourquoi l'intégration est-elle testée si tard ?",
        answer: "L'environnement de test est long à préparer.",
      },
      {
        question: 'Pourquoi est-il si long à préparer ?',
        answer: 'Chaque mise en place est manuelle et refaite à zéro.',
      },
      {
        question: 'Pourquoi la mise en place est-elle manuelle ?',
        answer: "Automatiser demandait du temps qu'on n'a jamais priorisé.",
      },
    ],
    verbs: [
      {
        label: 'automatiser',
        solution: "Scripter la création de l'environnement de test.",
      },
      {
        label: 'anticiper',
        solution: 'Intégrer en continu dès le premier jour du sprint.',
      },
      {
        label: 'prioriser',
        solution: "Réserver 20% de chaque sprint à l'outillage.",
      },
    ],
  },
]

async function main() {
  // Start from a clean slate. Cascades take exchanges, verb links and boards
  // with the user, so deleting the seed account is enough.
  const existing = await db.query.user.findFirst({
    where: eq(schema.user.email, SEED_EMAIL),
  })
  if (existing) {
    await db.delete(schema.user).where(eq(schema.user.id, existing.id))
    console.log('removed previous seed account')
  }

  // Go through Better Auth rather than inserting a row, so the password is
  // hashed exactly the way a real sign-up would hash it.
  await auth.api.signUpEmail({
    body: {
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
      name: 'Yan Test',
    },
  })

  const account = await db.query.user.findFirst({
    where: eq(schema.user.email, SEED_EMAIL),
  })
  if (!account) throw new Error('seed account was not created')

  for (const seed of SEEDS) {
    const [problem] = await db
      .insert(schema.problems)
      .values({ userId: account.id, title: seed.title })
      .returning()

    await db.insert(schema.exchanges).values(
      seed.exchanges.map((e, i) => ({
        problemId: problem.id,
        position: i + 1,
        question: e.question,
        answer: e.answer,
      })),
    )

    for (const [i, v] of seed.verbs.entries()) {
      // Verbs are shared across users, so reuse the row if it already exists.
      const [verb] = await db
        .insert(schema.actionVerbs)
        .values({ label: v.label })
        .onConflictDoUpdate({
          target: schema.actionVerbs.label,
          set: { label: v.label },
        })
        .returning()

      await db.insert(schema.problemVerbs).values({
        problemId: problem.id,
        actionVerbId: verb.id,
        position: i + 1,
        solution: v.solution,
      })
    }

    await db.insert(schema.boards).values({
      problemId: problem.id,
      data: { nodes: [], edges: [] },
    })

    console.log(`seeded problem: ${seed.title}`)
  }

  console.log(`\ndone. sign in with ${SEED_EMAIL} / ${SEED_PASSWORD}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
