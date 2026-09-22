/* A small RFC 4180 CSV reader.
 *
 * Google's CSV export quotes any cell containing a comma and doubles interior
 * quotes, so splitting on commas mangles `"$2,000.00"` and every vendor name
 * with a comma in it. This handles quoting, doubled quotes, and CR, LF or CRLF
 * line endings. Ten lines of parser is cheaper than a dependency here.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  let i = 0

  const endField = () => {
    row.push(field)
    field = ''
  }
  const endRow = () => {
    endField()
    rows.push(row)
    row = []
  }

  // A leading BOM would otherwise become part of the first header cell.
  if (text.charCodeAt(0) === 0xfeff) i = 1

  for (; i < text.length; i++) {
    const char = text[i]

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          quoted = false
        }
      } else {
        field += char
      }
      continue
    }

    switch (char) {
      case '"':
        quoted = true
        break
      case ',':
        endField()
        break
      case '\r':
        // Swallow CRLF as one break; a lone CR is still a break.
        if (text[i + 1] === '\n') i++
        endRow()
        break
      case '\n':
        endRow()
        break
      default:
        field += char
    }
  }

  // A final row with no trailing newline still counts; a trailing newline does
  // not invent an empty row.
  if (field !== '' || row.length > 0) endRow()

  return rows
}

/** True when every cell in the row is blank — the spacer rows Google emits. */
export function isBlankRow(row: readonly string[]): boolean {
  return row.every((cell) => cell.trim() === '')
}
