import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from '../utils/toast'

interface Options {
  /** Shown as an info toast when the action succeeds, e.g. "Tracker removed" */
  successMessage?: string
}

/**
 * Runs an action that changes something (save, delete, sign in…) and tracks it for the UI.
 *
 *   const rename = useMutation((name: string) => collectionsService.rename(id, name), {
 *     successMessage: 'Collection renamed',
 *   })
 *   <button onClick={() => rename.run('New name')} disabled={rename.busy}>
 *
 * If the action fails, its error is shown as an error toast, so callers never need try/catch.
 * `run` resolves to true when the action succeeded.
 */
export function useMutation<Args extends unknown[]>(
  action: (...args: Args) => Promise<unknown>,
  { successMessage }: Options = {},
) {
  const [busy, setBusy] = useState(false)

  // Always run the latest `action`, so `run` itself never changes
  const actionRef = useRef(action)
  useEffect(() => {
    actionRef.current = action
  })

  const run = useCallback(
    async (...args: Args): Promise<boolean> => {
      setBusy(true)
      try {
        await actionRef.current(...args)
        if (successMessage) toast.info(successMessage)
        return true
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Something went wrong')
        return false
      } finally {
        setBusy(false)
      }
    },
    [successMessage],
  )

  return { run, busy }
}
