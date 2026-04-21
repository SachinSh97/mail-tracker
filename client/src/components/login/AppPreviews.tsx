import type { ReactNode } from 'react'
import { cn } from '../../utils/ui'
import { Icon } from '../Icon'

// Miniature, read-only copies of the app's tracking screens, shown on the sign-in page so people
// can see what they'll get before signing in. Built with the same colours and shapes as the real
// screens (not screenshots), so they stay sharp and on-theme. The sample data below is made up.

/** The card the previews sit in: a slice of the app's screen */
function PreviewFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-60 flex-col gap-2 overflow-hidden rounded-card border border-line bg-page/60 p-3 text-left [mask-image:linear-gradient(to_bottom,black_80%,transparent)]">
      {children}
    </div>
  )
}

const Dot = ({ opened }: { opened: boolean }) => (
  <span
    className={cn(
      'mt-1 size-2 shrink-0 rounded-full',
      opened ? 'bg-opened' : 'border-[1.5px] border-pending',
    )}
  />
)

/** Like the home screen: collections with "x of y opened" */
export function CollectionsPreview() {
  const collections = [
    { name: 'Vendor deals', opened: 3, total: 5, when: '12m ago' },
    { name: 'Hiring', opened: 6, total: 8, when: '1h ago' },
    { name: 'Invoices', opened: 7, total: 12, when: 'Yesterday' },
    { name: 'Partnerships', opened: 0, total: 3, when: 'Mon' },
  ]
  return (
    <PreviewFrame>
      {collections.map((collection) => (
        <div key={collection.name} className="rounded-xl border border-line bg-surface px-3 py-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[13px] font-semibold">{collection.name}</span>
            <span className="shrink-0 text-[11px] text-fg-faint">{collection.when}</span>
          </div>
          <span className="mt-1 flex items-center gap-1.5 text-[11px] text-fg-soft">
            <span className="size-1.5 rounded-full bg-opened" />
            {collection.opened} of {collection.total} opened
          </span>
        </div>
      ))}
    </PreviewFrame>
  )
}

/** Like the email screen: opened status, first/last opened, timeline */
export function EmailStatusPreview() {
  return (
    <PreviewFrame>
      <div className="px-1">
        <p className="text-[13px] font-semibold">Q4 vendor proposal — revised pricing</p>
        <p className="text-[11px] text-fg-muted">To priya@acme.com</p>
      </div>
      <div className="rounded-xl border border-line bg-surface p-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-opened/16 text-opened">
            <Icon name="eye" size={16} />
          </span>
          <span className="flex flex-col">
            <span className="text-[13px] font-semibold text-opened">Opened</span>
            <span className="text-[11px] text-fg-muted">3 times</span>
          </span>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-line pt-2.5 text-[11px]">
          <span className="flex flex-col">
            <span className="text-fg-muted">First opened</span>
            <span className="font-semibold">Today, 10:58</span>
          </span>
          <span className="flex flex-col">
            <span className="text-fg-muted">Last opened</span>
            <span className="font-semibold">Today, 13:30</span>
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 px-1 text-[11px]">
        {[
          ['Tracker added', 'Today, 10:40'],
          ['Opened', 'Today, 10:58'],
        ].map(([step, when]) => (
          <span key={step} className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-success" />
            <span className="flex-1 font-medium">{step}</span>
            <span className="text-fg-faint">{when}</span>
          </span>
        ))}
      </div>
    </PreviewFrame>
  )
}

/** Like a collection screen: the filter and a list of emails, opened or not */
export function TrackedEmailsPreview() {
  const emails = [
    { to: 'priya@acme.com', subject: 'Q4 vendor proposal', opened: true },
    { to: 'rahul@acme.com', subject: 'Onboarding checklist', opened: true },
    { to: 'ananya@acme.com', subject: 'Contract draft', opened: false },
    { to: 'vikram@acme.com', subject: 'Partnership intro', opened: false },
  ]
  return (
    <PreviewFrame>
      <div className="flex gap-1 rounded-lg bg-surface p-0.5 text-[11px]">
        {['All 5', 'Opened 3', 'Not opened 2'].map((tab, index) => (
          <span
            key={tab}
            className={cn(
              'flex-1 rounded-md py-1 text-center',
              index === 0 ? 'bg-surface-active font-semibold' : 'text-fg-muted',
            )}
          >
            {tab}
          </span>
        ))}
      </div>
      {emails.map((email) => (
        <div key={email.to} className="flex gap-2 border-b border-divider px-1 py-1.5">
          <Dot opened={email.opened} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="flex justify-between gap-2">
              <span className="truncate text-[12px] font-semibold">{email.to}</span>
              <span
                className={cn(
                  'shrink-0 text-[10px] font-semibold',
                  email.opened ? 'text-opened' : 'text-fg-muted',
                )}
              >
                {email.opened ? 'Opened' : 'Not opened'}
              </span>
            </span>
            <span className="truncate text-[11px] text-fg-soft">{email.subject}</span>
          </span>
        </div>
      ))}
    </PreviewFrame>
  )
}
