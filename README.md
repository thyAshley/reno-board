# Renovation Dashboard

**Live: <https://thyashley.github.io/reno-board/>**

A single static page for the renovation of one 4-room HDB flat: what it cost,
what has been ordered, and what is still to buy. Pure frontend — no backend,
database, or authentication.

The data lives in a Google Sheet. The page fetches it as CSV on every load, so
editing the sheet and refreshing the page is the whole publishing workflow.

## Running it

```sh
npm install
npm run dev        # http://localhost:5173
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Typechecks, then emits static `dist/` |
| `npm run preview` | Serves the built `dist/` locally |
| `npm run typecheck` | `tsc --noEmit` over app and config |
| `npm run lint` | ESLint |

`vite.config.ts` sets `base: './'`, so `dist/` drops onto GitHub Pages, Netlify,
Cloudflare Pages, or any subpath without reconfiguration.

## The data source

`src/data/source.ts` holds the sheet id and the two tabs it reads:

- **gid 0** — the item register. One row per appliance or renovation line.
- **"Utility Specs"** — what each appliance needs at the wall.

Both are fetched over CORS directly from `docs.google.com`; Google serves
`export?format=csv` with `access-control-allow-origin: *`, which is why no proxy
or build step is needed. **The sheet must be shared as "anyone with the link can
view"** or the fetch returns 403 and the page shows an error with a retry.

Columns are matched by header text, not position, so reordering columns in the
sheet is harmless. Renaming one is not — the patterns live in `COLUMNS` in
`src/lib/sheet.ts`.

A row with an unrecognised Priority, Room, or Status is **excluded from every
figure** and listed in a banner at the top of the page, rather than being counted
as zero or crashing the render.

### Rooms

The flat has seven spaces: Living Room, Kitchen, Master Bedroom, Guest Bedroom,
Study room, Bathrooms, and General (whole-flat spend — curtains, aircon,
electrical). `ROOM_ALIAS` in `src/data/taxonomy.ts` maps what the sheet says onto
those: rows filed under **Laundry** count as **Kitchen**, since the washer and
drying rack sit in the service yard off it rather than in a room of their own.
Matching ignores case and extra whitespace.

### A known wrinkle in the sheet

`Completed` lives in the **Priority** column, where it is really a status. No
code reads either column to answer "is this done" — `isSettled()` in
`src/lib/items.ts` derives it. Likewise the six `Renovation Cost` rows carry the
contractor's name in the **Brand** column and leave Retailer / Vendor as `NA`.

## Layout

```
index.html
src/
  main.tsx          entry; @fontsource imports, mounts App
  App.tsx           masthead, sticky header, tab strip, panels
  data/
    taxonomy.ts     Room / Priority / Status unions, aliases, colour maps
    source.ts       sheet id and CSV endpoints
    site.ts         copy constants, tab ids / labels / headings
  hooks/
    useSheet.ts     the fetch: both tabs, abortable, reloadable
    useScrolledPast.ts  header-collapse trigger
    useHashTab.ts   active tab <-> URL hash
  lib/
    csv.ts          RFC 4180 parser
    money.ts        Cents type, parsing and formatting
    text.ts         cell cleaning, markdown stripping, linkify
    sheet.ts        CSV -> Item[] + problems. The untrusted boundary.
    items.ts        item-level predicates and sorting
    totals.ts       summary, per-room, per-level, works/open partition
    cuts.ts         slice items by one dimension for the bar charts
  components/       one directory per component, index.tsx
    Tabs/           the tab strip; ARIA tabs pattern, arrow keys
    PriorityBoard/  what's left to buy, by room, with its own budget read
  styles/
    index.css       imports tailwind, then theme, then base
    theme.css       @theme token block — the palette lives here
    base.css        element defaults, reduced-motion, print
public/             static assets
```

## Tabs

The dashboard is five tabs, declared in order in `SECTIONS` (`src/data/site.ts`).
That one list drives the strip's short labels, each panel's `<h2>`, and the URL
hash, so the three can't disagree:

| Tab | What it is |
| --- | --- |
| **Buy next** | Everything outstanding, grouped by room and filterable to one |
| **Spend** | The same rows cut by room, priority and status |
| **Works** | Lines a contractor has billed |
| **Register** | Everything, filterable and sortable |
| **Specs** | What each appliance needs at the wall |

The budget tiles sit *above* the strip and show on every tab — they answer "where
am I", which shouldn't be behind a click.

The active tab lives in the URL hash, so `…/#register` deep-links to a tab, the
back button walks through the tabs visited, and a refresh stays put. Only the
active panel is mounted, which means **find-in-page and printing cover one tab at
a time** — the accepted cost of tabs here.

