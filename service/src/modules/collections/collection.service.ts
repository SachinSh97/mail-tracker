import type { Collection } from '../../generated/prisma/client.js'
import { NotFoundError } from '../../shared/http-errors.js'
import { paginated, type PaginatedResponse, type PaginationQuery } from '../../shared/pagination.js'
import * as collectionRepository from './collection.repository.js'
import type { CreateCollectionInput, UpdateCollectionInput } from './collection.validation.js'

// What the API returns for a collection
export interface CollectionResponse {
  id: string
  name: string
  description: string | null
  trackerCount: number
  openedCount: number
  createdAt: Date
  updatedAt: Date
}

export async function createCollection(
  userId: string,
  input: CreateCollectionInput,
): Promise<CollectionResponse> {
  const collection = await collectionRepository.createCollection(userId, input)
  return toCollectionResponse(collection, { total: 0, opened: 0 })
}

export async function listCollections(
  userId: string,
  query: PaginationQuery,
): Promise<PaginatedResponse<CollectionResponse>> {
  const [collections, total] = await Promise.all([
    collectionRepository.listCollections(userId, query),
    collectionRepository.countCollections(userId),
  ])
  const counts = await collectionRepository.countTrackersByCollection(collections.map((c) => c.id))

  const items = collections.map((collection) => toCollectionResponse(collection, counts.get(collection.id)))
  return paginated(items, query, total)
}

export async function getCollection(userId: string, collectionId: string): Promise<CollectionResponse> {
  const collection = await getOwnedCollectionOrThrow(userId, collectionId)
  const counts = await collectionRepository.countTrackersByCollection([collection.id])
  return toCollectionResponse(collection, counts.get(collection.id))
}

export async function updateCollection(
  userId: string,
  collectionId: string,
  changes: UpdateCollectionInput,
): Promise<CollectionResponse> {
  await getOwnedCollectionOrThrow(userId, collectionId)
  const collection = await collectionRepository.updateCollection(collectionId, changes)
  const counts = await collectionRepository.countTrackersByCollection([collection.id])
  return toCollectionResponse(collection, counts.get(collection.id))
}

/** Deletes the collection only. Its trackers stay, as standalone trackers. */
export async function deleteCollection(userId: string, collectionId: string): Promise<void> {
  await getOwnedCollectionOrThrow(userId, collectionId)
  await collectionRepository.deleteCollection(collectionId)
}

/**
 * Also used by the trackers module before putting a tracker into a collection.
 * Someone else's collection gives the same 404 as a missing one, so ids can't be probed.
 */
export async function getOwnedCollectionOrThrow(userId: string, collectionId: string): Promise<Collection> {
  const collection = await collectionRepository.findOwnedCollection(userId, collectionId)
  if (!collection) throw new NotFoundError('Collection not found')
  return collection
}

function toCollectionResponse(
  collection: Collection,
  counts: { total: number; opened: number } = { total: 0, opened: 0 },
): CollectionResponse {
  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    trackerCount: counts.total,
    openedCount: counts.opened,
    createdAt: collection.createdAt,
    updatedAt: collection.updatedAt,
  }
}
