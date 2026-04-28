import { useEffect, useRef, useState } from 'react'
import { useClickOutside } from '../hooks/useClickOutside'
import { cn, iconButton } from '../utils/ui'
import { Icon, type IconName } from './Icon'

export interface MenuOption {
  label: string
  icon: IconName
  danger?: boolean
  onSelect: () => void
}

/** The "•••" button with a small dropdown. Closes on Escape, on outside click, or after picking an option. */
export function OptionsMenu({ label, options }: { label: string; options: MenuOption[] }) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  useClickOutside(wrapperRef, open, () => setOpen(false))

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setOpen(false)
      buttonRef.current?.focus()
    }

    // Keyboard users land on the first option
    wrapperRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        className={iconButton}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <Icon name="more" />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={label}
          className="absolute top-[calc(100%+4px)] right-0 z-10 flex w-50 flex-col rounded-xl border border-line-strong bg-surface-raised p-1.5 shadow-[0_12px_32px_rgb(0_0_0/0.45)]"
        >
          {options.map((option) => (
            <button
              key={option.label}
              type="button"
              role="menuitem"
              className={cn(
                'flex h-11 items-center gap-2.5 rounded-lg px-3 text-left text-sm hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none',
                option.danger ? 'text-danger' : 'text-fg',
              )}
              onClick={() => {
                setOpen(false)
                option.onSelect()
              }}
            >
              <Icon name={option.icon} size={16} />
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
