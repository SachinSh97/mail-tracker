import type { Request, Response } from 'express'
import * as trackingService from './tracking.service.js'

// Smallest valid transparent 1×1 GIF (43 bytes)
const TRANSPARENT_PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

// GET /t/:trackerId/pixel.gif
// Public: this URL lives inside the email, so there's no login.
// Always returns the image, even for unknown trackers, so nothing ever looks broken in the email.
export async function openPixel(req: Request, res: Response): Promise<void> {
  await trackingService.recordPixelHit(String(req.params.trackerId), {
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  })

  res
    .status(200)
    .set({
      // Mail apps and proxies must ask us again on every open, otherwise repeat opens are invisible
      'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
      // Keep search engines from listing tracker URLs
      'X-Robots-Tag': 'noindex, nofollow',
    })
    .type('image/gif')
    .send(TRANSPARENT_PIXEL)
}
