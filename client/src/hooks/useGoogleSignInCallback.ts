import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { paths } from '../constants/routes'
import { authService } from '../services/auth.service'
import { toast } from '../utils/toast'

/**
 * Runs on /auth/callback: finishes the Google sign-in, then leaves the page.
 * Always navigates with `replace`, so the URL holding Google's token is dropped from history.
 */
export function useGoogleSignInCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    authService.completeGoogleSignIn(window.location.hash).then(
      (returnTo) => navigate(returnTo, { replace: true }),
      (error: Error) => {
        toast.error(error.message)
        navigate(paths.home(), { replace: true })
      },
    )
  }, [navigate])
}
