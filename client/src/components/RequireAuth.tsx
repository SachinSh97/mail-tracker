import { Outlet, useLocation } from 'react-router-dom'
import { useLiveConnection } from '../hooks/useLiveEvents'
import { useSession } from '../hooks/useSession'
import { LoginScreen } from '../screens/LoginScreen'

/**
 * Guards the routes inside it. Without a signed-in user it shows the sign-in screen instead,
 * at whatever URL was opened, so the user lands on that page right after signing in.
 */
export function RequireAuth() {
  const session = useSession()
  const { pathname } = useLocation()

  if (!session) return <LoginScreen />

  return (
    <>
      <LiveConnection />
      {/* key: a new URL path (e.g. another tracker) is a fresh screen, so menus and dialogs reset.
          Query changes like ?show=opened keep the same screen. */}
      <Outlet key={pathname} />
    </>
  )
}

/** Live updates (opens, unread count) for as long as someone is signed in. Renders nothing. */
function LiveConnection() {
  useLiveConnection()
  return null
}
