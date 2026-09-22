/* Copy and configuration constants. Everything a reader sees that is not
 * derived from the renovation data lives here, so wording changes never
 * require touching a component. */

export const SITE = {
  eyebrow: "4-room HDB flat",
  title: "Renovation Dashboard",
  standfirst: "Cost and dashboard",
  viewingNote:
    "Best viewed on a wider screen; the tables scroll sideways on a phone.",

  /* TODO: set before deploying. Contact assembles a mailto: with
   * `${mailSubjectPrefix}${topic}` as the subject. */
  contactEmail: "hello@example.com",
  mailSubjectPrefix: "Renovation dashboard: ",

  contactTopics: [
    "A supplier recommendation",
    "A question about a price",
    "Something looks wrong",
    "Something else",
  ],
} as const;

/* The tabs the page renders, in order — the first is the one a visitor lands on.
 *
 * One home for three things that must agree: the tab strip's labels, each
 * panel's <h2>, and the URL hash that deep-links to it. `tab` is short because a
 * tab strip has no room for a sentence; `heading` is the full line, which the
 * panel itself still shows.
 */
export const SECTIONS = [
  { id: "priority", tab: "Buy next", heading: "What to buy next — high and medium priority" },
  { id: "spend", tab: "Spend", heading: "Spend, cut three ways" },
  { id: "works", tab: "Works", heading: "Renovation works billed" },
  { id: "register", tab: "Register", heading: "Everything on the list" },
  { id: "specs", tab: "Specs", heading: "What each appliance needs at the wall" },
] as const;

export type SectionId = (typeof SECTIONS)[number]["id"];

/* A module-level constant, not derived per render: useHashTab subscribes to the
 * window on this array, and a fresh identity each render would resubscribe each
 * render. */
export const TAB_IDS: readonly SectionId[] = SECTIONS.map((section) => section.id);
