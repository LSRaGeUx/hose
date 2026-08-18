import { useState } from 'react'

import { Alert, AlertDescription } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { updateProfile } from '#/lib/profile'

type State = { kind: 'idle' | 'saving' } | { kind: 'error'; message: string }

export function ProfileForm({
  name,
  image,
}: {
  name: string
  image: string | null
}) {
  const [state, setState] = useState<State>({ kind: 'idle' })

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setState({ kind: 'saving' })

    try {
      await updateProfile({
        data: {
          name: String(form.get('name') ?? ''),
          image: String(form.get('image') ?? '').trim(),
        },
      })
      // Full reload so the header picks up the new name and avatar from the
      // session the server resolves, rather than a second copy on the client.
      window.location.reload()
    } catch {
      setState({
        kind: 'error',
        message:
          'Enregistrement impossible. Vérifie que le lien commence par https://',
      })
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {state.kind === 'error' ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nom</Label>
        <Input
          id="name"
          name="name"
          defaultValue={name}
          required
          maxLength={120}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="image">Lien vers ton avatar</Label>
        <Input
          id="image"
          name="image"
          type="url"
          inputMode="url"
          placeholder="https://…"
          defaultValue={image ?? ''}
          maxLength={500}
          aria-describedby="image-hint"
        />
        <p id="image-hint" className="text-muted-foreground text-xs">
          Un lien https vers une image, par exemple ton avatar GitHub. Laisse
          vide pour revenir à tes initiales.
        </p>
      </div>

      <Button
        type="submit"
        disabled={state.kind === 'saving'}
        className="self-start"
      >
        {state.kind === 'saving' ? 'Enregistrement…' : 'Enregistrer'}
      </Button>
    </form>
  )
}
