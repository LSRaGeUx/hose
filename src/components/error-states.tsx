import { Link } from '@tanstack/react-router'

import { Button } from '#/components/ui/button'

function Shell({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-4 px-4 py-24">
      <h1 className="text-2xl font-semibold tracking-tight text-balance">
        {title}
      </h1>
      {children}
    </div>
  )
}

/**
 * Shown when a route throws. The real error goes to the console rather than
 * onto the page: a stack trace tells the visitor nothing and can leak details
 * of the server. The 2024 backend did the opposite, returning raw SQL errors
 * to the client from every route.
 */
export function RouteError({ error }: { error: Error }) {
  console.error('[route]', error)

  return (
    <Shell title="Quelque chose a cassé">
      <p className="text-muted-foreground">
        L’erreur vient de mon côté, pas du tien. Tu peux recharger la page ou
        revenir à l’accueil.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => window.location.reload()}>Recharger</Button>
        <Button asChild variant="outline">
          <Link to="/">Accueil</Link>
        </Button>
      </div>
    </Shell>
  )
}

export function RouteNotFound() {
  return (
    <Shell title="Page introuvable">
      <p className="text-muted-foreground">
        Cette page n’existe pas, ou elle ne t’appartient pas.
      </p>
      <Button asChild>
        <Link to="/">Retour à l’accueil</Link>
      </Button>
    </Shell>
  )
}
