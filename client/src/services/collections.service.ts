import { NO_COLLECTION_ID, NO_COLLECTION_NAME } from '../constants/collections'
import { request } from './http'
import { trackersService } from './trackers.service'
import type { Collection, Paginated } from './types'

/** What a collection screen shows at the top: a name and its counts */
export interface CollectionSummary {
  name: string
  trackerCount: number
  openedCount: number
}

export const collectionsService = {
  /** The user's collections, newest first (up to 100) */
  async list(signal?: AbortSignal): Promise<Collection[]> {
    const page = await request<Paginated<Collection>>('/collections?limit=100', { signal })
    return page.items
  },

  create(name: string) {
    return request<Collection>('/collections', { method: 'POST', body: { name } })
  },

  rename(id: string, name: string) {
    return request<Collection>(`/collections/${id}`, { method: 'PATCH', body: { name } })
  },

  /** Deletes the collection only. Its trackers keep working, outside any collection. */
  remove(id: string) {
    return request<void>(`/collections/${id}`, { method: 'DELETE' })
  },

  /** Counts for trackers that aren't in any collection */
  async countLooseTrackers(signal?: AbortSignal): Promise<Omit<CollectionSummary, 'name'>> {
    const [all, opened] = await Promise.all([
      trackersService.list({ collectionId: NO_COLLECTION_ID, limit: 1 }, signal),
      trackersService.list({ collectionId: NO_COLLECTION_ID, status: 'opened', limit: 1 }, signal),
    ])
    return { trackerCount: all.pagination.total, openedCount: opened.pagination.total }
  },

  /** Name and counts for a collection, or for the "Not in a collection" group when id is "none" */
  async getSummary(id: string, signal?: AbortSignal): Promise<CollectionSummary> {
    if (id === NO_COLLECTION_ID) {
      return { name: NO_COLLECTION_NAME, ...(await collectionsService.countLooseTrackers(signal)) }
    }
    return request<Collection>(`/collections/${id}`, { signal })
  },

  /** Everything the home screen lists: all collections, plus counts for trackers outside them */
  async getOverview(signal?: AbortSignal) {
    const [collections, loose] = await Promise.all([
      collectionsService.list(signal),
      collectionsService.countLooseTrackers(signal),
    ])
    return { collections, loose }
  },
}
