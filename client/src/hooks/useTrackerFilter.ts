import { useSearchParams } from 'react-router-dom'
import type { TrackerStatus } from '../services/types'

export type TrackerFilter = 'all' | TrackerStatus

export const TRACKER_FILTERS: { value: TrackerFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'opened', label: 'Opened' },
  { value: 'not-opened', label: 'Not opened' },
]

/**
 * The All / Opened / Not opened filter, stored in the URL (?show=opened)
 * so it survives going into an email and coming back.
 */
export function useTrackerFilter() {
  const [searchParams, setSearchParams] = useSearchParams()
  const show = searchParams.get('show')
  const filter: TrackerFilter = show === 'opened' || show === 'not-opened' ? show : 'all'

  function setFilter(next: TrackerFilter) {
    // replace: switching tabs shouldn't fill up the back button history
    setSearchParams(next === 'all' ? {} : { show: next }, { replace: true })
  }

  return [filter, setFilter] as const
}
