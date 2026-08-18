import type { Mode } from './types.ts'

const OPTIONS: Array<{
  value: Mode
  index: string
  title: string
  description: string
}> = [
  {
    value: 'assist',
    index: 'A',
    title: 'Assisté',
    description: 'Une question à la fois. J’attends ta réponse.',
  },
  {
    value: 'auto',
    index: 'B',
    title: 'Auto',
    description: 'Je déroule les cinq pourquoi seul.',
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
      <legend className="label-technical mb-2">Méthode</legend>
      <div className="border-rule-strong grid border sm:grid-cols-2">
        {OPTIONS.map((option, i) => {
          const selected = mode === option.value
          return (
            <label
              key={option.value}
              className={`group relative flex cursor-pointer gap-3 p-4 transition-colors ${
                i === 0 ? 'sm:border-rule-strong sm:border-r' : ''
              } ${selected ? 'bg-signal-wash' : 'hover:bg-muted/60'}`}
            >
              <input
                type="radio"
                name="mode"
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span
                className={`mt-0.5 font-mono text-[11px] leading-none ${
                  selected ? 'text-signal' : 'text-muted-foreground'
                }`}
                aria-hidden
              >
                {option.index}
              </span>
              <span className="flex flex-col gap-1">
                <span
                  className={`text-sm font-semibold ${selected ? 'text-signal' : ''}`}
                >
                  {option.title}
                </span>
                <span className="text-muted-foreground text-xs leading-snug">
                  {option.description}
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
