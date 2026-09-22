import { useCallback, useEffect, useState } from 'react'
import { SHEET, csvUrlByGid, csvUrlByTab } from '../data/source'
import { parseSheet, parseUtilitySpecs, type Item, type UtilitySpec } from '../lib/sheet'
import type { Cents } from '../lib/money'

export interface SheetState {
  status: 'loading' | 'ready' | 'error'
  items: Item[]
  specs: UtilitySpec[]
  stated: { budget?: Cents; estimate?: Cents; actual?: Cents }
  /** Rows the parser rejected, or columns it could not find. Shown in a banner
   *  rather than thrown, so a single bad row does not blank the page. */
  problems: string[]
  error?: string
  fetchedAt?: Date
}

const INITIAL: SheetState = {
  status: 'loading',
  items: [],
  specs: [],
  stated: {},
  problems: [],
}

async function fetchCsv(url: string, signal: AbortSignal): Promise<string> {
  // no-store, because a cached CSV would defeat the point of reading live.
  const response = await fetch(url, { signal, cache: 'no-store', redirect: 'follow' })
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`)
  }
  return response.text()
}

/** Reads the sheet on mount. `reload` refetches without a page refresh. */
export function useSheet(): SheetState & { reload: () => void } {
  const [state, setState] = useState<SheetState>(INITIAL)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      setState((previous) => ({ ...previous, status: 'loading' }))

      try {
        const dataCsv = await fetchCsv(csvUrlByGid(SHEET.dataGid), controller.signal)
        const { items, stated, problems } = parseSheet(dataCsv)

        /* The specs tab is supporting material. If only it fails, the page is
         * still worth showing, so it degrades to a note instead of an error. */
        let specs: UtilitySpec[] = []
        const specProblems: string[] = []
        try {
          specs = parseUtilitySpecs(
            await fetchCsv(csvUrlByTab(SHEET.utilityTab), controller.signal),
          )
        } catch (error) {
          if (controller.signal.aborted) return
          specProblems.push(
            `Could not load the "${SHEET.utilityTab}" tab: ${describe(error)}.`,
          )
        }

        if (controller.signal.aborted) return
        setState({
          status: 'ready',
          items,
          specs,
          stated,
          problems: [...problems, ...specProblems],
          fetchedAt: new Date(),
        })
      } catch (error) {
        if (controller.signal.aborted) return
        setState({ ...INITIAL, status: 'error', error: describe(error) })
      }
    }

    void load()
    return () => controller.abort()
  }, [nonce])

  return { ...state, reload }
}

function describe(error: unknown): string {
  if (error instanceof TypeError) {
    // What a blocked request looks like: no status, no body.
    return 'the request was blocked or the network is unavailable'
  }
  return error instanceof Error ? error.message : String(error)
}
