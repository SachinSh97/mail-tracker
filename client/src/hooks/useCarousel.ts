import { useCallback, useEffect, useRef, useState } from 'react'

const AUTO_ADVANCE_MS = 5000

/**
 * Logic for a swipeable row of slides. The sliding itself is plain browser scrolling
 * (CSS scroll-snap), so touch swipes, trackpads and momentum all work natively.
 *
 * - `trackRef`: put on the scrolling row of slides
 * - `active`:   index of the slide in view (kept in sync while the user swipes)
 * - `goTo(i)`:  smoothly scrolls to a slide (used by the dots)
 * - `pause` / `resume`: auto-advance stops while the user is hovering, touching or using the keyboard on it
 *
 * Auto-advance never runs for people who've asked their device for reduced motion.
 */
export function useCarousel(slideCount: number) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  const goTo = useCallback((index: number) => {
    const track = trackRef.current
    if (!track) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    track.scrollTo({ left: index * track.clientWidth, behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [])

  // Work out which slide is showing whenever the row scrolls (swipe, dots or auto-advance)
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const onScroll = () => setActive(Math.round(track.scrollLeft / track.clientWidth))
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => track.removeEventListener('scroll', onScroll)
  }, [])

  // Move to the next slide every few seconds, wrapping round to the first
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (paused || reduceMotion || slideCount < 2) return
    const timer = setTimeout(() => goTo((active + 1) % slideCount), AUTO_ADVANCE_MS)
    return () => clearTimeout(timer)
  }, [active, paused, slideCount, goTo])

  return {
    trackRef,
    active,
    goTo,
    pause: useCallback(() => setPaused(true), []),
    resume: useCallback(() => setPaused(false), []),
  }
}
