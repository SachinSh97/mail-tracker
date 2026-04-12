import { env } from '../../config/env.js'

// The invisible image that goes inside the email. When a mail app shows the email,
// it downloads this image from us, and that download is how we know it was opened.
export interface TrackerPixel {
  /** e.g. https://my-app.onrender.com/t/kX3v9QpL2mZa/pixel.gif */
  url: string
  /** Ready-to-insert HTML: a 1×1 image with no border and empty alt text (nothing shows if images are off) */
  html: string
}

export function buildTrackerPixel(trackerId: string): TrackerPixel {
  const url = `${env.PUBLIC_BASE_URL}/t/${trackerId}/pixel.gif`
  const html = `<img src="${url}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;">`
  return { url, html }
}