### Buy next

One list, **grouped by room** — because that's how the shopping happens: you fit
out a kitchen, not a priority level. Each room gets a heading with its own
outstanding total, count, and anything already committed there.

A row of chips above filters to **one room at a time**, so the tab isn't one long
scroll. Rooms are grouped once over the whole list and then *selected*, never
regrouped, so a room's totals read the same alone as they do alongside the others.
Only rooms that have something left to buy get a chip.

Priority still drives the *order*, not the grouping. Rows run `High`, then
`Medium`, then `Low`, and dearest first inside each level — sorted per level and
concatenated rather than in one pass, so a dear `Low` never outranks a cheap
`High` on a list about urgency. `TO_BUY` in `src/lib/totals.ts` is the one place
those levels are named; every row carries its level as a coloured badge, and the
breakdown line under the figures gives the per-level split.

The three figures — still to buy, already committed, budget after these — cover
**all three levels**, as does the tab's count badge, and they **follow the room
filter**. Both rules come from the same place: a figure that ignored `Low`, or
ignored the chips, would contradict the rows beneath it. The count badge on the
tab is the exception, since a strip can't show a filtered number.

"Budget after these" is still read against *every* row, filtered or not — money
committed in the bathroom doesn't come back when you narrow to the kitchen, which
is why `outlook()` takes both the subset and the full set.

The tab shows *outstanding* items, not every item ever prioritised. Because the
sheet overloads Priority to carry `Completed`, buying something moves it off this
list — what a "what next" view wants, but worth knowing before reading a room's
total as everything that room will ever cost.

## Conventions

- **Money is integer cents** (`Cents`) end to end, formatted only at the render
  edge. Never store or sum a float dollar amount. `parseMoney` builds cents from
  the digit string rather than multiplying a parsed float by 100, because
  `1.005 * 100` is `100.49999999999999`.
- **Derived, never stored.** Every figure on the page is computed from the sheet's
  rows. The sheet's own summary cells are formulas that can fall out of step with
  the rows beneath them, so nothing displayed reads from them.
- **Validate at the boundary, once.** `src/lib/sheet.ts` turns untrusted CSV into
  typed `Item`s; everything downstream can assume the unions hold.
- **Colours come from `@theme`.** Add a token in `src/styles/theme.css` and use
  the generated utility (`bg-ember-500`) or the variable
  (`var(--color-ember-500)`) in SVG fills. No one-off hex in components.
- **Components take data as props** and contain no arithmetic. That lives in
  `src/lib/`, as pure functions with no clock or I/O access.

### Palette

Warm wood and cream. Three families by role, all defined in
`src/styles/theme.css`:

| Family | Role |
| --- | --- |
| `cream-50…300` | paper — background, cards, stripes, borders |
| `walnut-400…950` | wood — text, headings, the header panel, muted figures |
| `oak` `brass` `ember` `sage` `blush` `denim` `plum` | accents — chart series and emphasis |

`ember-500` is the emphasis accent and the focus ring. `sage-600` carries
positive accounting figures; `walnut-400` carries the em dash on an absent one.

The walnut ramp is a lighter pecan/chestnut rather than espresso. The deep end
still carries cream text at AA: `walnut-900` against `cream-100` is 10.3:1.
Charts walk the accent ramp in a fixed order (`ember · oak · brass · sage ·
denim · plum · blush · walnut-600`) so two charts of the same data never disagree
on colour.

## Deploying

Pushing to `main` deploys. `.github/workflows/deploy.yml` typechecks, builds, and
publishes `dist/` to GitHub Pages at
<https://thyashley.github.io/reno-board/>; the run summary links the live URL
from the action's own output rather than a hardcoded string. To build locally:

```sh
npm run build      # -> dist/
```

Because the site is a *project* page it is served from the `/reno-board/`
subpath, which is why `vite.config.ts` sets `base: './'` — the assets resolve
relatively and the repo can be renamed without touching the build.

`dist/` is entirely static and holds no secret, but it is not private either: the
sheet id ships in the bundle, so anyone reading the source can fetch **every tab
and column of the spreadsheet**, not only the figures rendered here. Keep
anything that should not be public out of that sheet.
