/* Money is integer cents everywhere and is formatted only at the render edge.
 *
 * The sheet hands us strings like `"$2,000.00"`, `"$800.00"`, `""` and `"NA"`.
 * Parsing to cents once, at the sheet boundary, means nothing downstream adds
 * floats: summing 11352.35 + 6627.20 + 2089.53 in floating point drifts, and a
 * total a cent away from the sum of its parts is exactly the bug this avoids.
 */
export type Cents = number

const GROUPED = new Intl.NumberFormat('en-SG', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const GROUPED_WHOLE = new Intl.NumberFormat('en-SG', {
  maximumFractionDigits: 0,
})

/* Cells that mean "no figure" rather than zero. The sheet uses all of these. */
const BLANK = new Set(['', '-', '–', '—', 'na', 'n/a', 'tbc', 'tbd', 'nil'])

/* Cents are assembled from the digit string rather than by multiplying a parsed
 * float by 100: `1.005 * 100` is 100.49999999999999 in binary floating point, so
 * `Math.round` would give 100 cents where a spreadsheet gives 101. Splitting the
 * whole and fractional parts and rounding half-up on the third decimal digit
 * keeps this exact and matches what the sheet shows. */
const NUMBER = /^(-?)(\d*)(?:\.(\d*))?$/

/** `"$2,000.00"` -> `200000`. Returns undefined for a blank or non-numeric cell. */
export function parseMoney(raw: string): Cents | undefined {
  const trimmed = raw.trim()
  if (BLANK.has(trimmed.toLowerCase())) return undefined

  // Strip currency symbols, thousands separators and spaces; keep sign and dot.
  const cleaned = trimmed.replace(/[^0-9.\-()]/g, '')
  if (cleaned === '') return undefined

  // Accounting parentheses mean negative.
  const parenthesised = /^\(.*\)$/.test(cleaned)
  const digits = cleaned.replace(/[()]/g, '')

  const match = NUMBER.exec(digits)
  if (match === null) return undefined

  const [, sign, whole = '', fraction = ''] = match
  if (whole === '' && fraction === '') return undefined

  const magnitude =
    Number(whole === '' ? '0' : whole) * 100 +
    Number(`${fraction}00`.slice(0, 2)) +
    (Number(fraction[2] ?? '0') >= 5 ? 1 : 0)

  if (!Number.isFinite(magnitude)) return undefined
  return parenthesised || sign === '-' ? -magnitude : magnitude
}

/** `447900` -> `"4,479.00"`. No currency prefix; callers add `S$` where wanted. */
export function formatSGD(c: Cents): string {
  return GROUPED.format(c / 100)
}

/** `447900` -> `"4,479"`. For tiles and axis ticks, where cents are noise. */
export function formatSGD0(c: Cents): string {
  return GROUPED_WHOLE.format(Math.round(c / 100))
}

/** Zero renders as an em dash, negatives in accounting parentheses. */
export function formatAccounting(c: Cents): string {
  if (c === 0) return '—'
  if (c < 0) return `(${GROUPED.format(Math.abs(c) / 100)})`
  return GROUPED.format(c / 100)
}

/** Compact axis labels: `1200000` -> `"12k"`, `80000` -> `"800"`. */
export function formatCompact(c: Cents): string {
  const dollars = c / 100
  if (Math.abs(dollars) >= 1000) {
    const thousands = dollars / 1000
    const rounded = Math.abs(thousands) >= 10 ? Math.round(thousands) : Math.round(thousands * 10) / 10
    return `${rounded}k`
  }
  return GROUPED_WHOLE.format(dollars)
}

export function sum(values: readonly Cents[]): Cents {
  return values.reduce((a, b) => a + b, 0)
}
