import { useState, type SubmitEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmSheet } from '../components/ConfirmSheet'
import { Icon } from '../components/Icon'
import { ErrorState } from '../components/LoadState'
import { OptionsMenu } from '../components/OptionsMenu'
import { TrackerList } from '../components/TrackerList'
import { paths } from '../constants/routes'
import { useCollection } from '../hooks/useCollection'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useMutation } from '../hooks/useMutation'
import { TRACKER_FILTERS, useTrackerFilter } from '../hooks/useTrackerFilter'
import { NO_COLLECTION_NAME } from '../constants/collections'
import { formatCount, plural } from '../utils/format'
import { toast } from '../utils/toast'
import { buttonClass, cn, iconButton, screen, screenTitle, stickyHeader } from '../utils/ui'

export function CollectionScreen() {
  const { collectionId = '' } = useParams()
  const navigate = useNavigate()
  const collection = useCollection(collectionId)
  const { summary } = collection
  const [filter, setFilter] = useTrackerFilter()
  useDocumentTitle(summary?.name)

  const [renaming, setRenaming] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  async function deleteCollection() {
    await collection.remove()
    toast.info('Collection deleted')
    navigate(paths.home(), { replace: true })
  }

  return (
    <div className={screen}>
      <header className={stickyHeader}>
        <div className="flex items-center gap-1 pt-3 pr-3 pb-1 pl-2">
          <Link to={paths.home()} className={iconButton} aria-label="Back to collections">
            <Icon name="back" />
          </Link>

          {renaming && summary ? (
            <RenameForm
              currentName={summary.name}
              onSave={collection.rename}
              onClose={() => setRenaming(false)}
            />
          ) : (
            <>
              <h1 className={`${screenTitle} min-w-0 flex-1 truncate`}>{summary?.name ?? ' '}</h1>
              {collection.isRealCollection && summary && (
                <OptionsMenu
                  label="Collection options"
                  options={[
                    { label: 'Rename', icon: 'pencil', onSelect: () => setRenaming(true) },
                    {
                      label: 'Delete collection',
                      icon: 'trash',
                      danger: true,
                      onSelect: () => setConfirmingDelete(true),
                    },
                  ]}
                />
              )}
            </>
          )}
        </div>
        {!(collection.error && !summary) && (
          <div
            role="group"
            aria-label="Filter emails"
            className="mx-5 mt-2.5 mb-2 flex gap-1 rounded-xl bg-surface p-1"
          >
            {TRACKER_FILTERS.map(({ value, label }) => {
              const active = value === filter
              const count = collection.countsByFilter?.[value]
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  className={cn(
                    'flex h-8.5 flex-auto items-center justify-center gap-1.5 rounded-[9px] px-2.5 text-[13px] whitespace-nowrap',
                    active
                      ? 'bg-surface-active font-semibold text-fg'
                      : 'font-medium text-fg-muted hover:text-fg',
                  )}
                  onClick={() => setFilter(value)}
                >
                  {label}
                  {count !== undefined && (
                    <span
                      className={cn(
                        'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold',
                        active ? 'bg-accent/22 text-link-hover' : 'bg-surface-hover text-fg-muted',
                      )}
                    >
                      {formatCount(count)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </header>

      {collection.error && !summary ? (
        <ErrorState error={collection.error} onRetry={collection.reload} />
      ) : (
        <>
          <main className="flex flex-1 flex-col px-5 pt-1 pb-5">
            {/* key: start a fresh list (back to page 1) whenever the filter changes */}
            <TrackerList key={filter} collectionId={collectionId} filter={filter} />
            <Link to={paths.addTracker(collectionId)} className={`${buttonClass('outline')} mt-4`}>
              Track an email here
            </Link>
          </main>
        </>
      )}

      {summary && (
        <ConfirmSheet
          open={confirmingDelete}
          title={`Delete “${summary.name}”?`}
          message={
            summary.trackerCount > 0
              ? `Its ${plural(summary.trackerCount, 'tracker')} will keep working and move to “${NO_COLLECTION_NAME}”.`
              : 'This collection is empty.'
          }
          confirmLabel="Delete collection"
          onConfirm={deleteCollection}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  )
}

interface RenameFormProps {
  currentName: string
  onSave: (name: string) => Promise<void>
  onClose: () => void
}

function RenameForm({ currentName, onSave, onClose }: RenameFormProps) {
  const [name, setName] = useState(currentName)
  const save = useMutation(
    async (newName: string) => {
      await onSave(newName)
      onClose()
    },
    { successMessage: 'Collection renamed' },
  )

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || trimmed === currentName) onClose()
    else save.run(trimmed)
  }

  return (
    <form className="flex min-w-0 flex-1 items-center gap-1" onSubmit={handleSubmit}>
      <label htmlFor="rename" className="sr-only">
        Collection name
      </label>
      <input
        id="rename"
        className="h-10 min-w-0 flex-1 rounded-btn border border-accent bg-surface px-2.5 text-[15px] font-semibold focus:outline-none"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => event.key === 'Escape' && onClose()}
        maxLength={100}
        required
        autoFocus
      />
      <button type="submit" className={buttonClass('primary', 'sm')} disabled={save.busy}>
        {save.busy ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}
