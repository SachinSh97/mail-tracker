/** The Seenly app icon (same drawing as public/favicon.svg): an eye in a rounded square */
export function AppIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#1a1815" />
      <path
        d="M5 16s4-7 11-7 11 7 11 7-4 7-11 7S5 16 5 16z"
        fill="none"
        stroke="#e1b973"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="3.2" fill="#e1b973" />
    </svg>
  )
}
