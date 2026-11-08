import { Link } from '../components/Link'
import { Icon } from '../components/Icon'
import { ErrorState, Placeholder, Skeleton } from '../components/LoadState'
import { NO_COLLECTION_NAME } from '../constants/collections'
import { paths } from '../constants/routes'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useNotifications } from '../hooks/useNotifications'
import type { Notification } from '../services/types'
import { formatDateTime, formatFullDateTime } from '../utils/format'
import { cn, iconButton, screen, screenTitle, stickyHeader } from '../utils/ui'

export function NotificationsScreen() {
  useDocumentTitle('Notifications')
  const { notifications, error, reload } = useNotifications()

  return (
    <div className={screen}>
      <header className={`${stickyHeader} flex items-center gap-1 pt-3 pr-3 pb-1 pl-2`}>
        <Link to={paths.home()} className={iconButton} aria-label="Back to collections">
          <Icon name="back" />
        </Link>
        <h1 className={screenTitle}>Notifications</h1>
      </header>

      <main className="flex flex-1 flex-col px-5 pt-2 pb-5">
        {error && !notifications && <ErrorState error={error} onRetry={reload} />}
        {!error && !notifications && <Skeleton rows={5} rowClassName="h-18" />}

        {notifications?.length === 0 && (
          <Placeholder
            illustration="empty"
            title="No notifications yet"
            message="You’ll get one here each time someone opens an email you’re tracking."
          />
        )}

        {notifications && notifications.length > 0 && (
          <ul className="flex flex-col">
            {notifications.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} />
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}

function NotificationRow({ notification }: { notification: Notification }) {
  const { tracker, unread, firstOpen, createdAt } = notification
  const who = tracker.recipientEmails[0] ?? 'Someone'
  const what = tracker.emailSubject ?? tracker.name

  return (
    <li>
      <Link
        to={paths.tracker(tracker.id)}
        className={cn(
          '-mx-2 flex gap-3 rounded-xl border-b border-divider px-2 py-3.5 text-fg hover:bg-surface-hover hover:text-fg',
          unread && 'bg-accent/6',
        )}
      >
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full',
            firstOpen ? 'bg-opened/16 text-opened' : 'bg-surface-hover text-fg-soft',
          )}
          aria-hidden="true"
        >
          <Icon name="eye" size={18} />
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="leading-snug">
            <strong className="font-semibold">{who}</strong> {firstOpen ? 'opened' : 'opened again'}{' '}
            <span className="text-fg-soft">“{what}”</span>
          </span>
          <span className="flex gap-1.5 text-xs text-fg-muted">
            <time dateTime={createdAt} title={formatFullDateTime(createdAt)}>
              {formatDateTime(createdAt)}
            </time>
            <span aria-hidden="true">·</span>
            <span className="truncate">{tracker.collection?.name ?? NO_COLLECTION_NAME}</span>
          </span>
        </span>

        {unread && (
          <span className="mt-1.5 flex shrink-0 items-start">
            <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
            <span className="sr-only">New</span>
          </span>
        )}
      </Link>
    </li>
  )
}
