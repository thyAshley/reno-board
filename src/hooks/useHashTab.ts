import { useCallback, useEffect, useState } from 'react'

/** Keeps the active tab in the URL hash.
 *
 *  Why the hash rather than plain component state: a tab is a place. Putting it
 *  in the URL means `#specs` opens the specs tab from a bookmark or a link, the
 *  back button walks back through the tabs you visited, and a refresh leaves you
 *  where you were instead of throwing you back to the first tab. None of that
 *  needs a router — there is one axis of navigation on this page.
 *
 *  `tabs` must be a stable array (see TAB_IDS in data/site.ts); it is a
 *  subscription dependency, so a new identity each render would resubscribe.
 */
function readHash<T extends string>(tabs: readonly T[]): T | undefined {
  const id = window.location.hash.replace(/^#/, '')
  return tabs.find((tab) => tab === id)
}

export function useHashTab<T extends string>(tabs: readonly T[], fallback: T): [T, (tab: T) => void] {
  const [active, setActive] = useState<T>(() => readHash(tabs) ?? fallback)

  useEffect(() => {
    const sync = () => setActive(readHash(tabs) ?? fallback)

    // popstate covers the back and forward buttons over the entries pushed
    // below; hashchange covers someone editing the hash in the address bar.
    // pushState itself fires neither, which is why select() sets state directly.
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [tabs, fallback])

  const select = useCallback((tab: T) => {
    setActive(tab)
    /* pushState, not `location.hash = tab`. Assigning the hash would make the
     * browser scroll to whatever element carries that id — yanking the page down
     * to the panel heading every time a tab is clicked. */
    window.history.pushState(null, '', `#${tab}`)
  }, [])

  return [active, select]
}
