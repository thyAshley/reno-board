/* Slicing the items by one dimension, for the bar charts.
 *
 * Rows come back in the dimension's declared order, including zero rows, so a
 * room with nothing against it is visible as an absence. Callers that want the
 * biggest first pass the result through `byValueDescending`.
 */
import {
  PRIORITY_COLOUR,
  PRIORITY_ORDER,
  ROOM_COLOUR,
  ROOM_ORDER,
  STATUS_COLOUR,
  STATUS_ORDER,
} from '../data/taxonomy'
import { itemValue, type Metric } from './items'
import { sum, type Cents } from './money'
import type { Item } from './sheet'

export type CutKey = 'room' | 'priority' | 'status'

export interface CutRow {
  key: string
  value: Cents
  colour: string
  /** Contributing item rows, priced or not. */
  count: number
  /** Share of the cut's total, 0 to 1. Zero when the total is zero — never NaN. */
  share: number
}

/* Widened to strings deliberately: the three dimensions have different key
 * unions, and a cut only ever compares and labels them. Narrowing is the parse
 * boundary's job, not this one's. */
interface Dimension {
  order: readonly string[]
  colour: Record<string, string>
  field: 'room' | 'priority' | 'status'
}

const DIMENSIONS: Record<CutKey, Dimension> = {
  room: { order: ROOM_ORDER, colour: ROOM_COLOUR, field: 'room' },
  priority: { order: PRIORITY_ORDER, colour: PRIORITY_COLOUR, field: 'priority' },
  status: { order: STATUS_ORDER, colour: STATUS_COLOUR, field: 'status' },
}

export const CUT_LABEL: Record<CutKey, string> = {
  room: 'Room',
  priority: 'Priority',
  status: 'Status',
}

export function cutBy(key: CutKey, items: readonly Item[], metric: Metric): CutRow[] {
  const { order, colour, field } = DIMENSIONS[key]

  const rows = order.map((value) => {
    const matching = items.filter((item) => item[field] === value)
    return {
      key: value,
      value: sum(matching.map((item) => itemValue(item, metric))),
      colour: colour[value] ?? 'var(--color-walnut-400)',
      count: matching.length,
      share: 0,
    }
  })

  const denominator = sum(rows.map((row) => row.value))
  if (denominator === 0) return rows

  return rows.map((row) => ({ ...row, share: row.value / denominator }))
}

export function byValueDescending(rows: readonly CutRow[]): CutRow[] {
  return [...rows].sort((a, b) => b.value - a.value || a.key.localeCompare(b.key))
}

/** The largest row's value, used as the bar-width denominator. Zero-safe. */
export function peak(rows: readonly CutRow[]): Cents {
  return rows.reduce((max, row) => Math.max(max, row.value), 0)
}
