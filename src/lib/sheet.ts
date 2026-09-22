/* The boundary between the Google Sheet and the rest of the app.
 *
 * Everything untrusted happens here: CSV shape, header positions, unrecognised
 * rooms, unparseable prices. Downstream code receives `Item[]` with the unions
 * already narrowed, so no component has to think about a missing column.
 *
 * Because the sheet is read at runtime, the type system cannot catch a renamed
 * column for us. So instead of throwing, the parser collects `problems` and the
 * page shows them in a banner — a bad row is excluded from the figures rather
 * than quietly counted as zero. tests/lib/sheet.test.ts pins the real sheet's
 * shape, so a breaking edit fails CI too.
 */
import {
  isPriority,
  isStatus,
  normaliseRoom,
  type Priority,
  type Room,
  type Status,
} from '../data/taxonomy'
import { isBlankRow, parseCsv } from './csv'
import { parseMoney, type Cents } from './money'
import { cleanCell, slugify, stripMarkdown } from './text'

export interface Item {
  id: string
  priority: Priority
  room: Room
  name: string
  status: Status
  brand?: string
  model?: string
  dimensions?: string
  vendor?: string
  /** Target / Estimated Price. Absent until a figure is researched. */
  estimate?: Cents
  /** Actual / Quoted Price. Absent until ordered or quoted. */
  actual?: Cents
  warranty?: string
  notes?: string
}

export interface SheetData {
  items: Item[]
  /** Figures the sheet states in its own summary block. Recomputed from the
   *  rows downstream; these are kept only to verify agreement. */
  stated: {
    budget?: Cents
    estimate?: Cents
    actual?: Cents
  }
  problems: string[]
}

export interface UtilitySpec {
  id: string
  appliance: string
  spec: string
}

/* Columns are located by matching the header text, not by fixed index, so
 * inserting or reordering a column in the sheet does not silently shift every
 * value one to the left. */
const COLUMNS = {
  priority: /^priority$/i,
  room: /^room\b/i,
  name: /^appliance\b|^item\b/i,
  brand: /^brand$/i,
  model: /^model$/i,
  status: /^status$/i,
  dimensions: /^dimension/i,
  vendor: /^retailer\b|^vendor$/i,
  estimate: /^target\b|estimated price/i,
  actual: /^actual\b|quoted price/i,
  warranty: /^warranty/i,
  notes: /^notes/i,
} as const

type Field = keyof typeof COLUMNS

/** Columns without which the page has nothing to show. */
const REQUIRED: readonly Field[] = ['priority', 'room', 'name', 'status']

type ColumnMap = Partial<Record<Field, number>>

/* The data does not start at row 1: the sheet opens with a title and a summary
 * block. The header row is the first one carrying both a Priority and a Room
 * column. */
function findHeaderRow(rows: readonly string[][]): number {
  return rows.findIndex(
    (row) =>
      row.some((cell) => COLUMNS.priority.test(cell.trim())) &&
      row.some((cell) => COLUMNS.room.test(cell.trim())),
  )
}

function mapColumns(header: readonly string[]): ColumnMap {
  const map: ColumnMap = {}
  header.forEach((cell, index) => {
    const text = cell.trim()
    if (text === '') return
    for (const [field, pattern] of Object.entries(COLUMNS) as [Field, RegExp][]) {
      if (map[field] === undefined && pattern.test(text)) {
        map[field] = index
        return
      }
    }
  })
  return map
}

/** Reads a summary figure by its label rather than its coordinates: finds the
 *  labelled cell and takes the value directly beneath it. Survives the summary
 *  block moving up or down a row. */
function labelledFigure(rows: readonly string[][], label: RegExp): Cents | undefined {
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    if (!row) continue
    for (let c = 0; c < row.length; c++) {
      if (label.test((row[c] ?? '').trim())) {
        return parseMoney(rows[r + 1]?.[c] ?? '')
      }
    }
  }
  return undefined
}

