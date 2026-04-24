import { useCallback, useEffect, useRef, useState } from 'react'

interface Result<T> {
  key: string
  version: number
  data?: T
  error?: Error
}

/**
 * Loads data for a screen and re-loads whenever `key` changes.
 *
 *   const { data, error, loading, reload } = useQuery(`tracker:${id}`, (signal) => trackersService.get(id, signal))
 *
 * - `key` identifies what is being loaded. Change it (e.g. a new id) and the data is fetched again.
 * - Old requests are cancelled, so a slow response can never overwrite a newer one.
 * - While reloading the same key, the previous data stays on screen (no flicker).
 */
export function useQuery<T>(key: string, load: (signal: AbortSignal) => Promise<T>) {
  const [result, setResult] = useState<Result<T> | null>(null)
  const [version, setVersion] = useState(0)

  // Always call the latest `load` without re-running the effect on every render
  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  })

  useEffect(() => {
    const controller = new AbortController()
    loadRef.current(controller.signal).then(
      (data) => setResult({ key, version, data }),
      (error: Error) => {
        if (!controller.signal.aborted) setResult({ key, version, error })
      },
    )
    return () => controller.abort()
  }, [key, version])

  const reload = useCallback(() => setVersion((current) => current + 1), [])

  const isSameKey = result?.key === key
  const isLatest = isSameKey && result.version === version
  return {
    data: isSameKey ? result.data : undefined,
    error: isLatest ? result.error : undefined,
    loading: !isLatest,
    reload,
  }
}
