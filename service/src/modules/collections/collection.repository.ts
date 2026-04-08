import { prisma } from '../../database/prisma-client.js'
import type { PaginationQuery } from '../../shared/pagination.js'
import type { CreateCollectionInput, UpdateCollectionInput } from './collection.validation.js'

// Every query is filtered by userId (the owner), so a user can never read or change someone else's collection.

export function createCollection(userId: string, input: CreateCollectionInput) {
  return prisma.collection.create({ data: { userId, ...input } })
}

/** Returns null when the collection doesn't exist OR belongs to someone else. */
export function findOwnedCollection(userId: string, collectionId: string) {
  return prisma.collection.findFirst({ where: { id: collectionId, userId } })
}

export function listCollections(userId: string, { limit, offset }: PaginationQuery) {
  return prisma.collection.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  })
}

export function countCollections(userId: string) {
  return prisma.collection.count({ where: { userId } })
}

export function updateCollection(collectionId: string, changes: UpdateCollectionInput) {
  return prisma.collection.update({ where: { id: collectionId }, data: changes })
}

/** Trackers inside are kept; the database sets their collectionId to null. */
export function deleteCollection(collectionId: string) {
  return prisma.collection.delete({ where: { id: collectionId } })
}

/**
 * For each collection: how many trackers it has, and how many are opened.
 * Two grouped queries for the whole page, instead of two queries per collection.
 */
export async function countTrackersByCollection(collectionIds: string[]) {
  const [totals, opened] = await Promise.all([
    prisma.tracker.groupBy({
      by: ['collectionId'],
      where: { collectionId: { in: collectionIds } },
      _count: { _all: true },
    }),
    prisma.tracker.groupBy({
      by: ['collectionId'],
      where: { collectionId: { in: collectionIds }, openedAt: { not: null } },
      _count: { _all: true },
    }),
  ])

  const counts = new Map<string, { total: number; opened: number }>()
  for (const id of collectionIds) counts.set(id, { total: 0, opened: 0 })
  for (const row of totals) if (row.collectionId) counts.get(row.collectionId)!.total = row._count._all
  for (const row of opened) if (row.collectionId) counts.get(row.collectionId)!.opened = row._count._all
  return counts
}