export function parseSheet(csv: string): SheetData {
  const problems: string[] = []
  const rows = parseCsv(csv)

  const headerIndex = findHeaderRow(rows)
  if (headerIndex === -1) {
    return {
      items: [],
      stated: {},
      problems: ['Could not find the header row — no row has both a Priority and a Room column.'],
    }
  }

  const columns = mapColumns(rows[headerIndex] ?? [])
  const missing = REQUIRED.filter((field) => columns[field] === undefined)
  if (missing.length > 0) {
    return {
      items: [],
      stated: {},
      problems: [`The sheet is missing required column(s): ${missing.join(', ')}.`],
    }
  }

  const cellAt = (row: readonly string[], field: Field): string => {
    const index = columns[field]
    return index === undefined ? '' : (row[index] ?? '')
  }

  const items: Item[] = []
  const seen = new Map<string, number>()

  for (let r = headerIndex + 1; r < rows.length; r++) {
    const row = rows[r]
    if (!row || isBlankRow(row)) continue

    const name = cleanCell(cellAt(row, 'name'))
    if (name === undefined) continue

    // Spreadsheet row number, so a reported problem is findable in the sheet.
    const where = `row ${r + 1} ("${name}")`

    const priority = cellAt(row, 'priority').trim()
    const stated = cellAt(row, 'room').trim()
    const status = cellAt(row, 'status').trim()

    if (!isPriority(priority)) {
      problems.push(`Unknown priority "${priority}" at ${where} — row excluded.`)
      continue
    }
    // Aliases are resolved here rather than guarded: a sheet row filed under
    // "Laundry" is real spend that belongs to the kitchen, not a bad row.
    const room = normaliseRoom(stated)
    if (room === undefined) {
      problems.push(`Unknown room "${stated}" at ${where} — row excluded.`)
      continue
    }
    if (!isStatus(status)) {
      problems.push(`Unknown status "${status}" at ${where} — row excluded.`)
      continue
    }

    const base = slugify(room, name)
    const count = (seen.get(base) ?? 0) + 1
    seen.set(base, count)

    const brand = cleanCell(cellAt(row, 'brand'))
    const model = cleanCell(cellAt(row, 'model'))
    const dimensions = cleanCell(cellAt(row, 'dimensions'))
    const vendor = cleanCell(cellAt(row, 'vendor'))
    const warranty = cleanCell(cellAt(row, 'warranty'))
    const notes = cleanCell(cellAt(row, 'notes'))
    const estimate = parseMoney(cellAt(row, 'estimate'))
    const actual = parseMoney(cellAt(row, 'actual'))

    items.push({
      id: count === 1 ? base : `${base}-${count}`,
      priority,
      room,
      name,
      status,
      ...(brand !== undefined && { brand }),
      ...(model !== undefined && { model }),
      ...(dimensions !== undefined && { dimensions }),
      ...(vendor !== undefined && { vendor }),
      ...(estimate !== undefined && { estimate }),
      ...(actual !== undefined && { actual }),
      ...(warranty !== undefined && { warranty }),
      ...(notes !== undefined && { notes }),
    })
  }

  if (items.length === 0) problems.push('The sheet has a header row but no usable data rows.')

  const budget = labelledFigure(rows, /^total budget$/i)
  const estimate = labelledFigure(rows, /^total est/i)
  const actual = labelledFigure(rows, /^total actual/i)

  return {
    items,
    stated: {
      ...(budget !== undefined && { budget }),
      ...(estimate !== undefined && { estimate }),
      ...(actual !== undefined && { actual }),
    },
    problems,
  }
}

/** The Utility Specs tab: two columns, one header row, markdown typed by hand. */
export function parseUtilitySpecs(csv: string): UtilitySpec[] {
  const rows = parseCsv(csv)
  const specs: UtilitySpec[] = []

  for (const [index, row] of rows.entries()) {
    if (!row || isBlankRow(row)) continue

    const appliance = stripMarkdown(row[0] ?? '')
    const spec = stripMarkdown(row[1] ?? '')
    if (appliance === '' || spec === '') continue

    // Skip the header row, whichever wording it uses.
    if (index === 0 && /^appliance$/i.test(appliance)) continue

    specs.push({ id: slugify(appliance), appliance, spec })
  }

  return specs
}
