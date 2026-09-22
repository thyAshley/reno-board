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

/* The sections the page renders, in order. App.tsx renders these headings and
 * ids; keeping the list here means the anchors and the section order have one
 * home. */
export const SECTIONS = [
  { id: "spend", heading: "Spend, cut three ways" },
  { id: "works", heading: "Renovation works billed" },
  { id: "register", heading: "Everything on the list" },
  { id: "specs", heading: "What each appliance needs at the wall" },
] as const;
