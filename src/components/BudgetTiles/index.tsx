import { formatSGD0 } from '../../lib/money'
import type { Summary } from '../../lib/totals'

/* The four headline figures. Every one is computed from the item rows in
 * lib/totals.ts, never read from the sheet's own summary cells.
 */
interface TileProps {
  label: string
  value: string
  note: string
  lead?: boolean
  tone?: 'neutral' | 'good' | 'warn'
}

function Tile({ label, value, note, lead = false, tone = 'neutral' }: TileProps) {
  const valueTone =
    tone === 'good' ? 'text-sage-600' : tone === 'warn' ? 'text-ember-600' : 'text-walnut-900'

  return (
    <div
      className={[
        'rounded-lg border px-4 py-4',
        lead ? 'border-walnut-700 bg-walnut-900' : 'border-cream-300 bg-cream-100',
      ].join(' ')}
    >
      <p
        className={[
          'font-mono text-[11px] tracking-wider uppercase',
          lead ? 'text-oak-500' : 'text-walnut-600',
        ].join(' ')}
      >
        {label}
      </p>
      <p
        className={[
          'figure mt-2 text-3xl',
          lead ? 'text-cream-50' : valueTone,
        ].join(' ')}
      >
        <span className={lead ? 'text-oak-500' : 'text-walnut-400'}>S$</span>
        {value}
      </p>
      <p className={['mt-1 text-xs', lead ? 'text-cream-300' : 'text-walnut-600'].join(' ')}>
        {note}
      </p>
    </div>
  )
}

export default function BudgetTiles({ summary }: { summary: Summary }) {
  const { budget, actual, projected, estimate, headroom, itemCount, pricedCount, settledCount } =
    summary

  const overBudget = headroom !== undefined && headroom < 0

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Tile
        lead
        label="Committed so far"
        value={formatSGD0(actual)}
        note={`${settledCount} of ${itemCount} items ordered or done`}
      />
      <Tile
        label="Projected outturn"
        value={formatSGD0(projected)}
        note={`committed, plus S$${formatSGD0(estimate)} still estimated`}
      />
      {budget === undefined ? (
        <Tile label="Total budget" value="—" note="no Total Budget cell found in the sheet" />
      ) : (
        <Tile label="Total budget" value={formatSGD0(budget)} note="as set in the sheet" />
      )}
      {headroom === undefined ? (
        <Tile label="Headroom" value="—" note="needs a budget to compare against" />
      ) : (
        <Tile
          label={overBudget ? 'Over budget by' : 'Headroom'}
          value={formatSGD0(Math.abs(headroom))}
          note={
            overBudget
              ? 'the projected outturn exceeds the budget'
              : `budget less projected — ${pricedCount} of ${itemCount} items priced`
          }
          tone={overBudget ? 'warn' : 'good'}
        />
      )}
    </div>
  )
}
