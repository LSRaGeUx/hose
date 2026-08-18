import { Link, createFileRoute } from '@tanstack/react-router'

import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { user } = Route.useRouteContext()

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-24">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-semibold tracking-tight text-balance">
          Challenge ta problématique
        </h1>
        <p className="text-muted-foreground text-lg">
          Cinq fois « pourquoi ? », et ton idée floue devient trois verbes
          d’action avec, pour chacun, une piste concrète.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {user ? (
          <>
            <Button asChild>
              <Link to="/reflexion">Nouvelle réflexion</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/mon-compte">Mes problématiques</Link>
            </Button>
          </>
        ) : (
          <>
            <Button asChild>
              <Link to="/inscription">Commencer</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/connexion">J’ai déjà un compte</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
