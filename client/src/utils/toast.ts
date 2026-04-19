// Short messages that slide up from the bottom and disappear on their own.
// Call from anywhere (hooks, event handlers):  toast.info('Tracker removed')  /  toast.error(message)
// <Toaster /> in AppLayout shows them; components read the list with useToasts().

export type ToastType = 'info' | 'error'

export interface Toast {
  id: number
  type: ToastType
  message: string
}

/** How long a toast stays on screen */
export const TOAST_DURATION_MS = 5000
/** Older toasts are dropped beyond this, so the screen never fills up */
const MAX_VISIBLE = 3

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()

function notify() {
  listeners.forEach((listener) => listener())
}

function show(type: ToastType, message: string) {
  const id = nextId++
  // A new array each time, so React sees the change
  toasts = [...toasts, { id, type, message }].slice(-MAX_VISIBLE)
  notify()
  setTimeout(() => toast.dismiss(id), TOAST_DURATION_MS)
}

export const toast = {
  info: (message: string) => show('info', message),
  error: (message: string) => show('error', message),

  dismiss(id: number) {
    if (!toasts.some((item) => item.id === id)) return
    toasts = toasts.filter((item) => item.id !== id)
    notify()
  },

  /** For useSyncExternalStore */
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getAll: () => toasts,
}
