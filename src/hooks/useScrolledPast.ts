import { useEffect, useRef, useState, type RefObject } from 'react'

/** Watches a marker element and reports once it has left the viewport.
 *
 *  Used to tell whether the sticky bar in App has pinned: the marker sits at the
 *  end of the masthead, so the masthead leaving the viewport and the bar pinning
 *  are the same event.
 *
 *  Deliberately not `window.scrollY > n`. A scroll threshold has to be compared
 *  against a number that the header itself can perturb — anything that changes
 *  the document's height moves the trigger — and that coupling is what made an
 *  earlier resizing header flicker without stopping. An element's own visibility
 *  cannot drift that way. IntersectionObserver also reports off the compositor
 *  instead of on every scroll event, so there is no per-frame work.
 */
export function useScrolledPast<T extends HTMLElement>(): [RefObject<T | null>, boolean] {
  const marker = useRef<T | null>(null)
  const [past, setPast] = useState(false)

  useEffect(() => {
    const node = marker.current
    if (node === null) return

    // Older browsers without IntersectionObserver simply keep the full header.
    if (typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1]
        if (entry !== undefined) setPast(!entry.isIntersecting)
      },
      { threshold: 0 },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return [marker, past]
}
