import { ROUTES } from '../constants/routes'

// Which way the screen slides when moving between screens: deeper screens come in from the right
// ("forward"), shallower ones from the left ("back"), like a phone app. index.css reads
// <html data-nav="forward|back"> to pick the animation.

/** How deep a screen sits: home 0 → lists 1 → one email or the add form 2 */
function screenDepth(pathname: string): number {
  if (pathname === ROUTES.home) return 0
  if (pathname.startsWith('/trackers/') || pathname === ROUTES.addTracker) return 2
  return 1
}

/** Screens just switch, with no slide, for people who've asked their device for less motion */
export function shouldAnimateScreenChange(): boolean {
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Call right before navigating from `from` to `to`, so the slide goes the right way */
export function setTransitionDirection(from: string, to: string): void {
  const target = new URL(to, window.location.origin).pathname
  document.documentElement.dataset.nav = screenDepth(target) < screenDepth(from) ? 'back' : 'forward'
}
