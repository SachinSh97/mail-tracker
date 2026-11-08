import { Link as RouterLink, useLocation, type LinkProps } from 'react-router-dom'
import { setTransitionDirection, shouldAnimateScreenChange } from '../utils/screen-transition'

/**
 * React Router's Link, with an animated screen change (View Transitions API).
 * Use it for every in-app link. Browsers without View Transitions, and people who prefer reduced
 * motion, just switch instantly.
 */
export function Link({ to, onClick, ...props }: LinkProps & { to: string }) {
  const { pathname } = useLocation()

  return (
    <RouterLink
      to={to}
      viewTransition={shouldAnimateScreenChange()}
      onClick={(event) => {
        setTransitionDirection(pathname, to)
        onClick?.(event)
      }}
      {...props}
    />
  )
}
