import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Link } from '../components/Link'
import { useAppNavigate } from '../hooks/useAppNavigate'
import { ConfirmSheet } from '../components/ConfirmSheet'
import { CopyPixelButton } from '../components/CopyPixelButton'
import { Icon } from '../components/Icon'
import { ErrorState, Skeleton } from '../components/LoadState'
import { paths } from '../constants/routes'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useTracker, type TrackerView } from '../hooks/useTracker'
import { formatDateTime, formatFullDateTime, inSentence, plural } from '../utils/format'
import { buttonClass, card, cn, fieldHint, iconButton, screen, screenBody, stickyHeader } from '../utils/ui'
import type { TrackerDetails } from '../services/types'
import { toast } from '../utils/toast'

export function TrackerScreen() {
  const { trackerId = '' } = useParams()
  const navigate = useAppNavigate()
  const { tracker, view, error, reload, remove } = useTracker(trackerId)
  useDocumentTitle(view?.title)

  const [confirmingRemove, setConfirmingRemove] = useState(false)

  async function removeTracker() {
    await remove()
    toast.info('Tracker removed')
    navigate(view?.collectionPath ?? paths.home(), { replace: true })
  }

  return (
    <div className={screen}>
      <header className={`${stickyHeader} flex items-center gap-1 pt-3 pr-3 pl-2 pb-2`}>
        <Link
          to={view?.collectionPath ?? paths.home()}
          className={iconButton}
          aria-label={`Back to ${view?.collectionName ?? 'collections'}`}
        >
          <Icon name="back" />
        </Link>
        {view && <span className="truncate text-fg-muted">{view.collectionName}</span>}
      </header>

      {error && !tracker && <ErrorState error={error} onRetry={reload} />}
      {!error && !tracker && (
        <div className={screenBody}>
          <Skeleton rows={3} rowClassName="h-22.5" />
        </div>
      )}

      {tracker && view && (
        <>
          <TrackerDetailsView tracker={tracker} view={view} />
          <footer className="sticky bottom-0 flex flex-col border-t border-divider bg-page px-5 pt-2 pb-4">
            <button
              type="button"
              className={buttonClass('ghostDanger')}
              onClick={() => setConfirmingRemove(true)}
            >
              <Icon name="eyeOff" size={16} />
              Remove tracker
            </button>
          </footer>
          <ConfirmSheet
            open={confirmingRemove}
            title="Remove tracker?"
            message="You’ll stop seeing when this email is opened, and its open history will be deleted."
            confirmLabel="Remove tracker"
            onConfirm={removeTracker}
            onCancel={() => setConfirmingRemove(false)}
          />
        </>
      )}
    </div>
  )
}

function TrackerDetailsView({ tracker, view }: { tracker: TrackerDetails; view: TrackerView }) {
  const { opened } = view

  return (
    <main className={screenBody}>
      <div className="flex flex-col gap-1.5 text-[13px]">
        <h1 className="text-lg/[1.35] font-semibold tracking-[-0.01em] wrap-anywhere">{view.title}</h1>
        <span className="text-fg-muted">
          {tracker.recipientEmails.length ? `To ${tracker.recipientEmails.join(', ')}` : 'No recipient added'}
        </span>
        {view.gmailUrl && (
          <a
            href={view.gmailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 inline-flex min-h-9 items-center gap-1.5 self-start font-medium"
          >
            Open in Gmail
            <Icon name="external" size={14} />
          </a>
        )}
      </div>

      <section aria-label="Email status" className={`${card} flex flex-col gap-3.5 p-4`}>
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-full',
              opened ? 'bg-opened/16 text-opened' : 'bg-surface-hover text-fg-soft',
            )}
          >
            <Icon name="eye" />
          </div>
          <div className="flex flex-col gap-0.5 text-[13px]">
            <span className={cn('text-base font-semibold', opened ? 'text-opened' : 'text-fg-soft')}>
              {opened ? 'Opened' : 'Not opened yet'}
            </span>
            <span className="text-fg-muted">
              {!opened
                ? `Tracker added ${inSentence(formatDateTime(tracker.createdAt))}`
                : view.openCountIsCapped
                  ? `${view.openCount}+ times`
                  : plural(view.openCount, 'time')}
            </span>
          </div>
        </div>

        {opened && tracker.openedAt && view.lastOpenedAt && (
          <dl className="grid grid-cols-2 gap-2 border-t border-line pt-3.5">
            <Stat label="First opened" iso={tracker.openedAt} />
            <Stat label="Last opened" iso={view.lastOpenedAt} />
          </dl>
        )}
      </section>

      {!opened && (
        // Only before the first open: once opened, the email has clearly been sent, so there's nothing to paste
        <section aria-label="Tracking pixel" className="flex flex-col gap-2">
          <CopyPixelButton html={tracker.pixel.html} primary />
          <p className={fieldHint}>
            Paste it at the end of your email before you send it. It’s invisible to the reader.
          </p>
        </section>
      )}

      <section aria-labelledby="timeline-title">
        <h2 id="timeline-title" className="mb-3 text-[13px] font-semibold text-fg-muted">
          Timeline
        </h2>
        <ol>
          <TimelineStep title="Tracker added" iso={tracker.createdAt} nextDone={opened} />
          <TimelineStep title="Opened" iso={tracker.openedAt} isLast />
        </ol>
      </section>
    </main>
  )
}

function Stat({ label, iso }: { label: string; iso: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-fg-muted">{label}</dt>
      <dd className="font-semibold">
        <DateTime iso={iso} />
      </dd>
    </div>
  )
}

function DateTime({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} title={formatFullDateTime(iso)}>
      {formatDateTime(iso)}
    </time>
  )
}

interface TimelineStepProps {
  title: string
  /** null = this step hasn't happened yet */
  iso: string | null
  nextDone?: boolean
  isLast?: boolean
}

function TimelineStep({ title, iso, nextDone = false, isLast = false }: TimelineStepProps) {
  // The line below the dot: solid once the next step happened, dotted while waiting, none after the last step
  const line = isLast
    ? 'border-transparent'
    : nextDone
      ? 'border-pending-line'
      : 'border-dotted border-pending'

  return (
    <li className="flex gap-3">
      <span className="flex w-3 flex-col items-center" aria-hidden="true">
        <span className={cn('mt-1.25 size-2.5 shrink-0 rounded-full', iso ? 'bg-success' : 'bg-pending')} />
        <span className={cn('mt-1 w-0 flex-1 border-l-2', line)} />
      </span>
      <span className="flex min-w-0 flex-1 justify-between gap-3 pb-4">
        <span className="font-medium">{title}</span>
        <span className="shrink-0 text-xs whitespace-nowrap text-fg-faint">
          {iso ? <DateTime iso={iso} /> : 'Waiting'}
        </span>
      </span>
    </li>
  )
}
