/* Every figure the page displays is computed here from the sheet's rows.
 *
 * Nothing reads the sheet's own summary block for display: those cells are
 * formulas that can fall out of step with the rows beneath them (its stated
 * item count of 41 includes six renovation-billing lines, for instance). The
 * stated figures are compared against these in tests as an integrity check.
 */
import { ROOM_ORDER, type Priority, type Room, type Status } from '../data/taxonomy'
import { isPriced, isSettled, itemValue, type Metric } from './items'
import { sum, type Cents } from './money'
import type { Item } from './sheet'

export interface Summary {
  itemCount: number
  pricedCount: number
  settledCount: number
  /** Sum of the Target / Estimated column. */
  estimate: Cents
  /** Sum of the Actual / Quoted column — money actually committed. */
  actual: Cents
  /** Actual where known, else estimate. The realistic final bill. */
  projected: Cents
  budget?: Cents
  /** Budget less what is committed so far. The sheet's own "Variance". */
  remaining?: Cents
  /** Budget less the projected outturn — whether the plan still fits. */
  headroom?: Cents
}

export function total(items: readonly Item[], metric: Metric): Cents {
  return sum(items.map((item) => itemValue(item, metric)))
}

export function summarise(items: readonly Item[], budget?: Cents): Summary {
  const actual = total(items, 'actual')
  const projected = total(items, 'projected')

  return {
    itemCount: items.length,
    pricedCount: items.filter(isPriced).length,
    settledCount: items.filter(isSettled).length,
    estimate: total(items, 'estimate'),
    actual,
    projected,
    ...(budget !== undefined && {
      budget,
      remaining: budget - actual,
      headroom: budget - projected,
    }),
  }
}

export interface RoomTotal {
  room: Room
  estimate: Cents
  actual: Cents
  projected: Cents
  count: number
}

/** Every room in declared order, including those with nothing against them yet,
 *  so an empty room reads as "nothing spent" rather than vanishing. */
export function byRoom(items: readonly Item[]): RoomTotal[] {
  return ROOM_ORDER.map((room) => {
    const inRoom = items.filter((item) => item.room === room)
    return {
      room,
      estimate: total(inRoom, 'estimate'),
      actual: total(inRoom, 'actual'),
      projected: total(inRoom, 'projected'),
      count: inRoom.length,
    }
  })
}

export function countBy<K extends Priority | Status>(
  items: readonly Item[],
  field: 'priority' | 'status',
  keys: readonly K[],
): Record<K, number> {
  const counts = Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>
  for (const item of items) {
    const value = item[field] as K
    if (value in counts) counts[value] += 1
  }
  return counts
}

/** Rows with a quoted amount against them: work already billed rather than
 *  shopping still to do. In this sheet that is the six per-room Renovation Cost
 *  lines, which behave unlike the appliances — no dimensions, no research,
 *  already committed. Note they carry the contractor's name in the Brand column,
 *  not Retailer / Vendor, which those rows leave as "NA". */
export function worksRows(items: readonly Item[]): Item[] {
  return items.filter((item) => item.actual !== undefined)
}

/** Everything still being shopped for: no committed figure yet. */
export function openRows(items: readonly Item[]): Item[] {
  return items.filter((item) => item.actual === undefined)
}
