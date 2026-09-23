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
  /** Projected less committed: what the flat has still to be paid for. */
  outstanding: Cents
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
    outstanding: projected - actual,
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

/** Work already contracted rather than shopping still to do. In this sheet that
 *  is the six Renovation Cost instalments, which behave unlike the appliances —
 *  no dimensions, no research, the price already agreed. They carry the
 *  contractor's name in the Brand column, not Retailer / Vendor, which those rows
 *  leave as "NA".
 *
 *  Asks `isSettled` — the sheet's own "not being shopped for" signal — rather than
 *  "has an Actual figure". Four of the six instalments are contracted but not yet
 *  invoiced, so an Actual test would call the contract one line and $2,071 when it
 *  is six lines and $47,420. The trade-off is that an appliance marked `Ordered`
 *  will appear here too, which is the honest reading of the column. */
export function worksRows(items: readonly Item[]): Item[] {
  return items.filter(isSettled)
}

/** Everything still being shopped for: the complement of the above. */
export function openRows(items: readonly Item[]): Item[] {
  return items.filter((item) => !isSettled(item))
}

/** The priority levels that make up the "what to buy next" view, in the order
 *  they deserve attention. Everything except `Completed`, which is the sheet's
 *  way of saying a row is done and therefore no longer something to buy. */
export const TO_BUY: readonly Priority[] = ['High', 'Medium', 'Low']

/** The rows sitting at one of the given priority levels.
 *
 *  Note what this necessarily excludes. The sheet overloads Priority to carry
 *  `Completed`, so an item that has been bought no longer says `High` or
 *  `Medium` — it says `Completed` and drops out. That is the wanted behaviour
 *  for a "what next" view, but it does mean this is the *outstanding* set, not
 *  everything ever considered a priority. */
export function priorityRows(
  items: readonly Item[],
  levels: readonly Priority[] = TO_BUY,
): Item[] {
  return items.filter((item) => levels.includes(item.priority))
}

export interface LevelTotal {
  priority: Priority
  count: number
  /** Still to commit at this level. */
  outstanding: Cents
}

/** One level's count and outstanding amount. Returns zeroes rather than
 *  undefined for a level with no rows, so a caller never has to handle absence. */
export function levelTotal(items: readonly Item[], priority: Priority): LevelTotal {
  const rows = priorityRows(items, [priority])
  return {
    priority,
    count: rows.length,
    outstanding: total(rows, 'projected') - total(rows, 'actual'),
  }
}

/** One row per level, in declared order, including levels with nothing against
 *  them — an empty level reads as "nothing outstanding" rather than vanishing. */
export function byPriorityLevel(
  items: readonly Item[],
  levels: readonly Priority[] = TO_BUY,
): LevelTotal[] {
  return levels.map((priority) => levelTotal(items, priority))
}

export interface RoomGroup {
  room: Room
  rows: Item[]
  /** Still to commit in this room. */
  outstanding: Cents
  /** Already committed in this room. */
  actual: Cents
}

/** Groups rows by room, in declared room order, dropping rooms with nothing in
 *  them — an empty room is noise on a shopping list, unlike on the spend chart
 *  where "nothing spent here" is the point.
 *
 *  Takes rows already in the order they should appear and preserves it, so the
 *  sort lives in one place (App) rather than being half here and half there. */
export function byRoomGroup(rows: readonly Item[]): RoomGroup[] {
  return ROOM_ORDER.map((room) => {
    const inRoom = rows.filter((row) => row.room === room)
    return {
      room,
      rows: inRoom,
      outstanding: total(inRoom, 'projected') - total(inRoom, 'actual'),
      actual: total(inRoom, 'actual'),
    }
  }).filter((group) => group.rows.length > 0)
}

export interface Outlook {
  count: number
  /** Committed against these rows already. */
  actual: Cents
  /** Still to commit on these rows: their realistic outturn less what is
   *  already committed. The number to carry to the shops. */
  outstanding: Cents
  /** Budget, less everything committed across the whole list, less the
   *  outstanding amount above. What would remain having bought only these —
   *  which is the question a priority list is asked. Absent without a budget. */
  after?: Cents
}

/** Money view of one subset of rows, read against the whole list's commitments.
 *  `all` is deliberately a separate argument: the headroom this reports has to
 *  net off spend from rows that are *not* in the subset, so it cannot be
 *  derived from the subset alone. */
export function outlook(
  all: readonly Item[],
  subset: readonly Item[],
  budget?: Cents,
): Outlook {
  const actual = total(subset, 'actual')
  const outstanding = total(subset, 'projected') - actual

  return {
    count: subset.length,
    actual,
    outstanding,
    ...(budget !== undefined && { after: budget - total(all, 'actual') - outstanding }),
  }
}
