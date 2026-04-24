import { collectionsService } from '../services/collections.service'
import { useQuery } from './useQuery'

/** Home screen data: every collection plus the "Not in a collection" counts */
export function useCollectionsOverview() {
  const { data, ...query } = useQuery('collections-overview', collectionsService.getOverview)

  return {
    ...query,
    collections: data?.collections,
    looseTrackers: data?.loose,
    isEmpty: data !== undefined && data.collections.length === 0 && data.loose.trackerCount === 0,
  }
}
