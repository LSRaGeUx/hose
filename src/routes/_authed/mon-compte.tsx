import { Link, createFileRoute } from '@tanstack/react-router'

import { Button } from '#/components/ui/button'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { fetchMyProblems, fetchVerbStats } from '#/lib/problems'
import { VerbChart } from '#/components/stats/verb-chart'

import type { ProblemSummary } from '#/lib/problems'

export const Route = createFileRoute('/_authed/mon-compte')({
  loader: async () => ({
    problems: await fetchMyProblems(),
    verbs: await fetchVerbStats(),
  }),
  component: Account,
})

const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

function Account() {
  const { user } = Route.useRouteContext()
  const { problems, verbs } = Route.useLoaderData()

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Mon compte</h1>
        <p className="text-muted-foreground">
          Bonjour {user.name.split(' ')[0]}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-sm">Nom</dt>
              <dd className="font-medium">{user.name}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground text-sm">Adresse e-mail</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mes verbes d’action</CardTitle>
          <CardDescription>
            Ce qui revient le plus souvent dans tes réflexions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VerbChart verbs={verbs} />
        </CardContent>
      </Card>

      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Mes problématiques
          </h2>
          <p className="text-muted-foreground text-sm tabular-nums">
            {problems.length}{' '}
            {problems.length > 1 ? 'problématiques' : 'problématique'}
          </p>
        </div>

        {problems.length === 0 ? (
          <Card>
            <CardContent className="text-muted-foreground py-8 text-center text-sm">
              Rien pour le moment. Lance une première réflexion.
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-4">
            {problems.map((problem) => (
              <li key={problem.id}>
                <ProblemCard problem={problem} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function ProblemCard({ problem }: { problem: ProblemSummary }) {
  const complete = problem.answeredCount === problem.totalCount

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base leading-snug text-balance">
          {problem.title}
        </CardTitle>
        <CardDescription>
          {dateFormat.format(new Date(problem.createdAt))}
          {' · '}
          <span className="tabular-nums">
            {problem.answeredCount}/{problem.totalCount}
          </span>{' '}
          {complete ? 'réponses' : 'réponses, en cours'}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <Button asChild variant="outline" size="sm" className="self-start">
          <Link to="/tableau/$problemId" params={{ problemId: problem.id }}>
            Ouvrir le tableau
          </Link>
        </Button>
      </CardContent>

      {problem.verbs.length > 0 ? (
        <CardContent>
          <ol className="flex flex-col gap-3">
            {problem.verbs.map((verb) => (
              <li key={verb.label} className="flex flex-col gap-0.5">
                <span className="text-sm font-medium lowercase">
                  {verb.label}
                </span>
                <span className="text-muted-foreground text-sm">
                  {verb.solution}
                </span>
              </li>
            ))}
          </ol>
        </CardContent>
      ) : null}
    </Card>
  )
}
