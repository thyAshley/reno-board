import { useMemo, useState } from 'react'
import Chips, { type ChipOption } from '../Chips'
import { PRIORITY_COLOUR, ROOM_ORDER, STATUS_ORDER, type Room, type Status } from '../../data/taxonomy'
import { INITIAL_SORT, nextSortState, sortItems, type SortKey, type SortState } from '../../lib/items'
import { formatSGD } from '../../lib/money'
import type { Item } from '../../lib/sheet'
import { total } from '../../lib/totals'
import { linkify } from '../../lib/text'

/* Every row of the sheet, filterable and sortable.
 *
 * Sortable headers are real buttons inside the <th> carrying aria-sort, so
 * keyboard and screen-reader users get the same control as a mouse, without
 * hand-rolled Enter and Space handling.
 */
type RoomFilter = Room | 'all'
type StatusFilter = Status | 'all'

const COLUMNS: readonly { key: SortKey | null; label: string; align?: 'right'; hide?: string }[] = [
  { key: 'name', label: 'Item' },
  { key: 'room', label: 'Room' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'vendor', label: 'Retailer' },
  { key: null, label: 'Dimensions', hide: 'hidden lg:table-cell' },
  { key: null, label: 'Warranty', hide: 'hidden lg:table-cell' },
  { key: 'estimate', label: 'Estimated', align: 'right' },
  { key: 'actual', label: 'Actual', align: 'right' },
  { key: null, label: 'Notes', hide: 'hidden xl:table-cell' },
]

export default function ItemRegister({ items }: { items: readonly Item[] }) {
  const [room, setRoom] = useState<RoomFilter>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortState>(INITIAL_SORT)

  const roomOptions: ChipOption<RoomFilter>[] = [
    { value: 'all', label: 'All rooms', count: items.length },
    ...ROOM_ORDER.filter((r) => items.some((item) => item.room === r)).map((r) => ({
      value: r as RoomFilter,
      label: r,
      count: items.filter((item) => item.room === r).length,
    })),
  ]

  const statusOptions: ChipOption<StatusFilter>[] = [
    { value: 'all', label: 'Any status' },
    ...STATUS_ORDER.map((s) => ({
      value: s as StatusFilter,
      label: s,
      count: items.filter((item) => item.status === s).length,
    })),
  ]

  const visible = useMemo(() => {
    const filtered = items.filter(
      (item) => (room === 'all' || item.room === room) && (status === 'all' || item.status === status),
    )
    return sortItems(filtered, sort)
  }, [items, room, status, sort])

  /* Totals follow the filter, not the whole dataset — a total that ignored the
   * filter would contradict the rows above it. */
  const estimateSum = total(visible, 'estimate')
  const actualSum = total(visible, 'actual')

  const ariaSort = (key: SortKey | null): 'ascending' | 'descending' | 'none' | undefined => {
    if (key === null) return undefined
    if (sort.key !== key) return 'none'
    return sort.dir === 1 ? 'ascending' : 'descending'
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        <Chips label="Filter by room" options={roomOptions} value={room} onChange={setRoom} />
        <Chips label="Filter by status" options={statusOptions} value={status} onChange={setStatus} />
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-sm">
          <caption className="sr-only">
            {visible.length} of {items.length} items
            {room === 'all' ? '' : `, in ${room}`}
            {status === 'all' ? '' : `, ${status}`}
          </caption>
          <thead>
            <tr className="border-b border-walnut-700">
              {COLUMNS.map((column) => (
                <th
                  key={column.label}
                  scope="col"
                  aria-sort={ariaSort(column.key)}
                  className={[
                    'py-2 font-mono text-[11px] tracking-wider uppercase',
                    column.align === 'right' ? 'text-right' : 'text-left',
                    column.hide ?? '',
                  ].join(' ')}
                >
                  {column.key === null ? (
                    <span className="text-walnut-600">{column.label}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSort((current) => nextSortState(current, column.key as SortKey))}
                      className="text-walnut-700 underline decoration-cream-300 underline-offset-4 hover:decoration-ember-500"
                    >
                      {column.label}
                      <span aria-hidden="true" className="ml-1 text-walnut-400">
                        {sort.key === column.key ? (sort.dir === 1 ? '↑' : '↓') : '↕'}
                      </span>
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visible.map((item) => (
              <tr key={item.id} className="border-b border-cream-200 align-top">
                <th scope="row" className="py-2 pr-3 text-left font-normal">
                  <span className="text-walnut-900">{item.name}</span>
                  {(item.brand ?? item.model) !== undefined && (
                    <span className="block text-xs text-walnut-600">
                      {[item.brand, item.model].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </th>
                <td className="py-2 pr-3 text-walnut-700">{item.room}</td>
                <td className="py-2 pr-3">
                  <span
                    className="inline-block rounded-full px-2 py-0.5 font-mono text-[11px] text-cream-50"
                    style={{ backgroundColor: PRIORITY_COLOUR[item.priority] }}
                  >
                    {item.priority}
                  </span>
                </td>
                <td className="py-2 pr-3 font-mono text-xs text-walnut-700">{item.status}</td>
                <td className="py-2 pr-3 text-walnut-700">{item.vendor ?? <Blank />}</td>
                <td className="hidden py-2 pr-3 font-mono text-xs text-walnut-600 lg:table-cell">
                  {item.dimensions ?? <Blank />}
                </td>
                <td className="hidden py-2 pr-3 font-mono text-xs text-walnut-600 lg:table-cell">
                  {item.warranty ?? <Blank />}
                </td>
                <td className="figure py-2 pr-3 text-right whitespace-nowrap text-walnut-700">
                  {item.estimate === undefined ? <Blank /> : formatSGD(item.estimate)}
                </td>
                <td className="figure py-2 pr-3 text-right whitespace-nowrap text-walnut-900">
                  {item.actual === undefined ? <Blank /> : formatSGD(item.actual)}
                </td>
                <td className="hidden max-w-xs py-2 text-xs text-walnut-600 xl:table-cell">
                  {item.notes === undefined ? <Blank /> : <Notes text={item.notes} />}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="border-t-2 border-walnut-700">
              <th scope="row" className="py-2 pr-3 text-left font-mono text-[11px] tracking-wider uppercase">
                {visible.length === items.length
                  ? `All ${items.length} items`
                  : `${visible.length} of ${items.length} items`}
              </th>
              <td colSpan={4} />
              <td className="hidden lg:table-cell" />
              <td className="hidden lg:table-cell" />
              <td className="figure py-2 pr-3 text-right whitespace-nowrap text-walnut-700">
                {estimateSum === 0 ? <Blank /> : formatSGD(estimateSum)}
              </td>
              <td className="figure py-2 pr-3 text-right whitespace-nowrap text-walnut-900">
                {actualSum === 0 ? <Blank /> : formatSGD(actualSum)}
              </td>
              <td className="hidden xl:table-cell" />
            </tr>
          </tfoot>
        </table>
      </div>
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
