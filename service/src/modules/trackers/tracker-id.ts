import { randomBytes } from 'node:crypto'

// Tracker ids appear in public links, e.g. /t/kX3v9QpL2mZa/pixel.gif
// 9 random bytes = 12 URL-safe characters = 72 bits: impossible to guess, short enough for an email.
export const TRACKER_ID_LENGTH = 12
export const TRACKER_ID_PATTERN = /^[A-Za-z0-9_-]{12}$/

export function generateTrackerId(): string {
  return randomBytes(9).toString('base64url')
}
