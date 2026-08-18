import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'

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
import { Textarea } from '#/components/ui/textarea'
import { sendContactMessage } from '#/lib/contact'

export const Route = createFileRoute('/contact')({ component: Contact })

type State =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent' }
  | { kind: 'error'; message: string }

function Contact() {
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setState({ kind: 'sending' })

    try {
      const result = await sendContactMessage({
        data: {
          name: String(form.get('name') ?? ''),
          email: String(form.get('email') ?? ''),
          message: String(form.get('message') ?? ''),
        },
      })

      if (result.sent) {
        setState({ kind: 'sent' })
        return
      }
      setState({
        kind: 'error',
        message:
          result.reason === 'unconfigured'
            ? 'Le formulaire n’est pas encore relié à une boîte mail. Réessaie plus tard.'
            : 'Le message n’est pas parti. Réessaie dans un instant.',
      })
    } catch {
      setState({
        kind: 'error',
        message: 'Le message n’est pas parti. Réessaie dans un instant.',
      })
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
          <CardDescription>
            Une question, un bug, une idée ? Écris-moi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.kind === 'sent' ? (
            <Alert>
              <AlertDescription>
                Message envoyé. Merci, je te réponds vite.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              {state.kind === 'error' ? (
                <Alert variant="destructive">
                  <AlertDescription>{state.message}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Ton nom</Label>
                <Input id="name" name="name" required maxLength={120} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Ton adresse e-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  maxLength={200}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="message">Ton message</Label>
                <Textarea
                  id="message"
                  name="message"
                  rows={6}
                  required
                  minLength={10}
                  maxLength={4000}
                />
              </div>

              <Button type="submit" disabled={state.kind === 'sending'}>
                {state.kind === 'sending' ? 'Envoi…' : 'Envoyer'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
