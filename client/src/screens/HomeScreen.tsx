import { Link } from 'react-router-dom'
import { paths } from '../constants/routes'
import { AppIcon } from '../components/AppIcon'
import { Icon } from '../components/Icon'
import { ErrorState, Placeholder, Skeleton } from '../components/LoadState'
import { useCollectionsOverview } from '../hooks/useCollectionsOverview'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useUnreadCount } from '../hooks/useLiveEvents'
import { useSession } from '../hooks/useSession'
import { NO_COLLECTION_ID, NO_COLLECTION_NAME } from '../constants/collections'
import { formatCount } from '../utils/format'
import { buttonClass, cn, iconButton, screen } from '../utils/ui'
import { authService } from '../services/auth.service'

export function HomeScreen() {
  useDocumentTitle(undefined)
  const email = useSession()?.email
  const { collections, looseTrackers, isEmpty, error, loading, reload } = useCollectionsOverview()

  return (
    <div className={screen}>
      <header className="flex items-center justify-between gap-3 pt-3 pr-2 pl-4">
        <span className="flex items-center gap-2.5">
          <AppIcon />
          <span className="text-base font-semibold tracking-[-0.01em]">Seenly</span>
        </span>
        <div className="flex items-center">
          <NotificationsBell />
          <button
            type="button"
            className={iconButton}
            onClick={authService.signOut}
            aria-label={`Log out${email ? ` (${email})` : ''}`}
            title={email ? `Log out (${email})` : 'Log out'}
          >
            <Icon name="logOut" />
          </button>
        </div>
      </header>

      <section
        aria-label="New tracker"
        className="mx-4 mt-3 mb-1 flex items-center gap-3 rounded-card border border-accent/35 bg-surface bg-linear-to-b from-accent/8 to-accent/8 py-3 pr-3 pl-3.5"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.75">
          <span className="font-semibold">Track a new email</span>
          <span className="text-xs text-fg-muted">Get a pixel to paste into your email</span>
        </div>
        <Link to={paths.addTracker()} className={buttonClass('primary')}>
          Track
        </Link>
      </section>

      <main className="flex flex-1 flex-col gap-2 px-5 pt-3 pb-5">
        <h1 className="sr-only">Collections</h1>

        {error && !collections && <ErrorState error={error} onRetry={reload} />}
        {loading && !collections && <Skeleton rows={4} />}

        {isEmpty && (
          <Placeholder
            illustration="empty"
            title="Nothing tracked yet"
            message="Track your first email to see when it’s opened."
            action={
              <Link to={paths.addTracker()} className={buttonClass('primary')}>
                Track an email
              </Link>
            }
          />
        )}

        {collections?.map((collection) => (
          <CollectionCard
            key={collection.id}
            to={paths.collection(collection.id)}
            name={collection.name}
            trackerCount={collection.trackerCount}
            openedCount={collection.openedCount}
          />
        ))}

        {looseTrackers && looseTrackers.trackerCount > 0 && (
          <CollectionCard
            to={paths.collection(NO_COLLECTION_ID)}
            name={NO_COLLECTION_NAME}
            {...looseTrackers}
          />
        )}
      </main>
    </div>
  )
}

interface CollectionCardProps {
  to: string
  name: string
  trackerCount: number
  openedCount: number
}

function CollectionCard({ to, name, trackerCount, openedCount }: CollectionCardProps) {
  return (
    <Link
      to={to}
      title={name}
      className="flex flex-col gap-1 rounded-xl border border-line bg-surface px-3.5 py-3 text-fg transition-colors hover:border-line-hover hover:bg-surface-hover hover:text-fg"
    >
      <span className="truncate text-[15px] font-semibold">{name}</span>
      <span className="flex items-center gap-1.5 text-xs text-fg-soft">
        <span className="size-1.75 shrink-0 rounded-full bg-opened" />
        {formatCount(openedCount)} of {formatCount(trackerCount)} opened
      </span>
    </Link>
  )
}

/** Bell in the header: opens the notifications, with a badge showing how many are new */
function NotificationsBell() {
  const unread = useUnreadCount()
  const label = unread > 0 ? `Notifications, ${unread} new` : 'Notifications'

  return (
    <Link to={paths.notifications()} className={cn(iconButton, 'relative')} aria-label={label} title={label}>
      <Icon name="bell" />
      {unread > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-1.5 right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-danger px-1 text-[10px] leading-none font-bold text-on-danger ring-2 ring-page"
        >
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  )
}
