import { NO_COLLECTION_ID } from '../constants/collections'
import { collectionsService } from '../services/collections.service'
import { useQuery } from './useQuery'
import type { TrackerFilter } from './useTrackerFilter'

/** One collection: its name and counts, plus rename and delete */
export function useCollection(collectionId: string) {
  const { data: summary, ...query } = useQuery(`collection:${collectionId}`, (signal) =>
    collectionsService.getSummary(collectionId, signal),
  )

  /** How many emails each filter tab would show */
  const countsByFilter: Record<TrackerFilter, number> | undefined = summary && {
    all: summary.trackerCount,
    opened: summary.openedCount,
    'not-opened': summary.trackerCount - summary.openedCount,
  }

  async function rename(name: string) {
    await collectionsService.rename(collectionId, name)
    query.reload()
  }

  return {
    ...query,
    summary,
    countsByFilter,
    /** False for the "Not in a collection" group, which can't be renamed or deleted */
    isRealCollection: collectionId !== NO_COLLECTION_ID,
    rename,
    remove: () => collectionsService.remove(collectionId),
  }
}
