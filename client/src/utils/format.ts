// Date and number formatting, using the browser's built-in Intl APIs and the user's locale.

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' })
const weekdayFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short' })
const dayMonthFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })
const fullDateFormat = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
const fullDateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short' })

const DAY_MS = 24 * 60 * 60 * 1000

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/** How many calendar days ago: 0 = today, 1 = yesterday… */
function daysAgo(date: Date, now = new Date()): number {
  return Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS)
}

/** The day part on its own: "Today", "Yesterday", "Tue", "14 Aug", "14 Aug 2025" */
function formatDay(date: Date): string {
  const days = daysAgo(date)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days > 1 && days < 7) return weekdayFormat.format(date)
  if (date.getFullYear() === new Date().getFullYear()) return dayMonthFormat.format(date)
  return fullDateFormat.format(date)
}

/** "Today, 10:58" · "Yesterday, 16:20" · "Tue, 09:12" · "14 Aug, 09:12" · "14 Aug 2025" */
export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  const day = formatDay(date)
  // Older than this year: the date alone is enough
  if (date.getFullYear() !== new Date().getFullYear()) return day
  return `${day}, ${timeFormat.format(date)}`
}

/** "Sent today, 08:30" · "Sent Mon" (time is dropped once it's older than yesterday) */
export function formatSent(iso: string): string {
  const date = new Date(iso)
  const days = daysAgo(date)
  const when = days <= 1 ? formatDateTime(iso) : formatDay(date)
  return `Sent ${inSentence(when)}`
}

/** "Today, 10:58" → "today, 10:58" for use mid-sentence. Weekdays and months keep their capital. */
export function inSentence(text: string): string {
  return text.replace(/^(Today|Yesterday)/, (word) => word.toLowerCase())
}

/** Full date for tooltips and <time title>: "Tuesday, 14 August 2025 at 09:12" */
export function formatFullDateTime(iso: string): string {
  return fullDateTimeFormat.format(new Date(iso))
}

/** Short counts for tight spaces: 999 → "999", 1,240 → "1.2k", 15,800 → "16k", 120,000 → "99k+" */
export function formatCount(count: number): string {
  if (count < 1000) return String(count)
  if (count < 10_000) return `${Math.floor(count / 100) / 10}k`
  if (count < 100_000) return `${Math.round(count / 1000)}k`
  return '99k+'
}

/** "1 time" / "3 times" */
export function plural(count: number, word: string, pluralWord = `${word}s`): string {
  return `${count} ${count === 1 ? word : pluralWord}`
}
