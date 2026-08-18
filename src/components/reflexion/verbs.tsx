import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'

import type { Verb } from './types.ts'

export function Verbs({ verbs }: { verbs: Array<Verb> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tes trois verbes d’action</CardTitle>
        <CardDescription>
          Ils ciblent la problématique telle qu’elle apparaît maintenant, pas
          telle que tu l’avais formulée au départ.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-4">
          {verbs.map((verb, i) => (
            <li key={verb.verb} className="flex gap-3">
              <span className="text-muted-foreground tabular-nums">
                {i + 1}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium lowercase">{verb.verb}</span>
                <span className="text-muted-foreground text-sm">
                  {verb.solution}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
