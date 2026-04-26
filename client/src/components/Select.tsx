import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { useClickOutside } from '../hooks/useClickOutside'
import { cn, input } from '../utils/ui'
import { Icon, type IconName } from './Icon'

export interface SelectOption {
  value: string
  label: string
  /** Shown before the label, e.g. "plus" for an action like "New collection" */
  icon?: IconName
  /** Draws a line above this option, to separate it from the ones before */
  separated?: boolean
}

interface Props {
  /** Put this on the <label>'s htmlFor */
  id: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

/**
 * A dropdown that looks like the rest of the app (the native <select> can't be styled).
 * Follows the "select-only combobox" accessibility pattern, so it works like a native one:
 *
 * - Click, Enter, Space, ↓ or ↑ opens it.
 * - While open: ↑ ↓ Home End move, Enter/Space picks, Escape/Tab closes, typing a letter jumps to it.
 * - Focus stays on the button; screen readers follow the highlighted option (aria-activedescendant).
 */
export function Select({ id, value, options, onChange, disabled = false, placeholder = 'Select…' }: Props) {
  const listId = useId()
  const optionId = (index: number) => `${listId}-option-${index}`

  const [open, setOpen] = useState(false)
  // The option highlighted by the keyboard or mouse while the list is open
  const [activeIndex, setActiveIndex] = useState(0)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selectedIndex = options.findIndex((option) => option.value === value)
  const selected = options[selectedIndex]

  useClickOutside(wrapperRef, open, () => setOpen(false))

  // Keep the highlighted option visible when moving through a long list
  useEffect(() => {
    if (!open) return
    listRef.current
      ?.querySelector(`#${CSS.escape(optionId(activeIndex))}`)
      ?.scrollIntoView({ block: 'nearest' })
  })

  function openList() {
    setActiveIndex(Math.max(selectedIndex, 0))
    setOpen(true)
  }

  function choose(index: number) {
    const option = options[index]
    if (option) onChange(option.value)
    setOpen(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const last = options.length - 1

    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault()
        openList()
      }
      return
    }

    // Typing a letter jumps to the next option starting with it
    if (event.key.length === 1 && event.key !== ' ') {
      const letter = event.key.toLowerCase()
      const order = [...options.keys()].map((step) => (activeIndex + 1 + step) % options.length)
      const match = order.find((index) => options[index].label.toLowerCase().startsWith(letter))
      if (match !== undefined) setActiveIndex(match)
      return
    }

    const moves: Record<string, () => void> = {
      ArrowDown: () => setActiveIndex((index) => Math.min(index + 1, last)),
      ArrowUp: () => setActiveIndex((index) => Math.max(index - 1, 0)),
      Home: () => setActiveIndex(0),
      End: () => setActiveIndex(last),
      Enter: () => choose(activeIndex),
      ' ': () => choose(activeIndex),
      Escape: () => setOpen(false),
    }
    if (event.key === 'Tab')
      setOpen(false) // let the browser move focus as usual
    else if (moves[event.key]) {
      event.preventDefault()
      moves[event.key]()
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? optionId(activeIndex) : undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
        className={cn(
          input,
          'flex items-center gap-2 text-left disabled:opacity-60',
          open && 'border-accent',
        )}
      >
        {selected?.icon && <Icon name={selected.icon} size={18} />}
        <span className={cn('flex-1 truncate', !selected && 'text-fg-faint')}>
          {selected?.label ?? placeholder}
        </span>
        <span className={cn('text-fg-soft motion-safe:transition-transform', open && 'rotate-180')}>
          <Icon name="chevronDown" />
        </span>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-labelledby={id}
          className="absolute inset-x-0 top-[calc(100%+6px)] z-10 max-h-[min(22rem,55dvh)] overflow-y-auto rounded-xl border border-line-strong bg-surface-raised p-1.5 shadow-[0_12px_32px_rgb(0_0_0/0.45)] motion-safe:animate-pop-in"
        >
          {options.map((option, index) => {
            const isSelected = index === selectedIndex
            return (
              <li
                key={option.value}
                id={optionId(index)}
                role="option"
                aria-selected={isSelected}
                // Keep focus on the button while clicking an option
                onMouseDown={(event) => event.preventDefault()}
                // mousemove, not mouseenter: a list opening under a resting cursor mustn't steal the keyboard highlight
                onMouseMove={() => activeIndex !== index && setActiveIndex(index)}
                onClick={() => choose(index)}
                className={cn(
                  'flex h-11 cursor-pointer items-center gap-2.5 rounded-lg px-3 text-[15px]',
                  index === activeIndex && 'bg-surface-hover',
                  option.icon ? 'text-link' : 'text-fg',
                  option.separated &&
                    'relative mt-1.5 before:absolute before:inset-x-1 before:-top-1 before:border-t before:border-line',
                )}
              >
                {option.icon && <Icon name={option.icon} size={18} />}
                <span className="flex-1 truncate">{option.label}</span>
                {isSelected && (
                  <span className="text-accent">
                    <Icon name="check" size={18} />
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
