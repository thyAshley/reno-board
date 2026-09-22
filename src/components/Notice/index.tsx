import { sheetUrl } from '../../data/source'

/* The three things that can go wrong when the data lives in someone else's
 * spreadsheet: it is still loading, it would not load at all, or it loaded with
 * rows the parser could not trust. None of them should be silent.
 */

export function Loading() {
  return (
    <p role="status" className="font-mono text-sm text-walnut-600">
      Reading the sheet…
    </p>
  )
}

export function LoadError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-md border border-ember-500 bg-cream-100 px-4 py-4">
      <h2 className="font-display text-xl text-ember-600">The sheet would not load</h2>
      <p className="mt-2 text-sm text-walnut-700">{error}.</p>
      <p className="mt-2 text-sm text-walnut-700">
        Every figure on this page is read live from the spreadsheet, so there is nothing to show
        until it responds. The usual cause is the sheet no longer being shared as{' '}
        <em>anyone with the link can view</em>.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-walnut-800 bg-walnut-800 px-3 py-1.5 font-mono text-xs text-cream-50"
        >
          Try again
        </button>
        <a
          href={sheetUrl()}
          className="rounded-md border border-cream-300 px-3 py-1.5 font-mono text-xs text-walnut-700 underline"
        >
          Open the sheet
        </a>
      </div>
    </div>
  )
}

/** Rows excluded from the figures, listed so the sheet can be corrected. */
export function Problems({ problems }: { problems: readonly string[] }) {
  if (problems.length === 0) return null

  return (
    <div className="rounded-md border border-brass-500 bg-cream-100 px-4 py-3">
      <h2 className="font-mono text-xs tracking-wider text-walnut-700 uppercase">
        {problems.length === 1 ? '1 row needs attention' : `${problems.length} rows need attention`}
      </h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-walnut-700">
        {problems.map((problem) => (
          <li key={problem}>{problem}</li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-walnut-600">
        Excluded rows are left out of every total below rather than counted as zero.
      </p>
    </div>
  )
}
