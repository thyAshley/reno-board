/* Text cleanup for values authored in a spreadsheet by hand. */

/* Cells that mean "nothing here" rather than a real value. The sheet writes
 * "NA" in the dimensions and vendor columns of the renovation rows. */
const BLANK = new Set(['', '-', '–', '—', 'na', 'n/a', 'tbc', 'tbd', 'nil'])

/** Trims, and collapses the sheet's placeholder values to undefined. */
export function cleanCell(raw: string | undefined): string | undefined {
  const trimmed = (raw ?? '').trim().replace(/\s+/g, ' ')
  return BLANK.has(trimmed.toLowerCase()) ? undefined : trimmed
}

/** Strips the `**bold**` and `` `code` `` markers typed into the Utility Specs
 *  tab, and the `*(parenthetical)*` emphasis. React escapes text, so leaving
 *  them in would render the asterisks literally. */
export function stripMarkdown(raw: string): string {
  return raw
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .trim()
}

export interface TextSegment {
  text: string
  href?: string
}

const URL_PATTERN = /https?:\/\/[^\s,)]+/g

/** Splits free text into plain and link segments so the Notes column can render
 *  real anchors without dangerouslySetInnerHTML. Trailing punctuation is left
 *  outside the href. */
export function linkify(raw: string): TextSegment[] {
  const segments: TextSegment[] = []
  let last = 0

  for (const match of raw.matchAll(URL_PATTERN)) {
    const start = match.index
    let url = match[0]

    // Don't swallow a sentence-ending period or a closing bracket.
    const trailing = url.match(/[.,;:!?'"\]]+$/)
    if (trailing) url = url.slice(0, -trailing[0].length)

    if (start > last) segments.push({ text: raw.slice(last, start) })
    segments.push({ text: url, href: url })
    last = start + url.length
  }

  if (last < raw.length) segments.push({ text: raw.slice(last) })
  return segments
}

/** Stable, readable id from a room and an item name, e.g. `kitchen-air-fryer`. */
export function slugify(...parts: string[]): string {
  return parts
    .join(' ')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
