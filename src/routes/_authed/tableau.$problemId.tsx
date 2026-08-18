import { useCallback, useEffect, useState } from 'react'
import { Link, createFileRoute } from '@tanstack/react-router'

import { Button } from '#/components/ui/button'
import { BoardCanvas } from '#/components/board/canvas'
import { fetchBoard, saveBoard } from '#/lib/board'
import { seedGraph } from '#/lib/board-layout'

import type { BoardGraph } from '#/lib/board-types'

export const Route = createFileRoute('/_authed/tableau/$problemId')({
  loader: ({ params }) => fetchBoard({ data: { problemId: params.problemId } }),
  component: Board,
})

function Board() {
  const { problemId } = Route.useParams()
  const board = Route.useLoaderData()

  // A board that has never been arranged is seeded from the run itself, so it
  // opens containing the person's own reasoning rather than an empty canvas.
  const graph: BoardGraph =
    board.data ??
    seedGraph(board.title, board.exchanges, board.verbs, board.frame)

  const onSave = useCallback(
    async (next: BoardGraph) => {
      await saveBoard({
        data: { problemId, nodes: next.nodes, edges: next.edges },
      })
    },
    [problemId],
  )

  // React Flow measures the DOM, so it renders after mount rather than during
  // SSR. The heading and controls are server-rendered either way.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="label-technical">Tableau</p>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-balance">
            {board.title}
          </h1>
          <p className="text-muted-foreground max-w-[52ch] text-sm">
            Ton raisonnement est déjà là. Déplace-le, relie-le, ajoute tes notes
            et les actions à mener. Tout est enregistré au fil de l’eau.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/mon-compte">Retour</Link>
        </Button>
      </div>

      {mounted ? (
        <BoardCanvas graph={graph} onSave={onSave} />
      ) : (
        <div className="border-border bg-muted/20 text-muted-foreground flex h-[70vh] items-center justify-center rounded-md border text-sm">
          Chargement du tableau…
        </div>
      )}
    </div>
  )
}
