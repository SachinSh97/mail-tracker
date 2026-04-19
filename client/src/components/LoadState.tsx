import type { ReactNode } from 'react'
import { buttonClass, cn } from '../utils/ui'
import { Illustration, type IllustrationName } from './Illustration'

/** Placeholder rows shown while a list loads, so the layout doesn't jump when data arrives. */
export function Skeleton({ rows = 3, rowClassName = 'h-17.5' }: { rows?: number; rowClassName?: string }) {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className={cn('rounded-xl bg-surface motion-safe:animate-pulse', rowClassName)} />
      ))}
    </div>
  )
}

interface PlaceholderProps {
  illustration: IllustrationName
  title: string
  message?: ReactNode
  /** A button or link, e.g. "Try again" or "Track an email" */
  action?: ReactNode
  /** Use h1 when the placeholder is the whole page (e.g. 404) */
  headingLevel?: 'h1' | 'h2'
  /** "alert" makes screen readers announce it as soon as it appears (used for load errors) */
  role?: 'alert'
}

/** A centred drawing with a short explanation: used for empty lists, load errors and 404. */
export function Placeholder({
  illustration,
  title,
  message,
  action,
  headingLevel = 'h2',
  role,
}: PlaceholderProps) {
  const Heading = headingLevel
  return (
    <div
      role={role}
      className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center"
    >
      <Illustration name={illustration} />
      <Heading className="mt-1 text-base font-semibold">{title}</Heading>
      {message && <p className="max-w-64 leading-normal text-fg-muted">{message}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

/** Shown when a screen's data couldn't be loaded */
export function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <Placeholder
      role="alert"
      illustration="error"
      title="Couldn’t load this"
      message={error.message}
      action={
        <button type="button" className={buttonClass('outline')} onClick={onRetry}>
          Try again
        </button>
      }
    />
  )
}
