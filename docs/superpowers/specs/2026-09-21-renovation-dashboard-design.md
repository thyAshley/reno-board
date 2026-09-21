# Renovation Dashboard — Design

**Date:** 2026-09-21
**Status:** Approved
**Project:** Void Deck Dreams renovation dashboard, rebuilt as a maintainable project

## 1. Purpose

A public, single-page dashboard documenting the renovation of one 4-room HDB
flat: what it costs, what work has been done, and what is still to buy. It
exists to give readers an honest picture of what a first flat actually costs.

A working version already exists as a Claude artifact, recovered to
`reference/original-dashboard.js` (41 KB) and
`reference/original-dashboard.css` (18 KB). It is a single vanilla-JS IIFE
with all data hardcoded inline, no build step, and no persistence.

This project rebuilds it with the same content and behaviour as a real
codebase: data separated from presentation, logic separated from rendering,
and a test suite. Visual output should be recognisably the same site.

### Goals

- Update a price or add a milestone by editing one typed data file.
- Catch a mistyped category or a missing field at build time, not on the page.
- Derive every displayed figure from the data, so no number can go stale.
- Cover the arithmetic and the interactions with tests.
- Cut the payload by moving 2.4 MB of inlined base64 video to real assets.

### Non-goals

No backend, database, CMS, or authentication. No multi-project or multi-user
support. No chart library. No dark mode. No internationalisation. The contact
form stays `mailto:`-based.

## 2. Stack

| Concern | Choice |
|---|---|
| Build | Vite, `base: './'` (host-agnostic static output) |
| Language | TypeScript, `strict: true` |
| UI | React 19, function components |
| Styling | Tailwind v4, CSS-first `@theme` tokens |
| Fonts | Self-hosted via `@fontsource` |
| Testing | Vitest + React Testing Library + jsdom |

Tailwind v4's `@theme` is required rather than incidental: the floor-plan and
mascot SVGs set fills as `var(--color-terracotta-500)`, and `@theme` emits real
custom properties *and* generates matching utilities from one definition, so
`bg-terracotta-500` and the raw variable cannot drift apart.

## 3. Project layout

```
index.html
vite.config.ts
tsconfig.json
package.json
src/
  main.tsx
  App.tsx
  data/
    taxonomy.ts      Category, Room, Group, WishCategory unions + colour maps
    items.ts         ITEMS
    trades.ts        TRADES
    milestones.ts    MILESTONES
    wishlist.ts      WISHLIST
    site.ts          contact email, links, copy constants
  lib/
    money.ts  totals.ts  cuts.ts  sort.ts  schedule.ts  mascot.ts
  components/
    Masthead/  Mascot/  Disclaimer/  Tiles/  Timeline/
    ExpenseChart/  TradesLedger/  ItemRegister/  Wishlist/
    FloorPlan/  Contact/  Tooltip/  Chips/
  styles/
    theme.css        @theme token block
    base.css         element defaults, print rules
public/
  mascot-alpha.webm  mascot-masked.mp4
tests/
  lib/*.test.ts
  components/*.test.tsx
reference/           recovered original, not built or shipped
```

Each component directory holds `index.tsx` plus its own test where it has
behaviour. Components receive data as props and contain no arithmetic.

## 4. Data model

### 4.1 Money

All money is stored as **integer cents** (`type Cents = number`) and formatted
only at the render edge. The original sums floats (`629.50`, `239.13`,
`141.75`) and formats to two decimal places, which will eventually display a
total a cent away from the sum of its parts.

`money.ts` owns every conversion and every format:

```ts
export type Cents = number

export function formatSGD(c: Cents): string          // 447900 -> "4,479.00"
export function formatSGD0(c: Cents): string         // 447900 -> "4,479"
export function formatAccounting(c: Cents): string   // negative -> "(1,200.00)", zero -> "—"
export function formatContra(c: Cents): string       // 120000 -> "(1,200.00)", zero -> "—"
```

Formatting uses `en-SG` grouping, matching the original. The `S$` prefix is
applied by callers, as in the original, because some contexts omit it.

### 4.2 Taxonomy

Categories, rooms, groups and wishlist categories are string-literal unions.
Colour maps are exhaustive `Record`s keyed by those unions.

```ts
export type Category = 'Kitchen' | 'Laundry' | 'Climate' | 'Lighting' | 'Cleaning'
export type Room     = 'Kitchen & service yard' | 'Whole flat' | 'Master bedroom'
export type Group    = 'Appliances' | 'Renovation works'
                     | 'Bathroom & toilet fittings' | 'Lighting' | 'Furnishings'

export const CATEGORY_COLOUR: Record<Category, string>
export const ROOM_COLOUR:     Record<Room, string>
export const GROUP_COLOUR:    Record<Group, string>
```

