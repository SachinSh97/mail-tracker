import { useState } from 'react'
import { Link } from './Link'
import { paths } from '../constants/routes'
import type { TrackerFilter } from '../hooks/useTrackerFilter'
import { TRACKERS_PAGE_SIZE, useTrackersPage } from '../hooks/useTrackersPage'
import { formatDateTime, formatFullDateTime, formatSent } from '../utils/format'
import { buttonClass, cn } from '../utils/ui'
import type { Tracker } from '../services/types'
import { ErrorState, Placeholder, Skeleton } from './LoadState'

const EMPTY_TITLES: Record<TrackerFilter, string> = {
  all: 'No tracked emails yet',
  opened: 'No opened emails yet',
  'not-opened': 'Every email here has been opened',
}

interface Props {
  collectionId: string
  filter: TrackerFilter
}

/**
 * Trackers in a collection, 50 at a time with a "Load more" button.
 * Each page loads itself, so adding a page never re-fetches the ones already shown.
 */
export function TrackerList({ collectionId, filter }: Props) {
  const [pageCount, setPageCount] = useState(1)

  return (
    <ul className="flex flex-col">
      {Array.from({ length: pageCount }, (_, index) => (
        <TrackerPage
          key={index}
          collectionId={collectionId}
          filter={filter}
          offset={index * TRACKERS_PAGE_SIZE}
          isLastPage={index === pageCount - 1}
          onLoadMore={() => setPageCount((count) => count + 1)}
        />
      ))}
    </ul>
  )
}

interface PageProps extends Props {
  offset: number
  isLastPage: boolean
  onLoadMore: () => void
}

function TrackerPage({ collectionId, filter, offset, isLastPage, onLoadMore }: PageProps) {
  const { trackers, hasMore, error, reload } = useTrackersPage({ collectionId, filter, offset })

  if (error && !trackers) {
    return (
      <li className="flex flex-col">
        <ErrorState error={error} onRetry={reload} />
      </li>
    )
  }
  if (!trackers) {
    return (
      // Placeholder rows the same height as real ones (≈90px each, gap included), so the page doesn't jump when data arrives
      <li className="flex flex-col pt-2">
        <Skeleton rows={offset === 0 ? 4 : 2} rowClassName="h-[82px]" />
      </li>
    )
  }
  if (offset === 0 && trackers.length === 0) {
    return (
      <li className="flex flex-col">
        <Placeholder
          illustration="empty"
          title={EMPTY_TITLES[filter]}
          message={filter === 'all' ? 'Emails you track in this collection will show up here.' : undefined}
        />
      </li>
    )
  }

  return (
    <>
      {trackers.map((tracker) => (
        <TrackerRow key={tracker.id} tracker={tracker} />
      ))}
      {isLastPage && hasMore && (
        <li className="flex flex-col py-3.5">
          <button type="button" className={buttonClass('outline')} onClick={onLoadMore}>
            Load more
          </button>
        </li>
      )}
    </>
  )
}

function TrackerRow({ tracker }: { tracker: Tracker }) {
  const opened = tracker.status === 'opened'
  const title = tracker.recipientEmails.join(', ') || tracker.name
  // Avoid showing the same text twice when the tracker is named after its subject
  const subtitle = tracker.emailSubject ?? (title !== tracker.name ? tracker.name : null)
  const time = opened && tracker.openedAt ? tracker.openedAt : tracker.createdAt

  return (
    <li>
      <Link
        to={paths.tracker(tracker.id)}
        className="group flex gap-3 border-b border-divider py-3.5 text-fg hover:text-fg"
      >
        <span
          aria-hidden="true"
          className={cn(
            'mt-1.25 size-2.5 shrink-0 rounded-full',
            opened ? 'bg-opened' : 'border-2 border-pending',
          )}
        />
        <span className="flex min-w-0 flex-1 flex-col gap-0.75">
          <span className="flex justify-between gap-2">
            <span
              className="truncate font-semibold decoration-fg-faint underline-offset-3 group-hover:underline"
              title={title}
            >
              {title}
            </span>
            <span className={cn('shrink-0 text-xs font-semibold', opened ? 'text-opened' : 'text-fg-muted')}>
              {opened ? 'Opened' : 'Not opened'}
            </span>
          </span>
          {subtitle && <span className="truncate text-[13px] text-fg-soft">{subtitle}</span>}
          <time className="text-xs text-fg-muted" dateTime={time} title={formatFullDateTime(time)}>
            {opened ? formatDateTime(time) : formatSent(time)}
          </time>
        </span>
      </Link>
    </li>
  )
}
