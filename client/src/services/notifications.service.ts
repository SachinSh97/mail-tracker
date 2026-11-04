import { request } from './http'
import type { Notification, Paginated } from './types'

export const notificationsService = {
  /** Newest first. Each says whether it's unread. */
  list(signal?: AbortSignal) {
    return request<Paginated<Notification>>('/notifications?limit=50', { signal })
  },

  async countUnread(signal?: AbortSignal): Promise<number> {
    return (await request<{ count: number }>('/notifications/unread-count', { signal })).count
  },

  /** Marks everything up to `seenUntil` (the newest notification shown) as read */
  markSeen(seenUntil: string) {
    return request<void>('/notifications/seen', { method: 'POST', body: { seenUntil } })
  },
}
