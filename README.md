# Renovation Dashboard

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
  App.tsx           masthead, sticky header, section shell
  data/
    taxonomy.ts     Room / Priority / Status unions, aliases, colour maps
    source.ts       sheet id and CSV endpoints
    site.ts         copy constants, section order
  hooks/
    useSheet.ts     the fetch: both tabs, abortable, reloadable
    useScrolledPast.ts  header-collapse trigger
  lib/
    csv.ts          RFC 4180 parser
    money.ts        Cents type, parsing and formatting
    text.ts         cell cleaning, markdown stripping, linkify
    sheet.ts        CSV -> Item[] + problems. The untrusted boundary.
    items.ts        item-level predicates and sorting
    totals.ts       summary, per-room, works/open partition
    cuts.ts         slice items by one dimension for the bar charts
  components/       one directory per component, index.tsx
  styles/
    index.css       imports tailwind, then theme, then base
    theme.css       @theme token block — the palette lives here
    base.css        element defaults, reduced-motion, print
public/             static assets
```

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

```sh
npm run build      # -> dist/
```

`dist/` is entirely static. Nothing in it holds a secret: the sheet id is public
by necessity, since the browser is the thing fetching it.
