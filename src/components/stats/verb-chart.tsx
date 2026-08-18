import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { VerbCount } from '#/lib/problems'

/**
 * Single hue, not a colour per verb.
 *
 * Every bar measures the same thing, so this is one series: colour carries no
 * information here and a rainbow would imply a distinction that does not
 * exist. Length is the encoding.
 *
 * It reuses the app's signal, which is spent on the payoff everywhere else and
 * is exactly what these bars count. Both its light and dark values were
 * validated against their own surface for lightness band, chroma floor and
 * contrast.
 */
const SERIES = 'var(--signal)'
const ROW_HEIGHT = 34

export function VerbChart({ verbs }: { verbs: Array<VerbCount> }) {
  // Recharts measures the DOM, so it renders after mount.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (verbs.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Tes verbes d’action apparaîtront ici après ta première réflexion.
      </p>
    )
  }

  const height = verbs.length * ROW_HEIGHT + 16
  const max = Math.max(...verbs.map((v) => v.count))

  return (
    <div className="flex flex-col gap-4">
      <div style={{ height }} aria-hidden={!mounted}>
        {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={verbs}
              layout="vertical"
              margin={{ top: 0, right: 28, bottom: 0, left: 0 }}
              barCategoryGap={2}
            >
              {/* Values are direct-labelled, so the value axis is noise. */}
              <XAxis type="number" domain={[0, max]} hide />
              <YAxis
                type="category"
                dataKey="label"
                width={120}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 13 }}
              />
              <Tooltip
                cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                contentStyle={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  fontSize: 13,
                  color: 'var(--card-foreground)',
                }}
                formatter={(value) => [`${String(value)} fois`, 'Apparu']}
              />
              <Bar
                dataKey="count"
                radius={[0, 4, 4, 0]}
                isAnimationActive={false}
              >
                {verbs.map((v) => (
                  <Cell key={v.label} fill={SERIES} />
                ))}
                {/* Text wears text tokens, never the series colour. */}
                <LabelList
                  dataKey="count"
                  position="right"
                  offset={8}
                  style={{
                    fill: 'var(--muted-foreground)',
                    fontSize: 12,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : null}
      </div>

      {/* Identity is never colour-alone, and the numbers stay reachable. */}
      <details className="text-sm">
        <summary className="text-muted-foreground cursor-pointer">
          Voir les données
        </summary>
        <table className="mt-3 w-full text-left">
          <caption className="sr-only">
            Fréquence de chaque verbe d’action
          </caption>
          <thead>
            <tr className="text-muted-foreground text-xs">
              <th scope="col" className="py-1 font-medium">
                Verbe
              </th>
              <th scope="col" className="py-1 text-right font-medium">
                Occurrences
              </th>
            </tr>
          </thead>
          <tbody>
            {verbs.map((v) => (
              <tr key={v.label} className="border-border/60 border-t">
                <td className="py-1">{v.label}</td>
                <td className="py-1 text-right tabular-nums">{v.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
