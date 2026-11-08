import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Link } from '../components/Link'
import { GoogleLogo } from '../components/GoogleLogo'
import { paths } from '../constants/routes'
import { DeveloperCredit } from '../components/login/DeveloperCredit'
import { FeatureSlider } from '../components/login/FeatureSlider'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { authService } from '../services/auth.service'
import { card, errorText } from '../utils/ui'

export function LoginScreen() {
  // The sign-in page is the public front page, so it keeps the full title search engines show
  useDocumentTitle(undefined)
  const location = useLocation()
  // The page goes away once we leave for Google; this only covers the moment before that
  const [leaving, setLeaving] = useState(false)

  function signIn() {
    setLeaving(true)
    // Come back to the page the user was trying to open
    authService.startGoogleSignIn(location.pathname + location.search)
  }

  return (
    <>
      <main className="flex flex-1 flex-col justify-center gap-6 px-5 py-6">
        <div className="flex flex-col gap-1 text-center">
          <h1 className="text-2xl font-bold tracking-[-0.02em]">Seenly</h1>
          <p className="text-fg-muted">See when the emails you send get opened.</p>
        </div>

        <FeatureSlider />

        <div className={`${card} flex flex-col gap-4 p-5`}>
          {authService.isConfigured ? (
            // Styled to Google's sign-in button guidelines (dark theme)
            <button
              type="button"
              onClick={signIn}
              disabled={leaving}
              className="inline-flex h-12 items-center justify-center gap-3 rounded-full border border-[#8e918f] bg-[#131314] px-4 text-[15px] font-medium text-[#e3e3e3] transition hover:bg-[#1f1f20] disabled:opacity-60"
            >
              <GoogleLogo />
              {leaving ? 'Opening Google…' : 'Sign in with Google'}
            </button>
          ) : (
            <p className={errorText} role="alert">
              Google sign-in isn’t set up: add VITE_GOOGLE_CLIENT_ID to client/.env (see .env.example).
            </p>
          )}

          <p className="text-center text-xs text-fg-faint">
            We only use your email and name. <Link to={paths.privacy()}>Privacy policy</Link>
          </p>
        </div>
      </main>
      <DeveloperCredit />
    </>
  )
}
