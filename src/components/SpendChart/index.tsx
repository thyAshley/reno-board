import { useState } from 'react'
import Chips from '../Chips'
import { byValueDescending, cutBy, peak, type CutKey } from '../../lib/cuts'
import type { Metric } from '../../lib/items'
import { formatSGD0 } from '../../lib/money'
import type { Item } from '../../lib/sheet'

/* Bars, cut three ways against three metrics. No chart library: a bar is a div
 * with a width, and the accessible version is the table semantics underneath.
 */
const CUTS: readonly { value: CutKey; label: string }[] = [
  { value: 'room', label: 'By room' },
  { value: 'priority', label: 'By priority' },
  { value: 'status', label: 'By status' },
]

const METRICS: readonly { value: Metric; label: string }[] = [
  { value: 'projected', label: 'Projected' },
  { value: 'actual', label: 'Committed' },
  { value: 'estimate', label: 'Estimated' },
]

export default function SpendChart({ items }: { items: readonly Item[] }) {
  const [cut, setCut] = useState<CutKey>('room')
  const [metric, setMetric] = useState<Metric>('projected')

  const rows = byValueDescending(cutBy(cut, items, metric))
  const widest = peak(rows)

  return (
    <div>
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <Chips label="Cut the spend by" options={CUTS} value={cut} onChange={setCut} />
        <Chips label="Which figure to chart" options={METRICS} value={metric} onChange={setMetric} />
      </div>

      <table className="mt-5 w-full border-collapse">
        <caption className="sr-only">
          {METRICS.find((m) => m.value === metric)?.label} spend by{' '}
          {CUTS.find((c) => c.value === cut)?.label.replace('By ', '')}
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">{cut}</th>
            <th scope="col">Amount</th>
            <th scope="col">Share</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="align-middle">
              <th
                scope="row"
                className="w-1/3 py-1.5 pr-3 text-left text-sm font-normal text-walnut-700"
              >
                {row.key}
                <span className="ml-1.5 font-mono text-[11px] text-walnut-400">{row.count}</span>
              </th>
              <td className="py-1.5">
                <div
                  className="h-5 rounded-sm transition-[width] duration-500"
                  style={{
                    width: widest === 0 ? '0%' : `${Math.max((row.value / widest) * 100, row.value > 0 ? 1 : 0)}%`,
                    backgroundColor: row.colour,
                  }}
                />
              </td>
              <td className="figure w-28 py-1.5 pl-3 text-right text-sm whitespace-nowrap text-walnut-900">
                {row.value === 0 ? (
                  <span className="text-walnut-400">—</span>
                ) : (
                  <>
                    <span className="text-walnut-400">S$</span>
                    {formatSGD0(row.value)}
                  </>
                )}
              </td>
              <td className="figure w-14 py-1.5 pl-2 text-right text-xs text-walnut-600">
                {row.share === 0 ? '' : `${Math.round(row.share * 100)}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
