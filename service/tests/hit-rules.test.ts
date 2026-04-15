import { describe, expect, it } from 'vitest'
import { classifyHit, looksLikeBot, type HitContext } from '../src/modules/tracking/hit-rules.js'

const GMAIL_PROXY =
  'Mozilla/5.0 (Windows NT 5.1; rv:11.0) Gecko Firefox/11.0 (via ggpht.com GoogleImageProxy)'
const CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36'

const created = new Date('2026-04-15T10:00:00Z')
const tenMinutesLater = new Date('2026-04-15T10:10:00Z')

// A normal recipient opening the email well after it was sent
const recipientHit: HitContext = {
  method: 'GET',
  userAgent: GMAIL_PROXY,
  visitorIp: '203.0.113.7',
  trackerCreatorIp: '198.51.100.1',
  trackerCreatedAt: created,
  now: tenMinutesLater,
  gracePeriodSeconds: 60,
}

describe('classifyHit', () => {
  it('counts a normal recipient open', () => {
    expect(classifyHit(recipientHit)).toBe('MAY_COUNT_AS_OPEN')
  })

  it('does not record HEAD requests', () => {
    expect(classifyHit({ ...recipientHit, method: 'HEAD' })).toBe('NOT_RECORDED')
  })

  it('ignores bots before anything else', () => {
    expect(classifyHit({ ...recipientHit, userAgent: 'Mimecast Safe Links Scanner' })).toBe('IGNORED_BOT')
  })

  it('ignores the owner (same IP that created the tracker)', () => {
    expect(classifyHit({ ...recipientHit, visitorIp: '198.51.100.1' })).toBe('IGNORED_OWNER')
  })

  it('ignores hits inside the grace period, and counts them right after', () => {
    const at = (seconds: number) => new Date(created.getTime() + seconds * 1000)
    expect(classifyHit({ ...recipientHit, now: at(59) })).toBe('IGNORED_GRACE_PERIOD')
    expect(classifyHit({ ...recipientHit, now: at(60) })).toBe('MAY_COUNT_AS_OPEN')
  })

  it('does not treat a missing creator IP as the owner', () => {
    expect(classifyHit({ ...recipientHit, trackerCreatorIp: null })).toBe('MAY_COUNT_AS_OPEN')
  })
})

describe('looksLikeBot', () => {
  it.each([
    ['Gmail image proxy', GMAIL_PROXY],
    ['Chrome', CHROME],
    ['Outlook', 'Microsoft Office/16.0 (Windows NT 10.0; Microsoft Outlook 16.0.17928; Pro)'],
    [
      'Apple Mail',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)',
    ],
  ])('lets real mail apps through: %s', (_name, userAgent) => {
    expect(looksLikeBot(userAgent)).toBe(false)
  })

  it.each([
    ['empty user agent', ''],
    ['no user agent', undefined],
    ['Slack previews', 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)'],
    ['Googlebot', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'],
    ['Barracuda', 'Barracuda Sentinel (EE)'],
    ['headless browser scanners', 'Mozilla/5.0 HeadlessChrome/120.0.0.0 Safari/537.36'],
    ['scripts', 'python-requests/2.32.3'],
  ])('flags automated visitors: %s', (_name, userAgent) => {
    expect(looksLikeBot(userAgent)).toBe(true)
  })
})