This closes two real defects in the original:

- `CATCOL[...]` yields `undefined` for any unmapped category, producing a bar
  with no colour and no error.
- The supplier cut computes its colour as
  `CATCOL[ITEMS.find(i => i.vendor === k).cat]`, which throws outright if a
  vendor has no matching item.

`Room` is the **spend-attribution** dimension and is deliberately coarser than
the floor plan's geometry. The plan draws eight spaces (main bedroom, two
baths, kitchen and yard, bedrooms 2 and 3, store, living room); the data
attributes spend to only three, one of which — `Whole flat` — is not a drawable
space at all. §6 covers how the plan reconciles the two.

### 4.3 Items

```ts
export interface Item {
  id: string          // stable slug, used as React key
  item: string        // display name, plain text
  cat: Category
  room: Room
  vendor: string
  grp: Group
  gross: Cents        // invoice price
  disc: Cents         // trade discount, rebate or promotion, positive
  dim?: string        // "685 W × 738 D × 1833 H", omitted when not applicable
}
```

`net` is **derived** (`gross - disc`), never stored. The original mutates the
source array at load (`ITEMS.forEach(i => i.amt = i.gross - i.disc)`), which
makes the dataset depend on module evaluation order.

All **27** item rows carry over unchanged in content. Two rows are
intentionally degenerate and must keep working: the Gain City GroupBuy line
(`gross: 0`, `disc: 120000`) is a pure credit, and the free food warmer
(`gross: 49900, disc: 49900`) nets to zero.

`dim` becomes optional rather than the original's mix of `''` and
`'not published'`/`'not stated'`. Where the original carried a real phrase
like `'not published'`, that phrase is preserved as the value; where it
carried `''`, the field is omitted and the table renders an em dash.

Note that `dim` values in the original contain `&middot;` HTML entities. These
become literal `·` characters in the data, since React escapes text.

### 4.4 Trades

```ts
export interface Trade {
  id: string
  label: string
  amount?: Cents   // absent until quoted
  note?: string    // who quoted it and what it covers
}
```

All 13 trades are currently unquoted. The ledger must render its empty state
correctly, and the works total must be `0` rather than `NaN`.

### 4.5 Milestones

```ts
export interface Milestone {
  id: string
  when: string     // display label, e.g. "21 to 23 Sep" or "Dates to come"
  what: string
  why?: string     // plain text, no markup
  from?: string    // ISO date, Asia/Singapore
  to?: string      // ISO date, Asia/Singapore
}
```

`from`/`to` are both present or both absent. All 12 milestones carry over.

### 4.6 Wishlist

Restructured from the original's `[room, html, category]` tuples into fields.
The original embeds `<b>` and `<em>` inside the string, which in React would
require `dangerouslySetInnerHTML` on every row:

```ts
export interface Wish {
  id: string
  room: string          // free text; wishlist rooms are not yet built
  title: string         // rendered bold
  note?: string         // rendered italic
  category: WishCategory
}
```

The split point is the original markup: `<b>` content becomes `title`, `<em>`
content becomes `note`. Where an entry's bold text contains trailing prose
outside both tags, that prose joins `title`. All 19 entries carry over.

`WishCategory` is a union of the seven categories present in the data
(`Kitchen`, `Bathroom`, `Dining`, `Lighting`, `Fans and ventilation`,
`Laundry`, `Doors and windows`).

### 4.7 Dropped

`TL`, the six-entry array at line 71 of the original, is dead code: it is
superseded by `MILESTONES` and never rendered. It is not carried over.

## 5. Derived layer

Pure functions, no React, no I/O, no clock access. This is the layer the test
suite targets first.

### `totals.ts`

```ts
grossTotal(items): Cents
discountTotal(items): Cents
netTotal(items): Cents              // grossTotal - discountTotal
worksTotal(trades): Cents           // sum of quoted amounts, 0 if none
quotedTradeCount(trades): number
netByRoom(items): Record<Room, Cents>
```

### `cuts.ts`

```ts
type CutKey = 'grp' | 'cat' | 'room' | 'vendor'

interface CutRow {
  key: string
  value: Cents
  colour: string
  count: number    // contributing lines
  pct: number      // share of the cut's denominator
}

cutBy(key: CutKey, items: Item[], trades: Trade[]): CutRow[]
```

Behaviour preserved from the original, including its asymmetry:

