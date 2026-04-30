import { copyHtml } from '../utils/clipboard'
import { toast } from '../utils/toast'

/** Copies the tracking pixel and says how it went with a toast */
export function useCopyPixel() {
  return async function copyPixel(html: string) {
    try {
      await copyHtml(html)
      toast.info('Pixel copied. Paste it at the end of your email.')
    } catch {
      toast.error("Couldn't copy the pixel. Please try again.")
    }
  }
}
