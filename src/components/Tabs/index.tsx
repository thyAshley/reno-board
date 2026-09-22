import { useRef, type KeyboardEvent } from 'react'

/* The tab strip. Presentational: it knows which tab is active and how to ask for
 * another, and nothing about the panels themselves.
 *
 * Built to the WAI-ARIA tabs pattern, which is more than role attributes:
 *
 *  - Roving tabindex. Only the active tab is in the page's tab order, so Tab
 *    moves *past* the strip to the panel rather than stopping on all five.
 *  - Arrow keys move between tabs, Home and End jump to the ends.
 *  - Selection follows focus. That is the right choice here because switching
 *    panels is instant — the data is already loaded — so there is nothing to be
 *    gained by making keyboard users press Enter to confirm.
 *
 * Without this a tab strip is five buttons that happen to look like tabs.
 */
export interface TabItem<T extends string> {
  id: T
  label: string
  /** Shown beside the label when there is a count worth advertising. */
  count?: number
}

export default function Tabs<T extends string>({
  items,
  active,
  onSelect,
  label,
}: {
  items: readonly TabItem<T>[]
  active: T
  onSelect: (id: T) => void
  label: string
}) {
  const refs = useRef(new Map<T, HTMLButtonElement>())

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = items.findIndex((item) => item.id === active)
    if (index === -1) return

    const target = (() => {
      switch (event.key) {
        case 'ArrowRight':
          return items[(index + 1) % items.length]
        case 'ArrowLeft':
          return items[(index - 1 + items.length) % items.length]
        case 'Home':
          return items[0]
        case 'End':
          return items[items.length - 1]
        default:
          return undefined
      }
    })()

    if (target === undefined) return
    // Stops ArrowLeft/Right and Home/End from also scrolling the page.
    event.preventDefault()
    onSelect(target.id)
    refs.current.get(target.id)?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      /* Scrolls sideways rather than wrapping on a narrow phone: a tab strip that
       * reflows onto two lines stops reading as one control. */
      className="-mb-px flex gap-x-1 overflow-x-auto border-b border-cream-300"
    >
      {items.map((item) => {
        const selected = item.id === active

        return (
          <button
            key={item.id}
            ref={(node) => {
              if (node === null) refs.current.delete(item.id)
              else refs.current.set(item.id, node)
            }}
            type="button"
            role="tab"
            id={`tab-${item.id}`}
            aria-selected={selected}
            aria-controls={`panel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(item.id)}
            className={[
              'shrink-0 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition-colors',
              selected
                ? 'border-ember-500 font-medium text-walnut-900'
                : 'border-transparent text-walnut-600 hover:border-cream-300 hover:text-walnut-900',
            ].join(' ')}
          >
            {item.label}
            {item.count !== undefined && (
              <span
                className={[
                  'ml-2 font-mono text-[11px]',
                  selected ? 'text-ember-600' : 'text-walnut-400',
                ].join(' ')}
              >
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