- The `grp` cut lists **all five groups in fixed order**, including zero rows,
  and injects `worksTotal(trades)` as the `Renovation works` group. Its
  denominator is the sum of the rows.
- The `cat`, `room` and `vendor` cuts are **derived from the data**, exclude
  zero rows, and sort by value descending. Their denominator is `netTotal`.

`pct` is computed against that cut's own denominator. A denominator of zero
yields `pct: 0`, not `NaN`.

### `sort.ts`

```ts
type SortKey = 'item' | 'cat' | 'room' | 'vendor' | 'gross' | 'disc' | 'net'
sortItems(items, key: SortKey, dir: 1 | -1): Item[]
nextSortState(current, key): { key: SortKey; dir: 1 | -1 }
```

Numeric keys compare numerically, text keys by `localeCompare`. Returns a new
array. `nextSortState` reproduces the original rule: clicking the active
column flips direction; clicking a new column starts descending for money
columns (`gross`, `disc`, `net`) and ascending for text columns. Initial state
is `gross` descending.

### `schedule.ts`

```ts
type MilestoneStatus = 'done' | 'now' | 'next' | 'scheduled' | 'later'

interface DatedMilestone extends Milestone {
  status: MilestoneStatus
  label: string    // "Done" | "Today" | "In progress" | "Up next" | "Scheduled" | "Not dated yet"
}

statusOf(milestones: Milestone[], today: string): DatedMilestone[]
todayInSingapore(now?: Date): string   // "YYYY-MM-DD"
```

`statusOf` takes `today` as an argument and never reads the clock. The
original calls `new Date()` inline, so any test asserting "Hacking is in
progress" would pass in the week of writing and fail afterwards. Only
`todayInSingapore` touches the clock, and `App` calls it once.

Status rules, preserved exactly, evaluated in array order:

1. No `from` → `later`, label `Not dated yet`.
2. `today > to` → `done`.
3. `today >= from` → `now`; label `Today` if `from === to`, else `In progress`.
4. Otherwise future: the **first** such milestone in array order is `next`
   with label `Up next`; every later one is `scheduled` with label
   `Scheduled`. Both render with the same visual treatment, as in the original.

ISO date strings compare correctly with `>` and `>=`, so no date parsing is
needed. The `next` flag is claimed in array order and is not reset by
intervening undated milestones.

## 6. Components

State is local to the section that owns it. There is no global store, because
nothing needs to be shared: `ExpenseChart` owns `cut`, `ItemRegister` owns
`filter` and sort state, `Wishlist` owns its category filter.

| Component | Behaviour |
|---|---|
| `Masthead` | Eyebrow, title, standfirst, desktop-viewing note, contact anchor |
| `Mascot` | Three-route animation, see §7 |
| `Disclaimer` | Static liability text |
| `Tiles` | Four KPIs, count-up animation |
| `Timeline` | Ordered list from `statusOf`, `aria-current="step"` on `now` |
| `ExpenseChart` | Cut chips, bars, derived tick scale |
| `TradesLedger` | Quoted trades table, or empty-state note, plus grand total |
| `ItemRegister` | Category chips, sortable headers, totals row |
| `Wishlist` | Category chips, filtered list |
| `FloorPlan` | SVG plan with derived room totals |
| `Contact` | `mailto:` composer and copy-to-clipboard |
| `Chips` | Shared chip row used by the three filters |

### `Chips`

The original repeats near-identical chip markup and click handling three
times. One component, generic over its value type, preserving `aria-pressed`
and using buttons:

```tsx
<Chips<CutKey> options={...} value={cut} onChange={setCut} />
```

### `Tiles`

Four tiles: renovation works (lead), gross purchases, discounts, net cost.
Count-up animates over 1100 ms with a cubic ease-out, matching the original,
and is skipped entirely under `prefers-reduced-motion: reduce` — the final
value renders immediately. The works tile shows `Not quoted yet` when no trade
is quoted, otherwise `N of 13 trades priced`.

### `Tooltip`

A portal-rendered tooltip taking `ReactNode` content, positioned to follow the
cursor and clamped to the viewport as the original does
(`min(clientX + 16, innerWidth - 310)`).

**Accessibility fix:** the original binds `mousemove` and `mouseleave` only, so
the per-bar detail — amount, line count, share of total — is unreachable by
keyboard and to screen readers, even though the bars carry `tabIndex`. The new
component responds to focus and blur as well, and the tooltip is associated
via `aria-describedby`.

### `ItemRegister`

