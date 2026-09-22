import type { UtilitySpec } from '../../lib/sheet'

/* The second tab of the sheet: what each appliance needs at the wall. Useful
 * before the electrician commits to socket positions, which is why it sits on
 * the page rather than staying buried in a spreadsheet tab.
 *
 * The cells are authored with markdown markers; lib/text.ts strips them at the
 * parse boundary, because React escapes text and the asterisks would otherwise
 * render literally.
 */
export default function UtilitySpecs({ specs }: { specs: readonly UtilitySpec[] }) {
  if (specs.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-cream-300 bg-cream-100 px-4 py-6 text-sm text-walnut-600">
        No utility specs found on the sheet.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[26rem] border-collapse text-sm">
        <caption className="sr-only">Typical power and utility requirements, Singapore</caption>
        <thead>
          <tr className="border-b border-walnut-700">
            <th scope="col" className="py-2 pr-4 text-left font-mono text-[11px] tracking-wider uppercase text-walnut-600">
              Appliance
            </th>
            <th scope="col" className="py-2 text-left font-mono text-[11px] tracking-wider uppercase text-walnut-600">
              Typical requirement
            </th>
          </tr>
        </thead>
        <tbody>
          {specs.map((spec) => (
            <tr key={spec.id} className="border-b border-cream-200">
              <th scope="row" className="py-2 pr-4 text-left font-normal text-walnut-900">
                {spec.appliance}
              </th>
              <td className="py-2 font-mono text-xs text-walnut-700">{spec.spec}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-walnut-600">
        Indicative figures for planning only. Confirm every point against the appliance's own
        manual and your licensed electrician before any work is committed.
      </p>
    </div>
  )
}
