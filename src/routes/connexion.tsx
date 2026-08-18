import { useState } from 'react'
import { Link, createFileRoute, redirect } from '@tanstack/react-router'
import { z } from 'zod'

import { Alert, AlertDescription } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { authClient } from '#/lib/auth-client'
import { translateAuthError } from '#/lib/auth-errors'

const searchSchema = z.object({
  // Where to land after signing in. Relative paths only, so the parameter
  // cannot be used to bounce someone to another site.
  redirect: z
    .string()
    .refine((v) => v.startsWith('/') && !v.startsWith('//'))
    .optional(),
})

export const Route = createFileRoute('/connexion')({
  validateSearch: searchSchema,
  beforeLoad: ({ context, search }) => {
    if (context.user) throw redirect({ to: search.redirect ?? '/mon-compte' })
  },
  component: SignIn,
})

function SignIn() {
  const search = Route.useSearch()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const form = new FormData(event.currentTarget)
    const result = await authClient.signIn.email({
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
    })

    if (result.error) {
      setError(translateAuthError(result.error))
      setPending(false)
      return
    }

    // Full document load so the server re-resolves the session for beforeLoad.
    window.location.assign(search.redirect ?? '/mon-compte')
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-5 py-20">
      <Card className="rounded-none border-rule-strong shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Connexion</CardTitle>
          <CardDescription>
            Retrouve tes problématiques et tes verbes d’action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>

            <Button type="submit" disabled={pending}>
              {pending ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-center text-sm">
        Pas encore de compte ?{' '}
        <Link to="/inscription" className="text-foreground underline">
          Créer un compte
        </Link>
      </p>
    </div>
  )
}
