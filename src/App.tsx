import { useMemo, type ReactNode } from 'react'
import BudgetTiles from './components/BudgetTiles'
import ItemRegister from './components/ItemRegister'
import { Loading, LoadError, Problems } from './components/Notice'
import PriorityBoard from './components/PriorityBoard'
import SpendChart from './components/SpendChart'
import Tabs, { type TabItem } from './components/Tabs'
import UtilitySpecs from './components/UtilitySpecs'
import WorksLedger from './components/WorksLedger'
import { SECTIONS, SITE, TAB_IDS, type SectionId } from './data/site'
import { sheetUrl } from './data/source'
import { useHashTab } from './hooks/useHashTab'
import { useScrolledPast } from './hooks/useScrolledPast'
import { useSheet } from './hooks/useSheet'
import { sortItems } from './lib/items'
import {
  NEXT_UP,
  byPriorityLevel,
  levelTotal,
  outlook,
  priorityRows,
  summarise,
  worksRows,
} from './lib/totals'

const FIRST_TAB: SectionId = 'priority'

export default function App() {
  const sheet = useSheet()
  const { status, items, specs, stated, problems, error, fetchedAt, reload } = sheet
  const [marker, stuck] = useScrolledPast<HTMLDivElement>()
  const [active, selectTab] = useHashTab(TAB_IDS, FIRST_TAB)

  const summary = useMemo(() => summarise(items, stated.budget), [items, stated.budget])
  const works = useMemo(() => worksRows(items), [items])

  /* High before Medium, and within each, dearest first: the item that moves the
   * budget most is the one worth deciding first. Grouping by level then sorting
   * within it, rather than one sort across both, keeps the two blocks intact —
   * a dear Medium should not outrank a cheap High on a list about urgency. */
  const priority = useMemo(
    () =>
      NEXT_UP.flatMap((level) =>
        sortItems(priorityRows(items, [level]), { key: 'estimate', dir: -1 }),
      ),
    [items],
  )
  const priorityOutlook = useMemo(
    () => outlook(items, priority, stated.budget),
    [items, priority, stated.budget],
  )
  const priorityLevels = useMemo(() => byPriorityLevel(items), [items])

  /* Low is shown for the overview and kept out of every figure above it — see the
   * comment in PriorityBoard. */
  const lowRows = useMemo(
    () => sortItems(priorityRows(items, ['Low']), { key: 'estimate', dir: -1 }),
    [items],
  )
  const low = useMemo(() => levelTotal(items, 'Low'), [items])

  /* A count on the strip wherever one is meaningful. Spend gets none: it is a
   * different view of the same rows, not a subset of them, so "41" beside it
   * would only repeat the register. */
  const tabCounts: Partial<Record<SectionId, number>> = {
    priority: priority.length,
    works: works.length,
    register: items.length,
    specs: specs.length,
  }

  const tabs: TabItem<SectionId>[] = SECTIONS.map((entry) => {
    const count = tabCounts[entry.id]
    return { id: entry.id, label: entry.tab, ...(count !== undefined && { count }) }
  })

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

            {/* Above the tabs, deliberately: the headline figures answer "where am
              * I" and belong on every view rather than behind a click. */}
            <BudgetTiles summary={summary} />

            <div className="mt-10">
              <Tabs items={tabs} active={active} onSelect={selectTab} label="Dashboard views" />
            </div>

            <Panel id="priority" active={active}>
              <PriorityBoard
                rows={priority}
                outlook={priorityOutlook}
                levels={priorityLevels}
                lowRows={lowRows}
                low={low}
              />
            </Panel>

            <Panel id="spend" active={active}>
              <SpendChart items={items} />
            </Panel>

            <Panel
              id="works"
              active={active}
              note="Lines a contractor has billed, kept apart from the appliances still being shopped for."
            >
              <WorksLedger rows={works} />
            </Panel>

            <Panel id="register" active={active}>
              <ItemRegister items={items} />
            </Panel>

            <Panel id="specs" active={active}>
              <UtilitySpecs specs={specs} />
            </Panel>
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

/** One tab's contents. Renders nothing at all unless it is the active tab —
 *  cheaper than hiding it, and it keeps each panel's own state (the register's
 *  filters, say) from surviving invisibly. */
function Panel({
  id,
  active,
  note,
  children,
}: {
  id: SectionId
  active: SectionId
  note?: string
  children: ReactNode
}) {
  if (id !== active) return null

  const heading = SECTIONS.find((entry) => entry.id === id)?.heading ?? id

  return (
    <section
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      /* Focusable so that tabbing off the strip lands in the panel, which is how
       * the ARIA pattern expects a panel to be reached. */
      tabIndex={0}
      className="mt-8"
    >
      <h2 className="font-display text-2xl">{heading}</h2>
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