Sortable headers are real `<button>` elements inside `<th>`, carrying
`aria-sort`. The original puts `tabIndex` and key handlers on the `th` itself
and hand-rolls Enter/Space, which a button gives for free.

The totals row recomputes from the **filtered** rows, not the whole dataset.

### `FloorPlan`

The SVG geometry, viewBox (`-320 -320 12140 10620`) and room labels are
carried over as authored. The two amount labels become props fed from
`netByRoom`, and the `aria-label` sentence is generated from those same
numbers.

This fixes a live inconsistency: the visible label reads `S$2,619` while the
`aria-label` claims `S$2,919` for the main bedroom. Computed from the data, the
room holds one line — the LG Styler at `2919 − 300 = 2619` — so the visible
figure is correct and the alt text is stale.

Because `Room` is coarser than the plan geometry (§4.2), the plan labels only
those rooms that map to a drawn space and carry spend. On the current data that
is two: `Kitchen & service yard` at `S$13,104` and `Master bedroom` at
`S$2,619`. `Whole flat` holds `S$9,507.13` but is not a drawable space, so it
carries no plan label; that figure is reachable through the room cut of the
expense chart instead. A drawn space with no attributed spend renders no amount.

The mapping from `Room` to plan space is explicit in the component, not
inferred, so an unmapped room fails the type check rather than silently
vanishing from the plan.

### `Contact`

Preserved: topic `<select>`, validation requiring a non-empty message,
`mailto:` assembly with subject `Void Deck Dreams: <topic>` and a body footer
carrying name, reply-to and provenance, the transient hint that reverts after
9 s, and the copy button that falls back to `select it` when the clipboard API
is unavailable.

## 7. Mascot

The two videos are recovered as real files and committed:
`mascot-alpha.webm` (1,088,727 bytes) and `mascot-masked.mp4` (807,429 bytes).
Inlined as base64 in the original they occupy 2.4 MB of the JS payload,
uncacheable and parsed on every load. As files in `public/` they are cacheable
and lazily fetched.

The three-route fallback is load-bearing and is kept:

1. **VP9-alpha WebM**, where the browser can decode it.
2. **Canvas composite** for Apple/Safari, which cannot decode VP9 alpha. The
   MP4 is a 480×796 stacked sheet: colour on top, alpha mask below. The
   existing un-premultiply loop is carried over unchanged, including its
   `a < 18` cutoff and the `255/a` scaling.
3. **Hand-drawn SVG**, if autoplay is refused or nothing plays.

Route selection moves into `lib/mascot.ts` as a pure function of user-agent and
codec-support inputs, so it is testable without a browser:

```ts
chooseMascotRoute(input: {
  isApple: boolean
  canPlayVp9: boolean
}): 'webm' | 'canvas' | 'svg'
```

The component keeps the original's runtime escalation: the 2.5 s WebM
not-playing check, the 15 s canvas no-frame check, the blob-URL-then-direct
retry, and resuming on `visibilitychange`. The `#mascotdebug` hash logger is
dropped.

The SVG route is `aria-hidden`, as in the original — it is decoration.

## 8. Styling

Tokens in `styles/theme.css` as a Tailwind v4 `@theme` block, carrying the
original palette and fonts:

```css
@theme {
  --color-cream-50: #F7F0DD;
  --color-ink-900:  #3F2E1E;
  --color-caramel-500:    #B98A54;
  --color-terracotta-500: #BC6A34;
  --color-clay-600:       #7C6152;
  --color-gold-500:       #C79A4C;
  --color-sage-600:       #6F8367;
  --color-blush-500:      #E0A183;
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body:    'Kalam', 'Bradley Hand', cursive;
  --font-mono:    'Space Mono', ui-monospace, Menlo, monospace;
}
```

The eight above are the ones the charts and data views key off. The original
defines 22 colour tokens in total and references 20; the `@theme` block carries
over every token that is actually used, plus one addition and minus three:

- **`--color-caramel-600` must be added.** The original's mascot SVG shades its
  body with `fill="var(--caramel-600)"` at `opacity: 0.16`, but that token is
  never defined, so the fill resolves to the guaranteed-invalid value instead of
  caramel. Defining it as `#A17644`, interpolated between the defined
  `caramel-500` (`#B98A54`) and `caramel-700` (`#8A6234`), renders the shading
  as evidently intended.
- **`--clay-500`, `--gold-600` and `--sage-500` are defined but never
  referenced.** They are dropped; Tailwind would otherwise generate utilities
  for colours nothing uses.

Component styling is Tailwind utilities. The original's 18 KB stylesheet is
not ported verbatim; it is the reference for spacing, type scale and the
responsive rules, in particular the columns hidden below 640 px in the item
table and the `k` abbreviation on narrow tick labels.

