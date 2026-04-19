import { createBrowserRouter } from 'react-router-dom'
import { ROUTES } from './constants/routes'
import { AppLayout } from './layouts/AppLayout'
import { ErrorScreen } from './screens/ErrorScreen'

// Every screen is downloaded the first time it's opened (`lazy`), which keeps the first load small.
// The router waits for the code before switching screens, so there's no loading flash.
export const router = createBrowserRouter([
  {
    // Page frame for the whole app
    element: <AppLayout />,
    // Last resort: the page frame itself broke, so the fallback fills the whole page
    errorElement: <ErrorScreen fullPage />,
    // Shown for the split second a lazy screen loads on a fresh page load
    HydrateFallback: () => null,
    children: [
      {
        path: ROUTES.notFound,
        errorElement: <ErrorScreen />,
        lazy: () => import('./screens/NotFoundScreen').then((m) => ({ Component: m.NotFoundScreen })),
      },
    ],
  },
])
