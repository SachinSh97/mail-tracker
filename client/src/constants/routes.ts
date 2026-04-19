// Every URL in the app, in one place.
//   ROUTES → the patterns the router matches (used only in router.tsx)
//   paths  → build a real link from those patterns: paths.tracker('abc') → "/trackers/abc"

export const ROUTES = {
  home: '/',
  /** Optional ?collection=<id> pre-selects a collection */
  addTracker: '/track',
  /** :collectionId can be "none" = trackers that aren't in any collection */
  collection: '/collections/:collectionId',
  tracker: '/trackers/:trackerId',
  /** Google sends the browser back here after sign-in. Must be listed in Google Cloud Console. */
  authCallback: '/auth/callback',
  notFound: '*',
} as const

export const paths = {
  home: () => ROUTES.home,

  addTracker: (collectionId?: string) =>
    collectionId ? `${ROUTES.addTracker}?collection=${encodeURIComponent(collectionId)}` : ROUTES.addTracker,

  collection: (collectionId: string) => `/collections/${encodeURIComponent(collectionId)}`,

  tracker: (trackerId: string) => `/trackers/${encodeURIComponent(trackerId)}`,
}