Green accounting figures use `--color-sage-600`, and zero renders as an em
dash in `--color-ink-400`, matching the original.

`prefers-reduced-motion` suppresses the count-up and the bar-width transitions.
The original honours it for the count-up only.

Fonts are self-hosted through `@fontsource` rather than the original's single
Google Fonts request, removing a third-party render-blocking round trip on a
page whose look depends on all three faces arriving.

## 9. Testing

Test-driven: `lib/` specs are written before their implementations.

**`lib/` unit tests**

- `money`: grouping, two-decimal output, accounting parentheses for negatives,
  em dash for zero, contra formatting, cent-exact round trips.
- `totals`: gross/discount/net over the real dataset; net equals gross minus
  discount; `worksTotal` is `0` with no quoted trades; `netByRoom` sums to
  `netTotal`.
- `cuts`: each cut's rows sum to its denominator; `grp` includes zero rows in
  fixed order and injects works; other cuts exclude zeros and sort descending;
  `pct` is `0` rather than `NaN` when the denominator is `0`; every row has a
  defined colour.
- `sort`: direction toggles on repeat clicks; a new column starts descending
  for money and ascending for text; input array is not mutated.
- `schedule`: each status branch against fixed `today` values — before, first
  day, mid-range, last day, after; `Today` versus `In progress`; `Up next`
  claimed by the first future milestone only; undated entries always `later`
  and never claiming `next`.
- `mascot`: route selection for each input combination.

**Component tests**

- `Tiles`: renders the four figures; count-up skipped under reduced motion.
- `ItemRegister`: a category chip narrows the rows; the totals row matches the
  filtered subset; a header click reverses order; `aria-sort` tracks state.
- `ExpenseChart`: switching cut re-renders bars and moves `aria-pressed`.
- `Timeline`: `aria-current="step"` on the in-progress milestone only.
- `TradesLedger`: empty state with no quoted trades; table once one is quoted.
- `Wishlist`: category filter narrows the list.
- `FloorPlan`: room amounts and `aria-label` both come from the data and agree.
- `Contact`: empty message blocks submission and shows the error hint.

Assertions are on rendered output and accessible roles, not implementation
details. Money assertions use exact strings.

## 10. Build and deploy

`npm run build` emits static `dist/`. `base: './'` keeps the output portable
across GitHub Pages, Netlify, Cloudflare Pages and subpaths without
reconfiguration. No host-specific deploy config is added; the host is not yet
chosen.

Scripts: `dev`, `build`, `preview`, `test`, `test:watch`, `typecheck`, `lint`.

Acceptance: `npm run build` and `npm run typecheck` pass clean, `npm test`
passes, and the built page renders every section of the original with figures
matching the values below — except the main-bedroom `aria-label`, which is
corrected to `S$2,619`.

### Reference figures

Computed from the original dataset and asserted in the test suite, so any
transcription slip in `items.ts` fails a test rather than shipping:

| Figure | Value |
|---|---|
| Item rows | 27 |
| Gross purchases | `S$28,410.13` |
| Discounts | `(3,180.00)` |
| Net cost to date | `S$25,230.13` |
| Renovation works | `S$0` (0 of 13 trades priced) |
| Milestones | 12 |
| Wishlist entries | 19 |

By group: `Appliances` `22,334.00`, `Lighting` `2,896.13`, and
`Renovation works`, `Bathroom & toilet fittings` and `Furnishings` at nil — so
the group cut shows five rows, three of them zero.

By room: `Kitchen & service yard` `13,104.00`, `Whole flat` `9,507.13`,
`Master bedroom` `2,619.00`.

By category: `Kitchen` `10,285.00`, `Laundry` `5,438.00`, `Climate`
`5,252.00`, `Lighting` `2,896.13`, `Cleaning` `1,359.00`.

Five suppliers: Aqua Luxe, Best Denki, City Energy, Gain City, Sol Luminaire.

## 11. Risks

- **Visual drift.** Rebuilding 18 KB of hand-written CSS as utilities will not
  reproduce the original pixel for pixel. Parity is judged section by section
  against the reference, and the reference stays in the repo for comparison.
- **Mascot regression.** The canvas route is hard to verify automatically. The
  route chooser is unit-tested; the composite itself needs a manual check in
  Safari.
- **Wishlist re-splitting.** Turning inline markup into `title`/`note` is a
  manual reading of 19 entries and is the most likely place for a transcription
  slip. Entry count and category set are asserted against the original.
