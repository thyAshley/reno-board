import { formatSGD } from '../../lib/money'
import type { Item } from '../../lib/sheet'
import { total } from '../../lib/totals'

/* Work billed by a contractor, as distinct from appliances to be shopped for:
 * a quoted figure against it, nothing to research. Kept separate because it
 * behaves nothing like the rest of the register, and because mixing it into an
 * item count makes that count mean two things at once.
 *
 * The sheet names the contractor in the Brand column on these rows and leaves
 * Retailer / Vendor as "NA", so the contractor is read from brand first.
 */
const contractorOf = (row: Item): string | undefined => row.brand ?? row.vendor

export default function WorksLedger({ rows }: { rows: readonly Item[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-cream-300 bg-cream-100 px-4 py-6 text-sm text-walnut-600">
        Nothing quoted yet. Rows gain an actual price once the work is billed.
      </p>
    )
  }

  const vendors = [...new Set(rows.map(contractorOf).filter(Boolean))]
  const billed = total(rows, 'actual')

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[30rem] border-collapse text-sm">
        <caption className="sr-only">
          {rows.length} billed lines from {vendors.length} contractor
          {vendors.length === 1 ? '' : 's'}
        </caption>
        <thead>
          <tr className="border-b border-walnut-700">
            <th scope="col" className="py-2 pr-3 text-left font-mono text-[11px] tracking-wider uppercase text-walnut-600">
              Work
            </th>
            <th scope="col" className="py-2 pr-3 text-left font-mono text-[11px] tracking-wider uppercase text-walnut-600">
              Room
            </th>
            <th scope="col" className="py-2 pr-3 text-left font-mono text-[11px] tracking-wider uppercase text-walnut-600">
              Contractor
            </th>
            <th scope="col" className="py-2 text-right font-mono text-[11px] tracking-wider uppercase text-walnut-600">
              Billed
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-cream-200">
              <th scope="row" className="py-2 pr-3 text-left font-normal text-walnut-900">
                {row.name}
              </th>
              <td className="py-2 pr-3 text-walnut-700">{row.room}</td>
              <td className="py-2 pr-3 text-walnut-700">
                {contractorOf(row) ?? '—'}
                {row.model !== undefined && (
                  <span className="block text-xs text-walnut-600">{row.model}</span>
                )}
              </td>
              <td className="figure py-2 text-right whitespace-nowrap text-walnut-900">
                <span className="text-walnut-400">S$</span>
                {formatSGD(row.actual ?? 0)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-walnut-700">
            <th scope="row" colSpan={3} className="py-2 pr-3 text-left font-mono text-[11px] tracking-wider uppercase">
              {rows.length} lines billed
            </th>
            <td className="figure py-2 text-right whitespace-nowrap text-walnut-900">
              <span className="text-walnut-400">S$</span>
              {formatSGD(billed)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
