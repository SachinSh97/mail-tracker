import { prisma } from '../../database/prisma-client.js'
import type { HitOutcome, Prisma } from '../../generated/prisma/client.js'
import type { PaginationQuery } from '../../shared/pagination.js'

// A notification is a real open of one of the user's emails: a hit that counted as the first open,
// or the email being opened again. They come straight from the hits table, so deleting a tracker
// also removes its notifications. Every query is filtered by the owner.

export const NOTIFYING_OUTCOMES: HitOutcome[] = ['COUNTED_AS_OPEN', 'ALREADY_OPENED']

function ownNotifications(userId: string, after?: Date | null): Prisma.HitWhereInput {
  return {
    outcome: { in: NOTIFYING_OUTCOMES },
    tracker: { userId },
    ...(after && { createdAt: { gt: after } }),
  }
}

export async function listNotifications(userId: string, { limit, offset }: PaginationQuery) {
  const where = ownNotifications(userId)
  const [hits, total] = await Promise.all([
    prisma.hit.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        outcome: true,
        createdAt: true,
        tracker: {
          select: {
            id: true,
            name: true,
            emailSubject: true,
            recipientEmails: true,
            collection: { select: { id: true, name: true } },
          },
        },
      },
    }),
    prisma.hit.count({ where }),
  ])
  return { hits, total }
}

export function countNotificationsAfter(userId: string, after: Date | null) {
  return prisma.hit.count({ where: ownNotifications(userId, after) })
}

export async function findSeenAt(userId: string): Promise<Date | null> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { notificationsSeenAt: true } })
  return user?.notificationsSeenAt ?? null
}

/**
 * Moves the "seen up to" mark forward to `seenUntil`, never backwards
 * (a slower request from another tab can't make old notifications unread again).
 */
export function markSeenUntil(userId: string, seenUntil: Date) {
  return prisma.user.updateMany({
    where: {
      id: userId,
      OR: [{ notificationsSeenAt: null }, { notificationsSeenAt: { lt: seenUntil } }],
    },
    data: { notificationsSeenAt: seenUntil },
  })
}
