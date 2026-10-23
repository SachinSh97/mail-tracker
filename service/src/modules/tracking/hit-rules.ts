// Decides whether a load of the pixel should count as "the recipient opened it".
// Pure function (no database, no Express), so the rules are easy to read and to test.
//
// Rules, checked in this order:
//   1. HEAD request         → not recorded at all (scanners check URLs with HEAD, mail apps never do)
//   2. Bot / scanner        → IGNORED_BOT
//   3. Same IP as creator   → IGNORED_OWNER         (you, viewing your own email)
//   4. Too soon after create→ IGNORED_GRACE_PERIOD  (your draft loading the pixel)
//   5. Otherwise            → MAY_COUNT_AS_OPEN     (the first one of these opens the tracker)

export type HitClassification =
  'NOT_RECORDED' | 'IGNORED_BOT' | 'IGNORED_OWNER' | 'IGNORED_GRACE_PERIOD' | 'MAY_COUNT_AS_OPEN'

export interface HitContext {
  method: string
  userAgent: string | undefined
  visitorIp: string | undefined
  trackerCreatorIp: string | null
  trackerCreatedAt: Date
  now: Date
  gracePeriodSeconds: number
}

// User-agent fragments of automated visitors. Kept specific on purpose: real mail apps
// (e.g. Gmail's "GoogleImageProxy", Outlook, Apple Mail) must NOT match.
const BOT_USER_AGENT_PATTERN = new RegExp(
  [
    'bot\\b',
    'crawler',
    'spider',
    'slurp',
    'preview', // link previewers (Slack, WhatsApp, Teams…)
    'scanner',
    'barracuda', // email security products
    'mimecast',
    'proofpoint',
    'safelinks', // Microsoft Defender Safe Links
    'headlesschrome',
    'python-requests',
    'go-http-client',
    'java/',
    'okhttp',
  ].join('|'),
  'i',
)

export function looksLikeBot(userAgent: string | undefined): boolean {
  // Every real mail app and browser sends a user agent
  if (!userAgent?.trim()) return true
  return BOT_USER_AGENT_PATTERN.test(userAgent)
}

export function classifyHit(context: HitContext): HitClassification {
  if (context.method === 'HEAD') return 'NOT_RECORDED'

  if (looksLikeBot(context.userAgent)) return 'IGNORED_BOT'

  if (context.visitorIp && context.trackerCreatorIp && context.visitorIp === context.trackerCreatorIp) {
    return 'IGNORED_OWNER'
  }

  const secondsSinceCreated = (context.now.getTime() - context.trackerCreatedAt.getTime()) / 1000
  if (secondsSinceCreated < context.gracePeriodSeconds) return 'IGNORED_GRACE_PERIOD'

  return 'MAY_COUNT_AS_OPEN'
}
