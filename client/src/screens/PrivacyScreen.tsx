import type { ReactNode } from 'react'
import { Link } from '../components/Link'
import { Icon } from '../components/Icon'
import { paths } from '../constants/routes'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { iconButton, screen, screenTitle, stickyHeader } from '../utils/ui'

// Public page (no sign-in needed). Google requires a privacy policy link before sign-in can be
// opened to everyone. Keep it in step with what the app really does: if the data the service
// stores changes, update this page and LAST_UPDATED.

const LAST_UPDATED = '9 November 2026'
const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL?.trim() || null

export function PrivacyScreen() {
  useDocumentTitle('Privacy policy')

  return (
    <div className={screen}>
      <header className={`${stickyHeader} flex items-center gap-1 pt-3 pr-3 pb-1 pl-2`}>
        <Link to={paths.home()} className={iconButton} aria-label="Back to Seenly">
          <Icon name="back" />
        </Link>
        <h1 className={screenTitle}>Privacy policy</h1>
      </header>

      <main className="flex flex-col gap-6 px-5 pt-2 pb-10 text-sm/relaxed text-fg-soft">
        <p className="text-xs text-fg-muted">Last updated {LAST_UPDATED}</p>

        <p>
          Seenly tells you when emails you send are opened. This page explains what we store, why, and what
          you can do about it. In short: we keep only what the app needs, we don’t sell or share it, and there
          are no ads or analytics.
        </p>

        <Section title="When you sign in">
          <p>
            You sign in with Google. We receive your <strong>email address</strong>, your{' '}
            <strong>name</strong> and Google’s ID for your account, and keep them to recognise you next time.
            We never get your password and never access your Gmail or any other Google data.
          </p>
        </Section>

        <Section title="What you add">
          <p>
            For each email you track we store what you enter: the <strong>subject</strong>, the{' '}
            <strong>recipients’ email addresses</strong>, and the <strong>collection</strong> you put it in.
            We also store the IP address you created the tracker from, so your own views of the email aren’t
            counted as opens.
          </p>
        </Section>

        <Section title="People who receive your emails">
          <p>
            Each tracked email contains an invisible image. When a recipient’s mail app loads it, we record
            the <strong>time</strong>, the <strong>IP address</strong> it came from and the{' '}
            <strong>browser or mail app</strong> that loaded it. We use these only to decide whether it was a
            real open (and not, for example, a security scanner or you), and to tell you when it was opened.
            You see the times; the IP address and browser details are never shown to you.
          </p>
          <p>
            Gmail and some other services load images through their own servers, so for those we usually see
            the service’s address, not the recipient’s.
          </p>
          <p>
            If you track emails, you’re responsible for doing so lawfully where you and your recipients are,
            which in some places means telling them.
          </p>
        </Section>

        <Section title="Cookies and storage in your browser">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              One <strong>sign-in cookie</strong>, so you stay signed in. Scripts can’t read it and it’s only
              sent to Seenly.
            </li>
            <li>
              Your <strong>name, email and when your sign-in ends</strong>, kept in your browser to show the
              right screen straight away.
            </li>
          </ul>
          <p>No tracking or advertising cookies, and no third-party scripts.</p>
        </Section>

        <Section title="Who handles the data">
          <p>
            We don’t sell, rent or share your data. It’s stored and processed by the services Seenly runs on:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Render</strong>: hosts the app and the service
            </li>
            <li>
              <strong>Neon</strong>: hosts the database
            </li>
            <li>
              <strong>Google</strong>: handles sign-in
            </li>
          </ul>
        </Section>

        <Section title="How long we keep it">
          <p>
            Until you delete it. Removing a tracker deletes it and its whole open history. Deleting a
            collection keeps its trackers. To delete your account and everything in it, contact us (below).
          </p>
        </Section>

        <Section title="Security">
          <p>
            Everything travels over HTTPS. You can only ever see your own data. Signing out ends your session
            on our side too, on all your devices.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions, or want your data deleted?{' '}
            {CONTACT_EMAIL ? (
              <>
                Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
              </>
            ) : (
              'Contact the person who runs this copy of Seenly.'
            )}
          </p>
        </Section>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-base font-semibold text-fg">{title}</h2>
      {children}
    </section>
  )
}
