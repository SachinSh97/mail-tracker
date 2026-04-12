import { prisma } from '../../database/prisma-client.js'
import type { Prisma } from '../../generated/prisma/client.js'
import type { ListTrackersQuery } from './tracker.validation.js'

// Every query is filtered by userId (the owner), so a user can never read or change someone else's tracker.

// Fields returned for a tracker (creatorIp is internal and never sent to clients)
const trackerFields = {
  id: true,
  name: true,
  emailSubject: true,
  recipientEmails: true,
  createdAt: true,
  openedAt: true,
  collection: { select: { id: true, name: true } },
} satisfies Prisma.TrackerSelect

// How many hits to include when showing one tracker
const RECENT_HITS_LIMIT = 100

export interface NewTracker {
  id: string
  userId: string
  name: string
  emailSubject: string | null
  recipientEmails: string[]
  collectionId: string | null
  creatorIp: string | null
}

export function createTracker(data: NewTracker) {
  return prisma.tracker.create({ data, select: trackerFields })
}

/** Returns null when the tracker doesn't exist OR belongs to someone else. */
export function findOwnedTracker(userId: string, trackerId: string) {
  return prisma.tracker.findFirst({ where: { id: trackerId, userId }, select: trackerFields })
}

/** Same as findOwnedTracker, plus its most recent hits. */
export function findOwnedTrackerWithHits(userId: string, trackerId: string) {
  return prisma.tracker.findFirst({
    where: { id: trackerId, userId },
    select: {
      ...trackerFields,
      hits: {
        select: { id: true, outcome: true, ipAddress: true, userAgent: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: RECENT_HITS_LIMIT,
      },
    },
  })
}

export async function listTrackers(userId: string, query: ListTrackersQuery) {
  const where = buildListFilter(userId, query)
  const [trackers, total] = await Promise.all([
    prisma.tracker.findMany({
      where,
      select: trackerFields,
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: query.offset,
    }),
    prisma.tracker.count({ where }),
  ])
  return { trackers, total }
}

export function updateTracker(trackerId: string, changes: Prisma.TrackerUncheckedUpdateInput) {
  return prisma.tracker.update({ where: { id: trackerId }, data: changes, select: trackerFields })
}

/** Its hits are deleted too (cascade). */
export function deleteTracker(trackerId: string) {
  return prisma.tracker.delete({ where: { id: trackerId } })
}

function buildListFilter(userId: string, query: ListTrackersQuery): Prisma.TrackerWhereInput {
  const where: Prisma.TrackerWhereInput = { userId }

  if (query.collectionId === 'none') where.collectionId = null
  else if (query.collectionId) where.collectionId = query.collectionId

  if (query.status === 'opened') where.openedAt = { not: null }
  if (query.status === 'not-opened') where.openedAt = null

  return where
}

export type TrackerRecord = NonNullable<Awaited<ReturnType<typeof findOwnedTracker>>>
export type TrackerWithHitsRecord = NonNullable<Awaited<ReturnType<typeof findOwnedTrackerWithHits>>>
