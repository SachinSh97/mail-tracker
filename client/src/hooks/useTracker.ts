import { NO_COLLECTION_ID, NO_COLLECTION_NAME } from '../constants/collections'
import { paths } from '../constants/routes'
import { trackersService } from '../services/trackers.service'
import type { Hit, TrackerDetails } from '../services/types'
import { useQuery } from './useQuery'

// The service sends at most this many recent hits with a tracker
const MAX_HITS_RETURNED = 100

/** Hits that are real opens. Hits from you, bots, or right after creation are ignored. */
function isRealOpen(hit: Hit): boolean {
  return hit.outcome === 'COUNTED_AS_OPEN' || hit.outcome === 'ALREADY_OPENED'
}

function gmailSearchUrl(subject: string): string {
  return `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(`subject:"${subject}"`)}`
}

/** Everything the email screen shows, worked out from the raw tracker */
function describe(tracker: TrackerDetails) {
  const opens = tracker.hits.filter(isRealOpen) // newest first
  return {
    title: tracker.emailSubject ?? tracker.name,
    opened: tracker.status === 'opened',
    openCount: Math.max(opens.length, 1),
    /** True when there may be more opens than the service sent back */
    openCountIsCapped: opens.length >= MAX_HITS_RETURNED,
    lastOpenedAt: opens[0]?.createdAt ?? tracker.openedAt,
    gmailUrl: tracker.emailSubject ? gmailSearchUrl(tracker.emailSubject) : null,
    collectionPath: paths.collection(tracker.collection?.id ?? NO_COLLECTION_ID),
    collectionName: tracker.collection?.name ?? NO_COLLECTION_NAME,
  }
}

export type TrackerView = ReturnType<typeof describe>

/** One tracked email: its details and status, plus remove */
export function useTracker(trackerId: string) {
  const { data: tracker, ...query } = useQuery(`tracker:${trackerId}`, (signal) =>
    trackersService.get(trackerId, signal),
  )

  return {
    ...query,
    tracker,
    view: tracker && describe(tracker),
    remove: () => trackersService.remove(trackerId),
  }
}
