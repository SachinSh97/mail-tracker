import { request, toQueryString } from './http'
import type { CreateTrackerInput, Paginated, Tracker, TrackerDetails, TrackerStatus } from './types'

export interface ListTrackersParams {
  /** A collection id, or "none" for trackers that aren't in any collection */
  collectionId: string
  status?: TrackerStatus
  limit?: number
  offset?: number
}

export const trackersService = {
  list(params: ListTrackersParams, signal?: AbortSignal) {
    return request<Paginated<Tracker>>(`/trackers?${toQueryString({ ...params })}`, { signal })
  },

  /** One tracker, including its most recent hits */
  get(id: string, signal?: AbortSignal) {
    return request<TrackerDetails>(`/trackers/${id}`, { signal })
  },

  create(input: CreateTrackerInput) {
    return request<Tracker>('/trackers', { method: 'POST', body: input })
  },

  remove(id: string) {
    return request<void>(`/trackers/${id}`, { method: 'DELETE' })
  },
}
