import { notificationsService } from './notifications.service'

// The number on the notifications bell, shared by every screen.
// Components read it with the useUnreadCount() hook.

let count = 0
const listeners = new Set<() => void>()

function set(next: number) {
  if (next === count) return
  count = next
  listeners.forEach((listener) => listener())
}

export const unreadCount = {
  get: () => count,

  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },

  /** A new notification arrived over the live connection */
  increment: () => set(count + 1),

  /** All notifications were just viewed */
  clear: () => set(0),

  /** Asks the service for the real number (on start, after a reconnect, when the tab is shown again) */
  async refresh() {
    try {
      set(await notificationsService.countUnread())
    } catch {
      // Keep the last known number; the next refresh will correct it
    }
  },
}
