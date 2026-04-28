import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useMutation } from '../hooks/useMutation'
import { buttonClass } from '../utils/ui'

interface Props {
  open: boolean
  title: ReactNode
  message: ReactNode
  confirmLabel: string
  /** Do the work here. The sheet shows "Working…" until it finishes; on failure it closes and an error toast explains. */
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * A bottom sheet asking "are you sure?" before something destructive.
 * Built on the native <dialog>, which already traps focus, closes on Escape
 * and hides the rest of the page from screen readers.
 */
export function ConfirmSheet({ open, title, message, confirmLabel, onConfirm, onCancel }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const confirm = useMutation(onConfirm)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function cancel() {
    if (!confirm.busy) onCancel()
  }

  async function handleConfirm() {
    const succeeded = await confirm.run()
    // Close on failure so the error toast isn't hidden behind the dimmed backdrop
    if (!succeeded) onCancel()
  }

  return (
    <dialog
      ref={dialogRef}
      // Phone: pinned to the bottom of the screen. Wider screens: pinned to the bottom of the phone
      // frame, inside its bezel (the sheet lives in the browser's top layer, so it's placed with the
      // same --frame-* sizes the frame uses instead of being nested in it).
      className="mx-auto mt-auto mb-0 max-h-none w-full max-w-none rounded-t-[20px] border-t border-line-strong bg-surface text-fg backdrop:bg-black/60 motion-safe:open:animate-slide-up sm:mb-[calc((100dvh-var(--frame-height))/2+var(--frame-bezel))] sm:w-[calc(var(--frame-width)-2*var(--frame-bezel))] sm:rounded-b-[calc(var(--frame-radius)-var(--frame-bezel))]"
      aria-labelledby={titleId}
      // Escape key: keep React state in sync instead of letting the browser close it alone
      onCancel={(event) => {
        event.preventDefault()
        cancel()
      }}
      // A click on the dimmed backdrop lands on the <dialog> element itself
      onClick={(event) => event.target === event.currentTarget && cancel()}
    >
      <div className="flex flex-col gap-2.5 p-5">
        <h2 id={titleId} className="text-[17px] font-semibold wrap-anywhere">
          {title}
        </h2>
        <p className="mb-2 text-sm/normal text-fg-soft">{message}</p>
        <button
          type="button"
          className={buttonClass('danger', 'lg')}
          onClick={handleConfirm}
          disabled={confirm.busy}
        >
          {confirm.busy ? 'Working…' : confirmLabel}
        </button>
        <button
          type="button"
          className={buttonClass('outline', 'lg')}
          onClick={cancel}
          disabled={confirm.busy}
        >
          Cancel
        </button>
      </div>
    </dialog>
  )
}
