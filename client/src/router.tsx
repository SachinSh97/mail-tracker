import { createBrowserRouter } from 'react-router-dom'
import { RequireAuth } from './components/RequireAuth'
import { ROUTES } from './constants/routes'
import { AppLayout } from './layouts/AppLayout'
import { ErrorScreen } from './screens/ErrorScreen'
import { HomeScreen } from './screens/HomeScreen'

// Home (and the sign-in screen inside RequireAuth) are where almost every visit starts,
// so they ship in the main bundle. Every other screen is downloaded the first time it's opened
// (`lazy`), which keeps the first load small. The router waits for the code before switching
// screens, so there's no loading flash.
export const router = createBrowserRouter([
  {
    // Page frame for the whole app
    element: <AppLayout />,
    // Last resort: the page frame itself broke, so the fallback fills the whole page
    errorElement: <ErrorScreen fullPage />,
    // Shown for the split second a lazy screen loads on a fresh page load
    HydrateFallback: () => null,
    children: [
      // Public: Google sends the browser back here to finish signing in
      {
        path: ROUTES.authCallback,
        errorElement: <ErrorScreen />,
        lazy: () => import('./screens/AuthCallbackScreen').then((m) => ({ Component: m.AuthCallbackScreen })),
      },
      {
        // Everything below needs a signed-in user
        element: <RequireAuth />,
        // A screen that crashes is replaced by a friendly message; the phone frame and toasts stay
        errorElement: <ErrorScreen />,
        children: [
          { path: ROUTES.home, element: <HomeScreen /> },
          {
            path: ROUTES.addTracker,
            lazy: () => import('./screens/AddTrackerScreen').then((m) => ({ Component: m.AddTrackerScreen })),
          },
          {
            path: ROUTES.notFound,
            lazy: () => import('./screens/NotFoundScreen').then((m) => ({ Component: m.NotFoundScreen })),
          },
        ],
      },
    ],
  },
])
