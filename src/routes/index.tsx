import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'

import { StartForm } from '#/components/reflexion/start-form'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10 px-4 py-20">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-semibold tracking-tight text-balance">
          Challenge ta problématique
        </h1>
        <p className="text-muted-foreground text-lg text-balance">
          Écris ce qui te bloque, même mal formulé. Cinq fois « pourquoi ? »
          plus tard, tu repars avec trois verbes d’action et une piste concrète
          pour chacun.
        </p>
      </div>

      {/* The call to action is the thing itself, not a button that leads to
          it. Signed out works the same: /reflexion's guard carries the whole
          path to sign-in and back, so the problem survives the detour. */}
      <StartForm
        onStart={(probleme, mode) =>
          navigate({ to: '/reflexion', search: { probleme, mode } })
        }
      />

      {user ? (
        <p className="text-muted-foreground text-sm">
          Ou reprends{' '}
          <Link to="/mon-compte" className="text-foreground underline">
            tes problématiques
          </Link>
          .
        </p>
      ) : (
        <p className="text-muted-foreground text-sm">
          Tu auras besoin d’un compte pour garder tes réflexions.{' '}
          <Link to="/connexion" className="text-foreground underline">
            Se connecter
          </Link>{' '}
          ou{' '}
          <Link to="/inscription" className="text-foreground underline">
            créer un compte
          </Link>
          .
        </p>
      )}
    </div>
  )
}
