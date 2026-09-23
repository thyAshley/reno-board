import { BAND_COLOUR, BAND_LABEL, BAND_ORDER, type Band } from '../../data/taxonomy'
import { formatSGD0 } from '../../lib/money'
import type { BandTotals, Summary } from '../../lib/totals'

/* The three headline figures, one per band of commitment: what has been paid,
 * what is agreed but not yet invoiced, and what is still a shopping estimate.
 *
 * They are the bar above them written out in full, which is why they are the
 * three bands rather than a free choice of figures — the same numbers, once as
 * proportions and once exactly. Together they come to the projected outturn, so
 * the budget and the headroom are the bar's job, not a fourth and fifth tile.
 *
 * Every figure is computed from the item rows in lib/totals.ts, never read from
 * the sheet's own summary cells.
 */
const NOTE: Record<Band, string> = {
  paid: 'invoiced and settled so far',
  contracted: 'agreed with the contractor, not yet invoiced',
  estimated: 'still being shopped for',
}

export default function BudgetTiles({
  bands,
  summary,
}: {
  bands: BandTotals
  summary: Summary
}) {
  const { itemCount, pricedCount, settledCount } = summary

  /* A row count where one clarifies the figure above it. Contracted has none:
   * the instalments it is made of are lines on a quotation, not items, and
   * counting them would invite the reader to divide. */
  const count: Partial<Record<Band, string>> = {
    paid: `${settledCount} of ${itemCount} items ordered or done`,
    estimated: `${pricedCount} of ${itemCount} items priced`,
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {BAND_ORDER.map((band) => (
        <Tile
          key={band}
          band={band}
          value={formatSGD0(bands[band])}
          note={[NOTE[band], count[band]].filter(Boolean).join(' · ')}
          // Paid leads: it is the only one of the three that has actually left
          // the bank, and it anchors the wood ramp the bar reads left to right.
          lead={band === 'paid'}
        />
      ))}
    </div>
  )
}

function Tile({
  band,
  value,
  note,
  lead = false,
}: {
  band: Band
  value: string
  note: string
  lead?: boolean
}) {
  return (
    <div
      className={[
        'rounded-lg border px-4 py-4',
        lead ? 'border-walnut-700 bg-walnut-900' : 'border-cream-300 bg-cream-100',
      ].join(' ')}
    >
      <p
        className={[
          'flex items-center gap-2 font-mono text-[11px] tracking-wider uppercase',
          lead ? 'text-oak-400' : 'text-walnut-600',
        ].join(' ')}
      >
        {/* The same dot as the bar's legend, so a tile and a band of the bar are
          * visibly the same figure without either having to say so.
          *
          * The lead tile carries no dot: it is painted in walnut-900, which is
          * the paid band's own colour, so a dot on it would be invisible. The
          * tile is its own swatch. */}
        {!lead && (
          <span
            aria-hidden="true"
            className="inline-block size-2.5 rounded-full"
            style={{ backgroundColor: BAND_COLOUR[band] }}
          />
        )}
        {BAND_LABEL[band]}
      </p>
      <p className={['figure mt-2 text-3xl', lead ? 'text-cream-50' : 'text-walnut-900'].join(' ')}>
        <span className={lead ? 'text-oak-400' : 'text-walnut-400'}>S$</span>
        {value}
      </p>
      <p className={['mt-1 text-xs', lead ? 'text-cream-300' : 'text-walnut-600'].join(' ')}>
        {note}
      </p>
    </div>
  )
}
