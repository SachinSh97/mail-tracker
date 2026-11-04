import { collectionsService } from '../services/collections.service'
import { useLiveEvent } from './useLiveEvents'
import { useQuery } from './useQuery'

/** Home screen data: every collection plus the "Not in a collection" counts */
export function useCollectionsOverview() {
  const { data, ...query } = useQuery('collections-overview', collectionsService.getOverview)

  // Live: keep the "x of y opened" counts current
  useLiveEvent(() => query.reload())

  return {
    ...query,
    collections: data?.collections,
    looseTrackers: data?.loose,
    isEmpty: data !== undefined && data.collections.length === 0 && data.loose.trackerCount === 0,
  }
}
