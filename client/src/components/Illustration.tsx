import type { ReactNode } from 'react'

// Line drawings for placeholder screens, in the app's colours. Decorative only (aria-hidden):
// the heading next to them says what's going on.

export type IllustrationName = 'empty' | 'error' | 'notFound'

const STROKE = 'var(--color-fg-faint)'
const ACCENT = 'var(--color-accent)'
const FILL = 'var(--color-surface)'

export function Illustration({ name, size = 120 }: { name: IllustrationName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Soft glow behind every drawing */}
      <circle cx="60" cy="60" r="52" fill="var(--color-accent)" fillOpacity="0.06" />
      {drawings[name]}
    </svg>
  )
}

const drawings: Record<IllustrationName, ReactNode> = {
  // An open, empty envelope with a few sparkles: "nothing here yet"
  empty: (
    <>
      <path d="M30 52 60 30l30 22v34a4 4 0 0 1-4 4H34a4 4 0 0 1-4-4z" fill={FILL} stroke={STROKE} />
      <path d="m30 52 30 20 30-20" stroke={STROKE} />
      <path d="M44 46h32M48 54h24" stroke={ACCENT} strokeDasharray="4 5" />
      <path d="M94 26v8M90 30h8M24 32v6M21 35h6" stroke={ACCENT} />
    </>
  ),
  // A cloud with a broken connection: "couldn't load"
  error: (
    <>
      <path
        d="M40 82a16 16 0 0 1-2-31.9A22 22 0 0 1 80.5 46 18 18 0 0 1 82 82z"
        fill={FILL}
        stroke={STROKE}
      />
      <path d="M52 62l16 16M68 62 52 78" stroke="var(--color-danger)" />
      <path d="M60 90v6M54 100h12" stroke={STROKE} />
    </>
  ),
  // A magnifying glass with a question mark: "page not found"
  notFound: (
    <>
      <circle cx="54" cy="54" r="22" fill={FILL} stroke={STROKE} />
      <path d="m70 70 18 18" stroke={STROKE} strokeWidth="6" />
      <path d="M48 49a6 6 0 1 1 8 5.7c-1.3.5-2 1.6-2 3V60" stroke={ACCENT} />
      <path d="M54 66h.01" stroke={ACCENT} strokeWidth="4" />
    </>
  ),
}
