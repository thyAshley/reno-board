import { PRIORITY_COLOUR } from '../../data/taxonomy'
import { formatSGD, formatSGD0 } from '../../lib/money'
import type { Item } from '../../lib/sheet'
import type { LevelTotal, Outlook } from '../../lib/totals'
import { linkify } from '../../lib/text'

/* What to buy next: the High and Medium rows pulled out of the forty-odd in the
 * register so the live decisions are readable on their own — and, the actual
 * reason this exists, so the money attached to them can be read without mental
 * arithmetic.
 *
 * Three figures, in the order the question is asked: what these will cost, what
 * is already committed, and what the budget looks like once they are bought. The
 * first is split by level underneath, because "how much for just the urgent half"
 * is the next question after "how much for all of it".
 *
 * Low sits below, past a rule, deliberately outside every figure above it. It is
 * there for the overview — what else is on the list at all — and counting the
 * someday pile into "budget after these" would make the headline figure answer a
 * question nobody asked. Its own total is stated in its own heading instead.
 *
 * Takes its figures pre-computed. Components here hold no arithmetic; `outlook`
 * and `byPriorityLevel` in lib/totals.ts do that, where they can be read without
 * JSX around them.
 */
export default function PriorityBoard({
  rows,
  outlook,
  levels,
  lowRows,
  low,
}: {
  rows: readonly Item[]
  outlook: Outlook
  levels: readonly LevelTotal[]
  lowRows: readonly Item[]
  low: LevelTotal
}) {
  const overspent = outlook.after !== undefined && outlook.after < 0

  return (
    <div>
      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed border-cream-300 bg-cream-100 px-4 py-6 text-sm text-walnut-600">
          Nothing marked <strong className="font-medium">High</strong> or{' '}
          <strong className="font-medium">Medium</strong> on the sheet right now. Set a row's
          Priority to either and it appears here — items become{' '}
          <strong className="font-medium">Completed</strong> once bought, which takes them off this
          list.
        </p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Figure
              lead
              label="Still to buy"
              value={formatSGD0(outlook.outstanding)}
              note={`across ${outlook.count} ${outlook.count === 1 ? 'item' : 'items'} still to buy`}
            />
            <Figure
              label="Already committed"
              value={formatSGD0(outlook.actual)}
              note="on these rows, quoted or paid"
            />
            {outlook.after === undefined ? (
              <Figure
                label="Budget after these"
                value="—"
                note="needs a Total Budget cell on the sheet"
              />
            ) : (
              <Figure
                label={overspent ? 'Over budget after these' : 'Budget after these'}
                value={formatSGD0(Math.abs(outlook.after))}
                note={
                  overspent
                    ? 'buying all of these would exceed the budget'
                    : 'what is left having bought only these'
                }
                tone={overspent ? 'warn' : 'good'}
              />
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
            {levels
              .filter((level) => level.count > 0)
              .map((level) => (
                <LevelFigure key={level.priority} level={level} />
              ))}
          </div>

          <RowTable
            rows={rows}
            showPriority
            caption={`${rows.length} items to buy next, high priority first and dearest first within each level`}
          />
        </>
      )}

      <section className="mt-10 border-t border-cream-300 pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
          <h3 className="font-display text-xl text-walnut-900">Low priority</h3>
          {low.count > 0 && <LevelFigure level={low} />}
        </div>
        <p className="mt-1 max-w-2xl text-sm text-walnut-600">
          Here for the overview, and left out of the figures above — nothing on this list is a
          decision yet.
        </p>

        {low.count === 0 ? (
          <p className="mt-4 rounded-md border border-dashed border-cream-300 bg-cream-100 px-4 py-6 text-sm text-walnut-600">
            Nothing marked <strong className="font-medium">Low</strong> on the sheet.
          </p>
        ) : (
          <RowTable rows={lowRows} caption={`${lowRows.length} low-priority items, dearest first`} />
        )}
      </section>
    </div>
  )
}

/** One priority level as a labelled money figure: coloured dot, level, amount
 *  outstanding, count. Used both for the High/Medium split and for Low's own
 *  heading, so the two read identically. */
