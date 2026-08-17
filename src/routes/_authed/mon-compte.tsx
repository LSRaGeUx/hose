import { createFileRoute } from '@tanstack/react-router'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'

export const Route = createFileRoute('/_authed/mon-compte')({
  component: Account,
})

function Account() {
  const { user } = Route.useRouteContext()

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
          <CardDescription>
            La modification du profil arrive avec la gestion de l’avatar.
          </CardDescription>
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
          <CardTitle>Mes problématiques</CardTitle>
          <CardDescription>
            L’historique de tes cheminements apparaîtra ici.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Rien pour le moment. Lance une première réflexion depuis l’accueil.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
