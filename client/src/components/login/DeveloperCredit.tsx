const GITHUB_PROFILE_URL = 'https://github.com/SachinSh97'

/** "Developed by SachinSh97" at the bottom of the sign-in page, linking to the GitHub profile. */
export function DeveloperCredit() {
  return (
    <footer className="shrink-0 px-5 pt-3 pb-5 text-center text-xs text-fg-faint">
      Developed by{' '}
      <a
        href={GITHUB_PROFILE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-link underline-offset-2 hover:text-link-hover hover:underline"
      >
        SachinSh97
      </a>
    </footer>
  )
}
