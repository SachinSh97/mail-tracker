// Shapes returned by the Mail Tracker service (see service/src/modules).
// Dates arrive as ISO strings because they come through JSON.

export interface Paginated<T> {
  items: T[]
  pagination: { limit: number; offset: number; total: number }
}

export interface User {
  id: string
  email: string
  name: string | null
}

/** POST /auth/google: who signed in. The session itself arrives as an HttpOnly cookie. */
export interface SignInResponse {
  user: User
  expiresAt: string
}

export interface Collection {
  id: string
  name: string
  description: string | null
  trackerCount: number
  openedCount: number
  createdAt: string
  updatedAt: string
}

export type TrackerStatus = 'opened' | 'not-opened'

export interface Tracker {
  id: string
  name: string
  emailSubject: string | null
  recipientEmails: string[]
  collection: { id: string; name: string } | null
  status: TrackerStatus
  openedAt: string | null
  createdAt: string
  pixel: { url: string; html: string }
}

export type HitOutcome =
  'COUNTED_AS_OPEN' | 'ALREADY_OPENED' | 'IGNORED_GRACE_PERIOD' | 'IGNORED_OWNER' | 'IGNORED_BOT'

export interface Hit {
  id: string
  outcome: HitOutcome
  createdAt: string
}

export type TrackerDetails = Tracker & { hits: Hit[] }

export interface CreateTrackerInput {
  emailSubject?: string
  recipientEmails?: string[]
  collectionId?: string
}

/** One real open of one of your emails (GET /notifications) */
export interface Notification {
  id: string
  /** true the first time the email was opened, false when it was opened again */
  firstOpen: boolean
  createdAt: string
  /** Opened after you last looked at your notifications */
  unread: boolean
  tracker: Pick<Tracker, 'id' | 'name' | 'emailSubject' | 'recipientEmails' | 'collection'>
}

/** Pushed by the service over GET /live-events the moment one of your emails is opened */
export interface TrackerOpenedEvent {
  type: 'tracker-opened'
  trackerId: string
  notificationId: string
  firstOpen: boolean
  openedAt: string
}
