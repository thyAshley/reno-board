import { useMemo, type ReactNode } from 'react'
import BudgetTiles from './components/BudgetTiles'
import ItemRegister from './components/ItemRegister'
import { Loading, LoadError, Problems } from './components/Notice'
import SpendChart from './components/SpendChart'
import UtilitySpecs from './components/UtilitySpecs'
import WorksLedger from './components/WorksLedger'
import { SECTIONS, SITE } from './data/site'
import { sheetUrl } from './data/source'
import { useScrolledPast } from './hooks/useScrolledPast'
import { useSheet } from './hooks/useSheet'
import { summarise, worksRows } from './lib/totals'

export default function App() {
  const sheet = useSheet()
  const { status, items, specs, stated, problems, error, fetchedAt, reload } = sheet
  const [marker, stuck] = useScrolledPast<HTMLDivElement>()

  const summary = useMemo(() => summarise(items, stated.budget), [items, stated.budget])
  const works = useMemo(() => worksRows(items), [items])

  const heading = (id: string): string =>
    SECTIONS.find((section) => section.id === id)?.heading ?? id

  return (
    <div className="min-h-dvh bg-cream-50 text-walnut-900">
      {/* The masthead is ordinary flow: it scrolls away and is never resized. */}
      <header className="bg-walnut-900 text-cream-100">
        <div className="mx-auto max-w-6xl px-6 pt-12 pb-8">
          <p className="font-mono text-xs tracking-[0.2em] text-brass-500 uppercase">
            {SITE.eyebrow}
          </p>
          <h1 className="mt-3 font-display text-4xl text-cream-50 sm:text-5xl">{SITE.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-cream-200">{SITE.standfirst}</p>
        </div>
      </header>

      {/* Marks the end of the masthead. Once it leaves the viewport the bar below
        * has pinned. 1px, and carries the masthead's own background so it does
        * not read as a hairline between the two dark blocks. */}
      <div ref={marker} aria-hidden="true" className="h-px bg-walnut-900" />

      {/* The minimised header. Sticky, and — the point — a *constant* height in
        * both states, so pinning it changes no geometry at all.
        *
        * This is why it neither flickers nor lurches. A header that shrinks on
        * scroll shortens the document, which yanks the content up under the
        * cursor and, if the scroll position gets clamped, can bounce the trigger
        * back and forth forever. Here only the title's opacity changes, and
        * opacity is free: it moves nothing.
        *
        * It must be a sibling of <main>, not a child of <header>. A sticky
        * element cannot escape its containing block, so nesting it in the
        * masthead would unstick it the moment the masthead scrolled past. */}
      <div
        className={`sticky top-0 z-50 border-b border-walnut-700 bg-walnut-900 text-cream-100 transition-shadow duration-200 ${
          stuck ? 'shadow-lg shadow-walnut-950/40' : ''
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-x-6 px-6 py-2.5">
          {/* aria-hidden: the h1 above already says this, and it is here to keep
            * the page identity visible, not to be read out twice. */}
          <p
            aria-hidden="true"
            className={`truncate font-display text-lg text-cream-50 transition-opacity duration-200 ${
              stuck ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {SITE.title}
          </p>
          <Freshness fetchedAt={fetchedAt} loading={status === 'loading'} onReload={reload} />
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {status === 'error' && error !== undefined ? (
          <LoadError error={error} onRetry={reload} />
        ) : status === 'loading' && items.length === 0 ? (
          <Loading />
        ) : (
          <>
            {problems.length > 0 && (
              <div className="mb-8">
                <Problems problems={problems} />
              </div>
            )}

            <BudgetTiles summary={summary} />

            <Section id="spend" heading={heading('spend')}>
              <SpendChart items={items} />
            </Section>

            <Section
              id="works"
              heading={heading('works')}
              note="Lines a contractor has billed, kept apart from the appliances still being shopped for."
            >
              <WorksLedger rows={works} />
            </Section>

            <Section id="register" heading={heading('register')}>
              <ItemRegister items={items} />
            </Section>

            <Section id="specs" heading={heading('specs')}>
              <UtilitySpecs specs={specs} />
            </Section>
          </>
        )}
      </main>

      <footer className="mt-8 border-t border-cream-300 px-6 py-8">
        <div className="mx-auto max-w-6xl space-y-2 text-xs text-walnut-600">
          <p>
            Figures are what this flat cost or is expected to cost. They are not a quote, an
            estimate for anyone else, or advice.
          </p>
          <p>
            Read live from a{' '}
            <a href={sheetUrl()} className="underline" target="_blank" rel="noreferrer noopener">
              Google Sheet
            </a>{' '}
            each time this page loads, so nothing here can be out of step with the spreadsheet.
          </p>
        </div>
      </footer>
    </div>
  )
}

function Section({
  id,
  heading,
  note,
  children,
}: {
  id: string
  heading: string
  note?: string
  children: ReactNode
}) {
  return (
    // scroll-mt clears the collapsed sticky header, so jumping to #register
    // does not park the heading underneath it.
    <section id={id} aria-labelledby={`${id}-heading`} className="mt-12 scroll-mt-20">
      <h2 id={`${id}-heading`} className="font-display text-2xl">
        {heading}
      </h2>
      {note !== undefined && <p className="mt-1 max-w-2xl text-sm text-walnut-600">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}

function Freshness({
  fetchedAt,
  loading,
  onReload,
}: {
  // Explicitly `| undefined` rather than `?:` — exactOptionalPropertyTypes
  // distinguishes "absent" from "present and undefined", and this prop is
  // always passed, sometimes holding undefined.
  fetchedAt: Date | undefined
  loading: boolean
  onReload: () => void
}) {
  const read =
    fetchedAt === undefined
      ? undefined
      : fetchedAt.toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })

  return (
    <p className="flex shrink-0 items-center gap-3 font-mono text-xs text-cream-300">
      {/* The label is dropped on narrow screens, where the bar has no room for
        * it; the time itself always shows. */}
      <span>
        {read === undefined ? (
          SITE.viewingNote
        ) : (
          <>
            <span className="hidden sm:inline">Read from the sheet at </span>
            {read}
          </>
        )}
      </span>
      <button
        type="button"
        onClick={onReload}
        disabled={loading}
        className="rounded-full border border-walnut-500 px-3 py-1 text-cream-200 hover:border-brass-500 disabled:opacity-50"
      >
        {loading ? 'Refreshing…' : 'Refresh'}
      </button>
    </p>
  )
}
