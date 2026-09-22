/* The classification dimensions, taken from the Google Sheet's own columns.
 *
 * These are string-literal unions rather than plain `string` so a room the code
 * does not know about cannot reach a chart without a colour. Because the sheet
 * is fetched at runtime, the unions are enforced at the parse boundary
 * (src/lib/sheet.ts): an unrecognised value is reported as a problem and the
 * row is left out of the figures rather than silently colouring nothing.
 */

/* The rooms this flat has: a living room, a kitchen, three bedrooms (master,
 * guest, study) and a bathroom. 'General' is whole-flat spend — curtains,
 * aircon, electrical — that belongs to no single room.
 *
 * Seven values, one per real space. Anything the sheet says that is not one of
 * these is either mapped by ROOM_ALIAS below or reported as a problem. */
export type Room =
  | 'Living Room'
  | 'Kitchen'
  | 'Master Bedroom'
  | 'Guest Bedroom'
  | 'Study room'
  | 'Bathrooms'
  | 'General'

/* The sheet's Priority column, carried over as authored — including
 * 'Completed', which is really a status. `isSettled()` in lib/items.ts derives
 * the done/not-done question instead of reading either column directly. */
export type Priority = 'High' | 'Medium' | 'Low' | 'Completed'

export type Status = 'Researching' | 'Ordered'

/* Display order for rooms: the lived-in spaces first, then the bathroom, with
 * whole-flat spend last. */
export const ROOM_ORDER: readonly Room[] = [
  'Living Room',
  'Kitchen',
  'Master Bedroom',
  'Guest Bedroom',
  'Study room',
  'Bathrooms',
  'General',
]

export const PRIORITY_ORDER: readonly Priority[] = ['High', 'Medium', 'Low', 'Completed']

export const STATUS_ORDER: readonly Status[] = ['Ordered', 'Researching']

export const ROOMS = new Set<string>(ROOM_ORDER)
export const PRIORITIES = new Set<string>(PRIORITY_ORDER)
export const STATUSES = new Set<string>(STATUS_ORDER)

export function isRoom(value: string): value is Room {
  return ROOMS.has(value)
}

/* Values the sheet uses that are not rooms in this flat.
 *
 * 'Laundry' is the washer, the dryer and the laundry rack: real appliances, but
 * they live in the service yard off the kitchen rather than in a room of their
 * own, so they count as kitchen spend. Mapping them here rather than excluding
 * them keeps their $1,200 in the totals without inventing a room.
 *
 * The rest are spellings of rooms that do exist, so a stray plural or a
 * capitalisation slip in the sheet does not drop a row. */
const ROOM_ALIAS: Record<string, Room> = {
  laundry: 'Kitchen',
  'service yard': 'Kitchen',
  'living': 'Living Room',
  'livingroom': 'Living Room',
  'bathroom': 'Bathrooms',
  'common bathroom': 'Bathrooms',
  'master bathroom': 'Bathrooms',
  'study': 'Study room',
  'guest room': 'Guest Bedroom',
}

/** Canonical room for a sheet cell, or undefined if it names nothing known.
 *
 *  Matching ignores case and surrounding whitespace: the sheet already mixes
 *  'Study room' with 'Living Room', and a room is too important to lose to a
 *  shift key. */
export function normaliseRoom(value: string): Room | undefined {
  const trimmed = value.trim()
  if (isRoom(trimmed)) return trimmed

  const key = trimmed.toLowerCase().replace(/\s+/g, ' ')
  const aliased = ROOM_ALIAS[key]
  if (aliased !== undefined) return aliased

  return ROOM_ORDER.find((room) => room.toLowerCase() === key)
}

export function isPriority(value: string): value is Priority {
  return PRIORITIES.has(value)
}

export function isStatus(value: string): value is Status {
  return STATUSES.has(value)
}

/* Colours are token references, not hex, so charts and any SVG read from the
 * same @theme definitions in src/styles/theme.css. The room map walks the
 * series ramp in order so no two adjacent bars collide. */
export const ROOM_COLOUR: Record<Room, string> = {
  'Living Room': 'var(--color-ember-500)',
  Kitchen: 'var(--color-oak-500)',
  'Master Bedroom': 'var(--color-brass-500)',
  'Guest Bedroom': 'var(--color-sage-600)',
  'Study room': 'var(--color-denim-600)',
  Bathrooms: 'var(--color-plum-600)',
  General: 'var(--color-walnut-600)',
}

/* High is the rust emphasis; Completed is the settled green. */
export const PRIORITY_COLOUR: Record<Priority, string> = {
  High: 'var(--color-ember-500)',
  Medium: 'var(--color-brass-500)',
  Low: 'var(--color-oak-500)',
  Completed: 'var(--color-sage-600)',
}

export const STATUS_COLOUR: Record<Status, string> = {
  Ordered: 'var(--color-sage-600)',
  Researching: 'var(--color-oak-500)',
}
