import { useSyncExternalStore } from 'react'
import { toast, type Toast } from '../utils/toast'

/** The toasts on screen right now. Re-renders when one is added or goes away. */
export function useToasts(): Toast[] {
  return useSyncExternalStore(toast.subscribe, toast.getAll)
}
