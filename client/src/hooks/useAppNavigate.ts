import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { setTransitionDirection, shouldAnimateScreenChange } from '../utils/screen-transition'

/** `navigate(to)` from code (after saving, deleting…), with the same animated screen change as links */
export function useAppNavigate() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return useCallback(
    (to: string, options: { replace?: boolean } = {}) => {
      setTransitionDirection(pathname, to)
      return navigate(to, { ...options, viewTransition: shouldAnimateScreenChange() })
    },
    [navigate, pathname],
  )
}
