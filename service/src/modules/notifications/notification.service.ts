import { paginated, type PaginatedResponse, type PaginationQuery } from '../../shared/pagination.js'
import * as notificationRepository from './notification.repository.js'

// What the API returns for one notification
export interface NotificationResponse {
  /** The hit's id */
  id: string
  /** true for the first open of the email, false when it was opened again */
  firstOpen: boolean
  /** When it was opened */
  createdAt: Date
  /** Opened after the user last looked at their notifications */
  unread: boolean
  tracker: {
    id: string
    name: string
    emailSubject: string | null
    recipientEmails: string[]
    collection: { id: string; name: string } | null
  }
}

/** Newest first. Each item says whether it's unread. */
export async function listNotifications(
  userId: string,
  query: PaginationQuery,
): Promise<PaginatedResponse<NotificationResponse>> {
  const [{ hits, total }, seenAt] = await Promise.all([
    notificationRepository.listNotifications(userId, query),
    notificationRepository.findSeenAt(userId),
  ])

  const items = hits.map((hit) => ({
    id: hit.id,
    firstOpen: hit.outcome === 'COUNTED_AS_OPEN',
    createdAt: hit.createdAt,
    unread: !seenAt || hit.createdAt > seenAt,
    tracker: hit.tracker,
  }))
  return paginated(items, query, total)
}

/** How many notifications arrived since the user last looked: the number on the bell. */
export async function countUnread(userId: string): Promise<{ count: number }> {
  const seenAt = await notificationRepository.findSeenAt(userId)
  return { count: await notificationRepository.countNotificationsAfter(userId, seenAt) }
}

/**
 * Marks notifications up to `seenUntil` as read. The web app sends the time of the newest
 * notification it actually showed, so one that arrives a moment later still counts as new.
 * A time in the future is treated as "now".
 */
export async function markSeen(userId: string, seenUntil: Date): Promise<void> {
  const now = new Date()
  await notificationRepository.markSeenUntil(userId, seenUntil > now ? now : seenUntil)
}
