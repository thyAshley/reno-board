/* Per-item questions and ordering. Pure functions, no React, no clock. */
import { PRIORITY_ORDER, ROOM_ORDER, STATUS_ORDER } from '../data/taxonomy'
import type { Cents } from './money'
import type { Item } from './sheet'

/** Which figure a chart or total is reading.
 *  - `estimate`  what it is expected to cost
 *  - `actual`    what has actually been quoted or paid
 *  - `projected` actual where known, else estimate — the realistic outturn */
export type Metric = 'estimate' | 'actual' | 'projected'

export function itemValue(item: Item, metric: Metric): Cents {
  switch (metric) {
    case 'estimate':
      return item.estimate ?? 0
    case 'actual':
      return item.actual ?? 0
    case 'projected':
      return item.actual ?? item.estimate ?? 0
  }
}

/** Decided and paid for. The sheet expresses this two ways — `Completed` in the
 *  Priority column and `Ordered` in Status — so ask this rather than reading
 *  either column directly. */
export function isSettled(item: Item): boolean {
  return item.priority === 'Completed' || item.status === 'Ordered'
}

/** Has any figure at all against it. An item with neither estimate nor actual
 *  is pure wishlist. */
export function isPriced(item: Item): boolean {
  return item.estimate !== undefined || item.actual !== undefined
}

export type SortKey = 'name' | 'room' | 'priority' | 'status' | 'vendor' | 'estimate' | 'actual'

export interface SortState {
  key: SortKey
  dir: 1 | -1
}

/** Money columns start descending (the biggest spend is the interesting one);
 *  text columns start ascending. Clicking the active column flips it. */
const MONEY_KEYS: readonly SortKey[] = ['estimate', 'actual']

export const INITIAL_SORT: SortState = { key: 'actual', dir: -1 }

export function nextSortState(current: SortState, key: SortKey): SortState {
  if (current.key === key) return { key, dir: current.dir === 1 ? -1 : 1 }
  return { key, dir: MONEY_KEYS.includes(key) ? -1 : 1 }
}

const rank = (order: readonly string[], value: string): number => {
  const index = order.indexOf(value)
  return index === -1 ? order.length : index
}

/** Returns a new array; never mutates the input. Ordered dimensions sort by
 *  their declared order, not alphabetically, so High comes before Low. */
export function sortItems(items: readonly Item[], { key, dir }: SortState): Item[] {
  const compare = (a: Item, b: Item): number => {
    switch (key) {
      case 'estimate':
      case 'actual':
        return (a[key] ?? 0) - (b[key] ?? 0)
      case 'room':
        return rank(ROOM_ORDER, a.room) - rank(ROOM_ORDER, b.room)
      case 'priority':
        return rank(PRIORITY_ORDER, a.priority) - rank(PRIORITY_ORDER, b.priority)
      case 'status':
        return rank(STATUS_ORDER, a.status) - rank(STATUS_ORDER, b.status)
      case 'vendor':
        return (a.vendor ?? '').localeCompare(b.vendor ?? '')
      case 'name':
        return a.name.localeCompare(b.name)
    }
  }

  const unpriced = (item: Item): boolean =>
    (key === 'estimate' || key === 'actual') && item[key] === undefined

  return [...items].sort((a, b) => {
    // Rows with no figure sink to the bottom whichever way the column points,
    // so flipping direction never fills the top of the table with blanks.
    if (unpriced(a) !== unpriced(b)) return unpriced(a) ? 1 : -1

    const primary = compare(a, b) * dir
    // A stable tie-break keeps rows from shuffling between renders.
    return primary !== 0 ? primary : a.id.localeCompare(b.id)
  })
}
