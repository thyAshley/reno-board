/* Where the data comes from.
 *
 * There is no database and no backend: the browser reads the Google Sheet's CSV
 * export directly. Both endpoints below send CORS headers
 * (`access-control-allow-origin: *` on the export path, origin-echo on gviz),
 * which is what makes this possible from a static page.
 *
 * The sheet must stay shared as "anyone with the link can view". Restrict it and
 * the page shows its error state, because there is no cached copy to fall back
 * on — that is the trade for figures that are never stale.
 */
export const SHEET = {
  id: '1WMrkGRH4RzXqUrcZ7mIWmW4Dg6PS5lrFEZ3EM3_N9o0',
  /** The "Data" tab. */
  dataGid: '0',
  /** The "Utility Specs" tab, addressed by name — a gid changes if the tab is
   *  recreated, the name does not. */
  utilityTab: 'Utility Specs',
} as const

export function sheetUrl(): string {
  return `https://docs.google.com/spreadsheets/d/${SHEET.id}/edit`
}

/** CSV for a tab addressed by gid. */
export function csvUrlByGid(gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${SHEET.id}/export?format=csv&gid=${gid}`
}

/** CSV for a tab addressed by name. */
export function csvUrlByTab(tab: string): string {
  const query = new URLSearchParams({ 'tqx': 'out:csv', 'sheet': tab })
  return `https://docs.google.com/spreadsheets/d/${SHEET.id}/gviz/tq?${query.toString()}`
}
