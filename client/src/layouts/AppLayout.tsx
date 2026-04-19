import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Toaster } from '../components/Toaster'

/**
 * The frame around every page in the app (sign-in and 404 included).
 *
 * - On a phone: the app fills the screen and the page scrolls normally.
 * - On anything wider (sm and up): the app sits inside a phone-shaped border, centred on the page,
 *   and scrolls inside that border. Frame sizes are CSS variables in index.css (--frame-*).
 *
 * Toasts appear at the bottom of the screen (phone) or of the frame (wider screens).
 */
export function AppLayout() {
  const screenRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  const isFirstPage = useRef(true)

  useEffect(() => {
    // A new page starts at the top. Both scroll areas are reset: the window (phone) and the frame (wider screens).
    window.scrollTo(0, 0)
    screenRef.current?.scrollTo(0, 0)

    // After an in-app navigation, move keyboard and screen-reader focus to the new page,
    // like a normal page load would. Not on the first load: the browser already starts at the top.
    if (isFirstPage.current) isFirstPage.current = false
    else screenRef.current?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <div className="flex min-h-dvh justify-center sm:items-center sm:py-6">
      {/* The phone: a dark bezel with rounded corners. Only drawn from `sm` up. */}
      <div className="relative flex w-full flex-col sm:h-(--frame-height) sm:w-(--frame-width) sm:overflow-hidden sm:rounded-(--frame-radius) sm:border-(length:--frame-bezel) sm:border-black sm:app-background sm:shadow-[0_0_0_1px_var(--color-line-strong),0_30px_80px_rgb(0_0_0/0.6)]">
        {/* The screen: scrolls inside the frame, so the frame and toasts stay put.
            tabIndex -1: focusable from code (see above) but not a Tab stop. */}
        <div
          ref={screenRef}
          tabIndex={-1}
          className="flex min-h-dvh flex-1 flex-col outline-none sm:min-h-0 sm:overflow-y-auto sm:overscroll-contain"
        >
          <Outlet />
        </div>
        <Toaster />
      </div>
    </div>
  )
}
