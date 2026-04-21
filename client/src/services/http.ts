import { session } from './session'

// The one place that talks HTTP. Services call `request`; nothing else uses fetch directly.

// Empty in dev: Vite proxies /api to the service (see vite.config.ts)
export const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '')

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
  signal?: AbortSignal
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = session.get()?.token
  const hasBody = options.body !== undefined

  let response: Response
  try {
    response = await fetch(`${BASE_URL}/api/v1${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(hasBody && { 'Content-Type': 'application/json' }),
      },
      body: hasBody ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
    })
  } catch (error) {
    if (options.signal?.aborted) throw error
    throw new ApiError("Can't reach the server. Check your connection and try again.", 0)
  }

  // The session expired or was revoked: send the user back to sign in
  if (response.status === 401 && token) session.clear()

  if (response.status === 204) return undefined as T
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(data?.error?.message ?? `Something went wrong (${response.status})`, response.status)
  }
  return data as T
}

/** { status: 'opened', limit: 50, offset: undefined } → "status=opened&limit=50" */
export function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value))
  }
  return search.toString()
}
