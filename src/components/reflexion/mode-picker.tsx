import type { Mode } from './types.ts'

const OPTIONS: Array<{ value: Mode; title: string; description: string }> = [
  {
    value: 'assist',
    title: 'Assisté',
    description:
      'Je pose une question à la fois et j’attends ta réponse. Plus long, plus juste.',
  },
  {
    value: 'auto',
    title: 'Auto',
    description:
      'Je déroule les cinq pourquoi tout seul, à toi de réagir au résultat.',
  },
]

export function ModePicker({
  mode,
  onChange,
}: {
  mode: Mode
  onChange: (mode: Mode) => void
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-sm font-medium">Comment on procède ?</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const selected = mode === option.value
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer flex-col gap-1 rounded-md border p-4 transition-colors ${
                selected
                  ? 'border-foreground bg-accent/40'
                  : 'border-border hover:bg-accent/20'
              }`}
            >
              <input
                type="radio"
                name="mode"
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span className="font-medium">{option.title}</span>
              <span className="text-muted-foreground text-sm">
                {option.description}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
