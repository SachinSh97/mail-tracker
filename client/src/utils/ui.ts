// Tailwind class lists that many screens share, kept in one place so buttons
// and inputs look the same everywhere. One-off styles live next to their markup.

/** Joins class names, skipping empty ones: cn('a', isOn && 'b') */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

const buttonBase =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap px-4 transition disabled:opacity-60'

const buttonVariants = {
  primary:
    'bg-linear-to-b from-accent-light to-accent font-semibold text-on-accent hover:text-on-accent hover:brightness-105',
  outline: 'border border-line-strong font-medium text-fg hover:bg-surface-hover hover:text-fg',
  danger: 'bg-danger font-semibold text-on-danger hover:text-on-danger',
  ghostDanger: 'font-medium text-danger hover:bg-danger/10',
}

const buttonSizes = {
  sm: 'h-10 rounded-btn text-[13px]',
  md: 'h-11 rounded-xl text-sm',
  lg: 'h-12.5 rounded-card text-base',
}

/** Class list for a <button> or a <Link> that should look like one */
export function buttonClass(
  variant: keyof typeof buttonVariants,
  size: keyof typeof buttonSizes = 'md',
): string {
  return cn(buttonBase, buttonSizes[size], buttonVariants[variant])
}

/** Square icon-only button: back, close, "•••" */
export const iconButton =
  'inline-flex size-11 shrink-0 items-center justify-center rounded-btn text-fg-soft hover:bg-surface-hover hover:text-fg aria-expanded:bg-surface-hover aria-expanded:text-fg'

export const input =
  'h-11.5 w-full rounded-xl border border-line-strong bg-surface px-3 text-[15px] placeholder:text-fg-faint focus:border-accent focus:outline-none'

export const card = 'rounded-card border border-line bg-surface'

export const field = 'flex flex-col gap-2'
export const fieldLabel = 'text-[13px] text-fg-soft'
export const fieldHint = 'text-xs text-fg-faint'
export const errorText = 'text-[13px] text-danger'

export const screen = 'flex flex-1 flex-col'
export const screenBody = 'flex flex-1 flex-col gap-4.5 px-5 pt-3 pb-5'
/**
 * A screen's top bar that stays in view while the content scrolls (on a phone the page scrolls,
 * on wider screens the phone frame does; sticky works for both). No background of its own: content
 * scrolling underneath is blurred, so the header stays readable on the background glow.
 */
export const stickyHeader = 'sticky top-0 z-10 backdrop-blur-md'

export const screenTitle = 'text-lg font-semibold tracking-[-0.01em]'
