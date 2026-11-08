import type { SubmitEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Link } from '../components/Link'
import { useAppNavigate } from '../hooks/useAppNavigate'
import { Icon } from '../components/Icon'
import { Select } from '../components/Select'
import { paths } from '../constants/routes'
import { NEW_COLLECTION, NO_COLLECTION, useAddTrackerForm } from '../hooks/useAddTrackerForm'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import {
  buttonClass,
  errorText,
  field,
  fieldHint,
  fieldLabel,
  iconButton,
  input,
  screen,
  screenBody,
  screenTitle,
  stickyHeader,
} from '../utils/ui'

export function AddTrackerScreen() {
  useDocumentTitle('Add tracker')
  const navigate = useAppNavigate()
  // Opened from a collection screen? Pre-select that collection and go back there on close.
  const [searchParams] = useSearchParams()
  const preselectedCollectionId = searchParams.get('collection')
  const closeTo = preselectedCollectionId ? paths.collection(preselectedCollectionId) : paths.home()

  const form = useAddTrackerForm({
    preselectedCollectionId,
    // Replace, so "back" from the new tracker doesn't return to a filled-in form
    onCreated: (tracker) => navigate(paths.tracker(tracker.id), { replace: true }),
  })

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    form.submit()
  }

  return (
    <div className={screen}>
      <header className={`${stickyHeader} flex items-center gap-1 pt-3 pr-2 pl-5 pb-2`}>
        <h1 className={`${screenTitle} flex-1`}>Add tracker</h1>
        <Link to={closeTo} className={iconButton} aria-label="Close">
          <Icon name="close" />
        </Link>
      </header>

      <main className="flex flex-1 flex-col">
        <form className={screenBody} onSubmit={handleSubmit}>
          <div className={field}>
            <label htmlFor="subject" className={fieldLabel}>
              Email subject
            </label>
            <input
              id="subject"
              className={input}
              value={form.subject}
              onChange={(event) => form.setSubject(event.target.value)}
              placeholder="e.g. Q4 vendor proposal"
              maxLength={300}
              autoFocus
            />
          </div>

          <div className={field}>
            <label htmlFor="recipients" className={fieldLabel}>
              To
            </label>
            <input
              id="recipients"
              className={input}
              // type="email" + multiple lets the browser validate a comma-separated list for us
              type="email"
              multiple
              value={form.recipients}
              onChange={(event) => form.setRecipients(event.target.value)}
              placeholder="name@company.com"
              aria-describedby="recipients-hint"
            />
            <p id="recipients-hint" className={fieldHint}>
              Separate several addresses with commas.
            </p>
          </div>

          <div className={field}>
            <label htmlFor="collection" className={fieldLabel}>
              Save in collection
            </label>
            <Select
              id="collection"
              value={form.collectionChoice}
              onChange={form.setCollectionChoice}
              disabled={!form.collectionsReady}
              options={[
                ...form.collections.map((collection) => ({ value: collection.id, label: collection.name })),
                { value: NO_COLLECTION, label: 'No collection', separated: form.collections.length > 0 },
                { value: NEW_COLLECTION, label: 'New collection…', icon: 'plus' as const },
              ]}
            />
            {form.collectionsError && (
              <p className={errorText}>
                Couldn’t load your collections.{' '}
                <button type="button" className="text-link underline" onClick={form.reloadCollections}>
                  Try again
                </button>
              </p>
            )}
          </div>

          {form.isCreatingCollection && (
            <div className={field}>
              <label htmlFor="new-collection" className={fieldLabel}>
                Collection name
              </label>
              <input
                id="new-collection"
                className={input}
                value={form.newCollectionName}
                onChange={(event) => form.setNewCollectionName(event.target.value)}
                placeholder="e.g. Client renewals"
                maxLength={100}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className={buttonClass('primary', 'lg')}
            disabled={form.submitting || !form.collectionsReady}
          >
            {form.submitting ? 'Adding tracker…' : 'Track email'}
          </button>
        </form>
      </main>
    </div>
  )
}
