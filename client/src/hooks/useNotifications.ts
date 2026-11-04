import { useEffect } from 'react'
import { notificationsService } from '../services/notifications.service'
import { unreadCount } from '../services/unread-count'
import { useLiveEvent } from './useLiveEvents'
import { useQuery } from './useQuery'

/**
 * The notifications screen: the list, kept live, and marked as read once it's been shown.
 * Items keep their "unread" look for this visit, so the user can see what's new.
 */
export function useNotifications() {
  const { data, ...query } = useQuery('notifications', (signal) => notificationsService.list(signal))
  const notifications = data?.items

  // A new open while this screen is showing: load it into the list
  useLiveEvent(() => query.reload())

  // Once the newest notifications are on screen, mark them as read (also clears the bell)
  const newest = notifications?.[0]
  useEffect(() => {
    if (!newest?.unread) return
    unreadCount.clear()
    notificationsService.markSeen(newest.createdAt).then(
      () => unreadCount.refresh(), // in case another one arrived meanwhile
      () => unreadCount.refresh(),
    )
  }, [newest?.id, newest?.unread, newest?.createdAt])

  return { ...query, notifications }
}
