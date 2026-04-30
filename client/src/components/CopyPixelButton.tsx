import { useCopyPixel } from '../hooks/useCopyPixel'
import { buttonClass } from '../utils/ui'
import { Icon } from './Icon'

export function CopyPixelButton({ html, primary = false }: { html: string; primary?: boolean }) {
  const copyPixel = useCopyPixel()

  return (
    <button
      type="button"
      className={primary ? buttonClass('primary', 'lg') : buttonClass('outline')}
      onClick={() => copyPixel(html)}
    >
      <Icon name="copy" size={18} />
      Copy tracking pixel
    </button>
  )
}
