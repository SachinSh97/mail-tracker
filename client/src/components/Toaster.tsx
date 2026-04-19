import { useToasts } from '../hooks/useToasts'
import { toast, type Toast } from '../utils/toast'
import { cn } from '../utils/ui'
import { Icon } from './Icon'

/**
 * Shows toasts at the bottom of the app: on a phone, the bottom of the screen;
 * on wider screens, the bottom of the phone frame. Rendered once, in AppLayout.
 */
export function Toaster() {
  const toasts = useToasts()

  return (
    // Not clickable itself, so the page underneath stays usable; each toast turns clicks back on
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 p-4 sm:absolute"
    >
      {toasts.map((item) => (
        <ToastMessage key={item.id} toast={item} />
      ))}
    </div>
  )
}

function ToastMessage({ toast: { id, type, message } }: { toast: Toast }) {
  const isError = type === 'error'

  return (
    <div
      // Screen readers: errors interrupt (role=alert); info is read at the next pause (the polite region above)
      role={isError ? 'alert' : undefined}
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-surface-raised py-3 pr-2 pl-3.5 text-[13px] leading-snug shadow-[0_12px_32px_rgb(0_0_0/0.5)] motion-safe:animate-toast-in',
        isError ? 'border-danger/40' : 'border-line-strong',
      )}
    >
      <span className={cn('mt-0.5 shrink-0', isError ? 'text-danger' : 'text-success')}>
        <Icon name={isError ? 'alert' : 'check'} size={18} />
      </span>
      <p className="flex-1 py-0.5 text-fg">{message}</p>
      <button
        type="button"
        className="-my-1 inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-hover hover:text-fg"
        onClick={() => toast.dismiss(id)}
        aria-label="Dismiss"
      >
        <Icon name="close" size={16} />
      </button>
    </div>
  )
}
