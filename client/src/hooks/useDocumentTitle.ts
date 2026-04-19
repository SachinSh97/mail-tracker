import { useEffect } from 'react'

/** The title search engines and the sign-in page show. Matches <title> in index.html. */
const DEFAULT_TITLE = 'Seenly – See when your emails get opened'

/**
 * Sets the browser tab title, so each screen is identifiable in history, to screen readers
 * and in search results. Leave `title` empty for the default.
 */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    document.title = title ? `${title} · Seenly` : DEFAULT_TITLE
  }, [title])
}
