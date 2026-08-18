import { useState } from 'react'
import { Link, createFileRoute, redirect } from '@tanstack/react-router'

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

const MIN_PASSWORD_LENGTH = 8

export const Route = createFileRoute('/inscription')({
  beforeLoad: ({ context }) => {
    if (context.user) throw redirect({ to: '/mon-compte' })
  },
  component: SignUp,
})

function SignUp() {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const form = new FormData(event.currentTarget)
    const name = String(form.get('name') ?? '').trim()
    const email = String(form.get('email') ?? '')
    const password = String(form.get('password') ?? '')
    const confirmation = String(form.get('confirmation') ?? '')

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(
        `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`,
      )
      return
    }
    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setPending(true)
    const result = await authClient.signUp.email({ name, email, password })

    if (result.error) {
      setError(translateAuthError(result.error))
      setPending(false)
      return
    }

    // Full document load so the server re-resolves the session for beforeLoad.
    window.location.assign('/mon-compte')
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-5 py-20">
      <Card className="rounded-none border-rule-strong shadow-none">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">
            Créer un compte
          </CardTitle>
          <CardDescription>
            Garde une trace de tes problématiques et de leur cheminement.
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
              <Label htmlFor="name">Prénom et nom</Label>
              <Input id="name" name="name" autoComplete="name" required />
            </div>

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
                autoComplete="new-password"
                minLength={MIN_PASSWORD_LENGTH}
                required
                aria-describedby="password-hint"
              />
              <p id="password-hint" className="text-muted-foreground text-xs">
                {MIN_PASSWORD_LENGTH} caractères minimum.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmation">Confirme le mot de passe</Label>
              <Input
                id="confirmation"
                name="confirmation"
                type="password"
                autoComplete="new-password"
                required
              />
            </div>

            <Button type="submit" disabled={pending}>
              {pending ? 'Création…' : 'Créer mon compte'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-center text-sm">
        Déjà un compte ?{' '}
        <Link to="/connexion" className="text-foreground underline">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