function LevelFigure({ level }: { level: LevelTotal }) {
  return (
    // Its own <dl>, so it stays valid wherever it is dropped — dt/dd cannot sit
    // loose in a div, and this appears both in a row of levels and in a heading.
    <dl className="flex items-baseline gap-2">
      <dt className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-walnut-600 uppercase">
        <span
          aria-hidden="true"
          className="inline-block size-2 rounded-full"
          style={{ backgroundColor: PRIORITY_COLOUR[level.priority] }}
        />
        {level.priority}
      </dt>
      <dd className="figure text-sm text-walnut-900">
        <span className="text-walnut-400">S$</span>
        {formatSGD0(level.outstanding)}
        <span className="ml-1.5 text-xs text-walnut-600">
          · {level.count} {level.count === 1 ? 'item' : 'items'}
        </span>
      </dd>
    </dl>
  )
}

/** The row table, shared by the buy-next list and the low-priority list below.
 *  `showPriority` is off for Low, where every row would carry the same badge. */
function RowTable({
  rows,
  caption,
  showPriority = false,
}: {
  rows: readonly Item[]
  caption: string
  showPriority?: boolean
}) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className={['w-full border-collapse text-sm', showPriority ? 'min-w-[38rem]' : 'min-w-[34rem]'].join(' ')}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-walnut-700">
            <Th>Item</Th>
            {showPriority && <Th>Priority</Th>}
            <Th>Room</Th>
            <Th>Status</Th>
            <Th>Retailer</Th>
            <Th align="right">Estimated</Th>
            <Th align="right">Committed</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-cream-200 align-top">
              <th scope="row" className="py-2 pr-3 text-left font-normal">
                <span className="text-walnut-900">{row.name}</span>
                {(row.brand ?? row.model) !== undefined && (
                  <span className="block text-xs text-walnut-600">
                    {[row.brand, row.model].filter(Boolean).join(' · ')}
                  </span>
                )}
                {row.notes !== undefined && (
                  <span className="mt-0.5 block max-w-md text-xs text-walnut-600">
                    <Notes text={row.notes} />
                  </span>
                )}
              </th>
              {showPriority && (
                <td className="py-2 pr-3">
                  <span
                    className="inline-block rounded-full px-2 py-0.5 font-mono text-[11px] text-cream-50"
                    style={{ backgroundColor: PRIORITY_COLOUR[row.priority] }}
                  >
                    {row.priority}
                  </span>
                </td>
              )}
              <td className="py-2 pr-3 text-walnut-700">{row.room}</td>
              <td className="py-2 pr-3 font-mono text-xs text-walnut-700">{row.status}</td>
              <td className="py-2 pr-3 text-walnut-700">{row.vendor ?? <Blank />}</td>
              <td className="figure py-2 pr-3 text-right whitespace-nowrap text-walnut-700">
                {row.estimate === undefined ? <Blank /> : formatSGD(row.estimate)}
              </td>
              <td className="figure py-2 text-right whitespace-nowrap text-walnut-900">
                {row.actual === undefined ? <Blank /> : formatSGD(row.actual)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children, align }: { children: string; align?: 'right' }) {
  return (
    <th
      scope="col"
      className={[
        'py-2 pr-3 font-mono text-[11px] tracking-wider text-walnut-600 uppercase',
        align === 'right' ? 'text-right' : 'text-left',
      ].join(' ')}
    >
      {children}
    </th>
  )
}

function Figure({
  label,
  value,
  note,
  lead = false,
  tone = 'neutral',
}: {
  label: string
  value: string
  note: string
  lead?: boolean
  tone?: 'neutral' | 'good' | 'warn'
}) {
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
      <p className={['figure mt-2 text-3xl', lead ? 'text-cream-50' : valueTone].join(' ')}>
        <span className={lead ? 'text-oak-500' : 'text-walnut-400'}>S$</span>
        {value}
      </p>
      <p className={['mt-1 text-xs', lead ? 'text-cream-300' : 'text-walnut-600'].join(' ')}>
        {note}
      </p>
    </div>
  )
}

/** Nothing recorded yet — an em dash, not a zero. */
function Blank() {
  return <span className="text-walnut-400">—</span>
}

function Notes({ text }: { text: string }) {
  return (
    <>
      {linkify(text).map((segment, index) =>
        segment.href === undefined ? (
          <span key={index}>{segment.text}</span>
        ) : (
          <a
            key={index}
            href={segment.href}
            target="_blank"
            rel="noreferrer noopener"
            className="text-ember-600 underline"
          >
            {segment.text}
          </a>
        ),
      )}
    </>
  )
}
