import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'

import { StartForm } from '#/components/reflexion/start-form'

export const Route = createFileRoute('/')({ component: Home })

const STEPS = [
  ['01', 'Tu écris ce qui te bloque, même mal formulé.'],
  ['02', 'On remonte la chaîne : cinq fois « pourquoi ? ».'],
  ['03', 'Tu repars avec trois verbes d’action et une piste pour chacun.'],
] as const

function Home() {
  const { user } = Route.useRouteContext()
  const navigate = useNavigate()

  return (
    <div className="mx-auto grid max-w-5xl gap-12 px-5 py-16 lg:grid-cols-[1fr_360px] lg:gap-16 lg:py-24">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-5">
          <p className="label-technical">Méthode des 5 pourquoi</p>
          <h1 className="max-w-[14ch] text-[clamp(2.5rem,6vw,4rem)] leading-[0.95] font-semibold tracking-[-0.03em] text-balance">
            Challenge ta problématique
          </h1>
          <p className="text-muted-foreground max-w-[46ch] text-lg leading-relaxed">
            Une idée floue, cinq questions, et une cause que tu n’avais pas vue
            venir.
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
            <Link
              to="/mon-compte"
              className="text-foreground decoration-signal underline underline-offset-4"
            >
              tes problématiques
            </Link>
            .
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">
            Un compte est nécessaire pour garder tes réflexions.{' '}
            <Link
              to="/connexion"
              className="text-foreground decoration-signal underline underline-offset-4"
            >
              Connexion
            </Link>{' '}
            ·{' '}
            <Link
              to="/inscription"
              className="text-foreground decoration-signal underline underline-offset-4"
            >
              Créer un compte
            </Link>
          </p>
        )}
      </div>

      {/* The method itself, numbered like the worksheet it is. */}
      <aside className="border-rule-strong flex h-fit flex-col border-t lg:border-t-0 lg:border-l lg:pl-8">
        <p className="label-technical pt-8 pb-5 lg:pt-0">Comment ça marche</p>
        <ol className="flex flex-col">
          {STEPS.map(([n, text], i) => (
            <li
              key={n}
              className={`flex gap-4 py-5 ${i > 0 ? 'border-rule border-t' : ''}`}
            >
              <span className="text-signal mt-0.5 font-mono text-[11px] leading-none">
                {n}
              </span>
              <p className="text-sm leading-relaxed">{text}</p>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  )
}
