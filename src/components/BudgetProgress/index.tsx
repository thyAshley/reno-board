import { useMemo, useState } from 'react'
import { BAND_COLOUR, BAND_LABEL, BAND_ORDER, type Band } from '../../data/taxonomy'
import { formatSGD0, type Cents } from '../../lib/money'
import { budgetBar, type BandTotals } from '../../lib/totals'

/* The budget as one bar, split into the three bands of commitment.
 *
 * A bar rather than a pair of figures because the question is proportional: not
 * "what is the outturn" but "how much of the budget has gone, and how firm is
 * it". Deep wood is money out of the bank, brass is agreed with the contractor,
 * tan is still a shopping guess, and the pale track is what is left.
 *
 * The legend doubles as the control. Clicking a band drops it from the bar,
 * which is how you ask a narrower question — "where would I be if I only paid
 * what is already contracted, and bought none of the appliances?" — without
 * doing the subtraction yourself. Any subset is valid, including none.
 *
 * The bar itself is aria-hidden. Every figure it encodes is printed as text in
 * the legend buttons and the caption below it, so a screen reader gets the
 * numbers rather than a description of a picture — the same split SpendChart
 * makes between its bars and its labels.
 */
export default function BudgetProgress({
  totals,
  budget,
}: {
  totals: BandTotals
  // Explicitly `| undefined`: exactOptionalPropertyTypes separates "absent"
  // from "present and undefined", and this is always passed, sometimes empty.
  budget: Cents | undefined
}) {
  const [shown, setShown] = useState<readonly Band[]>(BAND_ORDER)

  const bar = useMemo(() => budgetBar(totals, shown, budget), [totals, shown, budget])
  const hidden = BAND_ORDER.filter((band) => !shown.includes(band))

  /* Toggling rebuilds from BAND_ORDER rather than pushing onto the end, so the
   * legend and the bar stay in commitment order however they are clicked. */
  const toggle = (band: Band) =>
    setShown((current) =>
      current.includes(band)
        ? current.filter((other) => other !== band)
        : BAND_ORDER.filter((other) => current.includes(other) || other === band),
    )

  return (
    <section className="rounded-lg border border-cream-300 bg-cream-100 px-4 py-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="font-mono text-[11px] tracking-wider text-walnut-600 uppercase">
          Total budget
        </h2>
        <p className="figure text-lg text-walnut-900">
          {bar.budget === undefined ? (
            <span className="text-walnut-400">—</span>
          ) : (
            <>
              <span className="text-walnut-400">S$</span>
              {formatSGD0(bar.budget)}
            </>
          )}
        </p>
      </div>

      {/* The track is `relative` so the budget line can be placed along it. */}
      <div
        aria-hidden="true"
        className="relative mt-3 h-5 w-full overflow-hidden rounded-full bg-cream-300"
      >
        <div className="flex h-full">
          {bar.slices.map((slice) => (
            <div
              key={slice.band}
              className="h-full"
              style={{
                /* A floor of 0.5%, so a band that is real but tiny — the $2,071
                 * paid against an $80,000 budget is 2.6% — still shows as a
                 * sliver instead of rounding away to an invisible edge. */
                width: `${slice.amount > 0 ? Math.max(slice.share * 100, 0.5) : 0}%`,
                backgroundColor: BAND_COLOUR[slice.band],
              }}
            />
          ))}
        </div>

        {bar.mark !== undefined && (
          /* Only drawn when the bands overrun: the bar is then scaled to the
           * outturn, so the budget is a line partway along it rather than its
           * end. Rust, which is why no band uses rust. */
          <div
            className="absolute inset-y-0 w-0.5 bg-ember-600"
            style={{ left: `${bar.mark * 100}%` }}
          />
        )}
      </div>

      <p className="mt-2 text-xs text-walnut-600">
        <span className="figure text-walnut-900">S${formatSGD0(bar.shown)}</span>
        {bar.budget !== undefined && <> of S${formatSGD0(bar.budget)}</>}{' '}
        {hidden.length === 0 ? 'planned' : 'shown'}
        {bar.left === undefined ? (
          <> · no Total Budget cell on the sheet</>
        ) : bar.over ? (
          <>
            {' · '}
            <span className="figure text-ember-600">S${formatSGD0(-bar.left)}</span> over budget
          </>
        ) : (
          <>
            {' · '}
            <span className="figure text-sage-600">S${formatSGD0(bar.left)}</span> left
          </>
        )}
        {hidden.length > 0 && (
          <> · {hidden.map((band) => BAND_LABEL[band].toLowerCase()).join(' and ')} hidden</>
        )}
      </p>

      <div role="group" aria-label="Bands drawn on the budget bar" className="mt-3 flex flex-wrap gap-2">
        {BAND_ORDER.map((band) => {
          const on = shown.includes(band)
          const slice = bar.slices.find((entry) => entry.band === band)

          return (
            <button
              key={band}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(band)}
              className={[
                'flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs transition-colors',
                /* A dropped band is signalled by the dashed border and the
                 * hollow dot, not by fading the text: it still states a real
                 * figure, and walnut-400 on this card is 2.8:1. */
                on
                  ? 'border-cream-300 bg-cream-50 text-walnut-700'
                  : 'border-dashed border-walnut-500 bg-transparent text-walnut-600',
              ].join(' ')}
            >
              <span
                aria-hidden="true"
                className="inline-block size-2.5 rounded-full"
                style={{
                  backgroundColor: on ? BAND_COLOUR[band] : 'transparent',
                  boxShadow: on ? undefined : `inset 0 0 0 1px ${BAND_COLOUR[band]}`,
                }}
              />
              {BAND_LABEL[band]}
              <span className={on ? 'text-walnut-900' : 'text-walnut-600'}>
                S${formatSGD0(totals[band])}
              </span>
              {/* Only meaningful while the band is drawn: a hidden band has no
                * width, and its old share would be a share of a bar that has
                * since changed length. */}
              {slice !== undefined && (
                <span className="text-walnut-600">{Math.round(slice.share * 100)}%</span>
              )}
            </button>
          )
        })}
      </div>

      <p className="mt-2 text-xs text-walnut-600">
        Click a band to take it off the bar and give its money back as headroom.
      </p>
    </section>
  )
}
