import { useEffect, useRef, type RefObject } from 'react'

/**
 * Calls `onOutside` when the user presses anywhere outside `ref`, while `enabled` is true.
 * Used to close dropdowns and menus.
 */
export function useClickOutside(ref: RefObject<HTMLElement | null>, enabled: boolean, onOutside: () => void) {
  // Always call the latest handler without re-adding the listener
  const handlerRef = useRef(onOutside)
  useEffect(() => {
    handlerRef.current = onOutside
  })

  useEffect(() => {
    if (!enabled) return
    function handlePointerDown(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) handlerRef.current()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [ref, enabled])
}
