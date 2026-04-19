import { Link } from 'react-router-dom'
import { Placeholder } from '../components/LoadState'
import { paths } from '../constants/routes'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { buttonClass } from '../utils/ui'

export function NotFoundScreen() {
  useDocumentTitle('Page not found')

  return (
    <main className="flex flex-1 flex-col">
      <Placeholder
        headingLevel="h1"
        illustration="notFound"
        title="Page not found"
        message="This link may be old, or the item was removed."
        action={
          <Link to={paths.home()} className={buttonClass('outline')}>
            Go to your collections
          </Link>
        }
      />
    </main>
  )
}
