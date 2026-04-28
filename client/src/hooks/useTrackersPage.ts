import { trackersService } from '../services/trackers.service'
import type { TrackerFilter } from './useTrackerFilter'
import { useQuery } from './useQuery'

export const TRACKERS_PAGE_SIZE = 50

interface Params {
  collectionId: string
  filter: TrackerFilter
  offset: number
}

/** One page (50) of a collection's trackers */
export function useTrackersPage({ collectionId, filter, offset }: Params) {
  const status = filter === 'all' ? undefined : filter
  const { data, ...query } = useQuery(`trackers:${collectionId}:${filter}:${offset}`, (signal) =>
    trackersService.list({ collectionId, status, limit: TRACKERS_PAGE_SIZE, offset }, signal),
  )

  return {
    ...query,
    trackers: data?.items,
    hasMore: data !== undefined && offset + data.items.length < data.pagination.total,
  }
}
