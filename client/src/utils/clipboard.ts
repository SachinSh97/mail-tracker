/**
 * Copies the tracking pixel. We copy it as rich HTML so that pasting into Gmail
 * inserts the (invisible) image itself rather than the text of an <img> tag.
 * Browsers without rich clipboard support fall back to plain text.
 */
export async function copyHtml(html: string): Promise<void> {
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([html], { type: 'text/plain' }),
      }),
    ])
    return
  }
  await navigator.clipboard.writeText(html)
}
