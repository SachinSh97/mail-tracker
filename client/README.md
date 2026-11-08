# Mail Tracker – web client

React + TypeScript + Vite app for the service in [`../service`](../service).
Runtime dependencies: `react`, `react-dom` and `react-router-dom` (routing). Data loading and dialogs are plain browser features.
Styling is [Tailwind CSS](https://tailwindcss.com) v4 (build-time only, nothing ships to the browser but the generated CSS).

## Run locally

```sh
# 1. start the service (needs GOOGLE_CLIENT_ID + SESSION_SECRET in service/.env)
cd ../service && npm run dev

# 2. start the client
cd ../client
pnpm install
cp .env.example .env   # then set VITE_GOOGLE_CLIENT_ID
pnpm dev               # http://localhost:5173, then "Sign in with Google"
```

In dev, Vite proxies `/api` to `http://localhost:4000`, so nothing needs configuring.
For a production build against a deployed service, set `VITE_API_URL` (see `.env.example`).

## Screens

| URL                | Screen                                                                      |
| ------------------ | --------------------------------------------------------------------------- |
| `/`                | Collections, with "x of y opened"                                           |
| `/track`           | Add a tracker (`?collection=<id>` pre-selects one)                          |
| `/collections/:id` | Emails in a collection, filterable by status (`none` = not in a collection) |
| `/trackers/:id`    | One email: status, first/last opened, timeline, copy pixel, remove          |

## Code layout

```
src/
  App.tsx              renders the router
  router.tsx           route table: URL pattern → screen (react-router-dom)
  layouts/             AppLayout: the page frame around every screen
  screens/             one file per screen: layout and wiring only
  components/          shared UI; login/ holds the sign-in page slider and its app previews.
                       Other shared UI: (RequireAuth sign-in guard, confirm sheet, menu, tracker list, icons…)

  services/            talks to the server, no React
    http.ts            fetch wrapper: auth header, errors, 401 → sign out
    session.ts         signed-in user's email and name (no token; the session is an HttpOnly cookie)
    auth.service.ts    Google sign-in (redirect flow) / sign out
    collections.service.ts
    trackers.service.ts
    notifications.service.ts
    live-events.ts     one Server-Sent Events connection while signed in; screens subscribe
    unread-count.ts    the number on the notifications bell
    types.ts           shapes returned by the API

  hooks/               React hooks holding the app logic
    useQuery.ts        load data (cancels stale requests)
    useCarousel.ts     swipeable slides: active slide, dots, auto-advance
    useLiveEvents.ts   useLiveConnection (in RequireAuth), useLiveEvent (screens), useUnreadCount (bell)
    useNotifications.ts the notifications screen: list, live reload, mark as read
    useMutation.ts     run a save/delete: busy state, error toast, optional success toast
    useToasts.ts       the toasts on screen
    useSession.ts      the signed-in user
    useCollectionsOverview.ts, useCollection.ts, useTracker.ts,
    useTrackersPage.ts, useTrackerFilter.ts, useAddTrackerForm.ts,
    useCopyToClipboard.ts, useDocumentTitle.ts

  constants/
    routes.ts          every app URL: ROUTES (patterns) + paths.tracker(id) etc. (builds links)
    collections.ts     "Not in a collection" id and name
  utils/               plain helpers: format.ts, clipboard.ts, toast.ts (toast.info / toast.error), ui.ts (Tailwind classes)
  index.css            Tailwind entry: design tokens (@theme), font, page defaults
```

How a screen fits together: **screen → hook → service → http**.
Screens never call `fetch` or a service's data loader directly; they ask a hook,
and the hook uses a service. To add an API call, add it to the right `*.service.ts`;
to add logic a screen needs, put it in a hook.
Messages: actions report through toasts (`toast.info` / `toast.error`, gone after 5s). Screens that can't load or have
nothing to show use `<Placeholder>` / `<ErrorState>` from `components/LoadState.tsx`, with an SVG from `Illustration.tsx`.

Never hard-code an app URL: link with `paths.*` from `constants/routes.ts`.

## Styling

- Design colours, radii and the font are Tailwind theme tokens in `src/index.css`, so you write
  `bg-surface`, `text-fg-muted`, `border-line`, `rounded-card` instead of hex values.
- Styles used in many places (buttons, inputs, cards) live in `src/utils/ui.ts`:
  `className={buttonClass('primary', 'lg')}`. Everything else is written inline where it's used.
- Formatting: Prettier, same settings as the service (`.prettierrc.json`).

## Sign-in (Google)

Google's standard redirect flow (OpenID Connect), with no Google script on the page:

1. **Sign in with Google** sends the browser to Google, with a random `state` and `nonce` saved in `sessionStorage`.
2. Google sends it back to `/auth/callback#id_token=…`.
3. The app checks `state` (the response belongs to a sign-in this tab started) and `nonce` (the token was minted for it),
   then posts the ID token to `POST /api/v1/auth/google`. The service verifies it with Google and sets its own
   session as an **HttpOnly cookie** (valid `SESSION_TTL_DAYS`). The browser sends it with every API call;
   the app's code never sees it. Only the user's email and name are kept in `localStorage`, for the UI.
4. The callback page is replaced in history, so Google's token never stays in the URL.

One-time Google Cloud setup (Google Auth Platform → Clients → your **Web application** client):

| Setting                       | Value                                                                      |
| ----------------------------- | -------------------------------------------------------------------------- |
| Authorised JavaScript origins | `http://localhost:5173`, your production URL                               |
| Authorised redirect URIs      | `http://localhost:5173/auth/callback`, `https://<your-site>/auth/callback` |

Use the same client ID for `VITE_GOOGLE_CLIENT_ID` (client) and `GOOGLE_CLIENT_ID` (service).

## SEO, accessibility and performance

**SEO** (only the sign-in page at `/` is public; everything else needs an account)

- Title, description, Open Graph / Twitter tags and `public/og-image.png` (1200×630) for link previews.
- Set `VITE_SITE_URL` when building for production: it adds the canonical link, absolute preview-image URL and `sitemap.xml`.
- `robots.txt` (generated at build) allows `/` and blocks the private pages.
- `manifest.webmanifest` + icons, so the app can be installed and shows the right icon everywhere.
- JSON-LD (`WebApplication`) in `index.html` describes the app to search engines.

**Accessibility**

- One `<main>` and one `<h1>` per screen; page titles change with the screen.
- After an in-app navigation, focus moves to the new screen (as a full page load would).
- Toasts sit in a live region: errors interrupt (`role="alert"`), info is read at the next pause. Load errors are alerts too.
- All controls work by keyboard (the dropdown follows the ARIA select-only combobox pattern), focus is always visible,
  icon-only buttons have labels, and status never relies on colour alone.
- Movement (sheet, toasts, dropdown, skeleton pulse) is skipped when the OS asks for reduced motion.
- Text colours pass WCAG AA contrast (4.5:1+) on every background they're used on.

**Web vitals**

- Screens other than home and sign-in are loaded on demand (`lazy` routes), so the first load is smaller.
- The font is preloaded and self-hosted; the API connection is opened early (`preconnect`) when it's on another domain.
- Loading placeholders match the real rows' height, keeping layout shift (CLS) low.

## Security notes

- The session is an **HttpOnly, SameSite=Lax cookie** set by the service: page scripts can't read it, so a
  script-injection bug can't steal it, and other websites can't make the browser send it with their requests.
  Nothing secret is stored in `localStorage`.
- Signing out calls `POST /api/v1/auth/logout`, which deletes the cookie.
- The app loads no third-party scripts or fonts, and production builds include a strict Content-Security-Policy
  (see `vite.config.ts`).
- The web app and API should be on the **same site** (Vite's proxy does this locally), so the cookie is a normal
  first-party cookie that every browser accepts.
- A `401` from the API signs the user out automatically.
- External links use `rel="noopener noreferrer"`.

## Scripts

| Command        | What it does                    |
| -------------- | ------------------------------- |
| `pnpm dev`     | Dev server with hot reload      |
| `pnpm build`   | Type-check and build to `dist/` |
| `pnpm preview` | Serve the production build      |
| `pnpm lint`    | Lint with oxlint                |

The designs this app is built from are in [`designs/`](designs/).
