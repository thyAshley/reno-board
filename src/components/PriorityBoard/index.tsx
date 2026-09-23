import { useMemo, useState } from 'react'
import Chips, { type ChipOption } from '../Chips'
import { PRIORITY_COLOUR, ROOM_COLOUR, type Room } from '../../data/taxonomy'
import type { Cents } from '../../lib/money'
import { formatSGD, formatSGD0 } from '../../lib/money'
import type { Item } from '../../lib/sheet'
import { byPriorityLevel, byRoomGroup, outlook, type LevelTotal } from '../../lib/totals'
import { linkify } from '../../lib/text'

/* What to buy next: everything still outstanding, grouped by room and filterable
 * to one room at a time.
 *
 * Room is the grouping because that is how the shopping actually happens — you
 * fit out a kitchen, not a priority level. Priority still rides along as a badge
 * on every row and as the breakdown under the headline figures, so urgency is
 * visible without being the organising principle.
 *
 * Three figures, in the order the question is asked: what all of this will cost,
 * what is already committed, and what the budget looks like once it is bought.
 * They cover every level including Low, and — like the register's — they follow
 * the filter. A figure that ignored the chips would contradict the rows under it.
 *
 * `outlook` still needs every item, not only the visible ones: the budget it
 * reports has to net off money committed on rows that are filtered out, or
 * narrowing to one room would appear to give the budget back.
 */
type RoomFilter = Room | 'all'

export default function PriorityBoard({
  all,
  rows,
  budget,
}: {
  /** Every row on the sheet — for the budget read, not for display. */
  all: readonly Item[]
  /** The rows still to buy, already in the order they should appear. */
  rows: readonly Item[]
  // Explicitly `| undefined`: exactOptionalPropertyTypes separates "absent"
  // from "present and undefined", and this is always passed, sometimes empty.
  budget: Cents | undefined
}) {
  const [room, setRoom] = useState<RoomFilter>('all')

  /* Grouped once over everything, then narrowed by picking groups rather than
   * regrouping — so each room's totals are identical whether it is shown beside
   * the others or on its own. */
  const allGroups = useMemo(() => byRoomGroup(rows), [rows])
  const groups = useMemo(
    () => (room === 'all' ? allGroups : allGroups.filter((group) => group.room === room)),
    [allGroups, room],
  )
  const visible = useMemo(() => groups.flatMap((group) => group.rows), [groups])

  const money = outlook(all, visible, budget)
  const levels = byPriorityLevel(visible).filter((level) => level.count > 0)
  const overspent = money.after !== undefined && money.after < 0

  const roomOptions: ChipOption<RoomFilter>[] = [
    { value: 'all', label: 'All rooms', count: rows.length },
    ...allGroups.map((group) => ({
      value: group.room as RoomFilter,
      label: group.room,
      count: group.rows.length,
    })),
  ]

  return (
    <div>
      {allGroups.length === 0 ? (
        <p className="rounded-md border border-dashed border-cream-300 bg-cream-100 px-4 py-6 text-sm text-walnut-600">
          Nothing left to buy — every row on the sheet is marked{' '}
          <strong className="font-medium">Completed</strong>.
        </p>
      ) : (
        <>
          <Chips label="Filter by room" options={roomOptions} value={room} onChange={setRoom} />

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Figure
              lead
              label="Still to buy"
              value={formatSGD0(money.outstanding)}
              note={
                room === 'all'
                  ? `across ${money.count} ${money.count === 1 ? 'item' : 'items'} still to buy`
                  : `across ${money.count} ${money.count === 1 ? 'item' : 'items'} in the ${room}`
              }
            />
            <Figure
              label="Already committed"
              value={formatSGD0(money.actual)}
              note="on these rows, quoted or paid"
            />
            {money.after === undefined ? (
              <Figure
                label="Budget after these"
                value="—"
                note="needs a Total Budget cell on the sheet"
              />
            ) : (
              <Figure
                label={overspent ? 'Over budget after these' : 'Budget after these'}
                value={formatSGD0(Math.abs(money.after))}
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
            {levels.map((level) => (
              <LevelFigure key={level.priority} level={level} />
            ))}
          </div>

          {groups.map((group) => (
            <section key={group.room} className="mt-8 border-t border-cream-300 pt-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h3 className="flex items-center gap-2 font-display text-xl text-walnut-900">
                  <span
                    aria-hidden="true"
                    className="inline-block size-2.5 rounded-full"
                    style={{ backgroundColor: ROOM_COLOUR[group.room] }}
                  />
                  {group.room}
                </h3>
                <p className="figure text-sm text-walnut-900">
                  <span className="text-walnut-400">S$</span>
                  {formatSGD0(group.outstanding)}
                  <span className="ml-1.5 font-sans text-xs text-walnut-600">
                    still to buy · {group.rows.length}{' '}
                    {group.rows.length === 1 ? 'item' : 'items'}
                    {group.actual > 0 && `, S$${formatSGD0(group.actual)} committed`}
                  </span>
                </p>
              </div>

              <RowTable
                rows={group.rows}
                caption={`${group.rows.length} items to buy in the ${group.room}, most urgent first`}
              />
            </section>
          ))}
        </>
      )}
    </div>
  )
}

/** One priority level as a labelled money figure: coloured dot, level, amount
 *  outstanding, count. Urgency lives here and in each row's badge, now that room
 *  rather than priority does the grouping. */
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

/** One room's rows. No Room column: the group's own heading already says it, and
 *  repeating it down every row is the sort of noise grouping exists to remove. */
function RowTable({ rows, caption }: { rows: readonly Item[]; caption: string }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[34rem] border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-cream-300">
            <Th>Item</Th>
            <Th>Priority</Th>
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
              <td className="py-2 pr-3">
                <span
                  className="inline-block rounded-full px-2 py-0.5 font-mono text-[11px] text-cream-50"
                  style={{ backgroundColor: PRIORITY_COLOUR[row.priority] }}
                >
                  {row.priority}
                </span>
              </td>
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
          lead ? 'text-oak-400' : 'text-walnut-600',
        ].join(' ')}
      >
        {label}
      </p>
      <p className={['figure mt-2 text-3xl', lead ? 'text-cream-50' : valueTone].join(' ')}>
        <span className={lead ? 'text-oak-400' : 'text-walnut-400'}>S$</span>
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
