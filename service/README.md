# Mail Tracker — Service

Backend (REST API + SSE) that tells you when a recruiter opens your job-application email.

## How it works

**v1 tracks opens with a pixel only.**

Each email gets one **tracker**. In the web app ([`../client`](../client)) you copy the tracker's invisible
1×1 image (the **pixel**) and paste it into the email in Gmail. When the recipient's mail app shows the email, it downloads the pixel from us, and the
first real download marks the tracker as **opened** (once).

Every download is saved as a **hit**, even ignored ones, so you can see exactly what happened.

Not in v1: tracked LinkedIn / GitHub / resume links.

## Tech stack

Node.js 20+ · TypeScript · Express 5 · Prisma 7 · PostgreSQL (Neon) · Zod · pino · SSE

## Setup

1. Create a free Postgres database at [neon.tech](https://neon.tech) and copy its connection string (**Connect** button).
2. Create your env file and fill it in:
   ```bash
   cp .env.example .env
   ```
3. Install and create the database tables (applies the migrations in `prisma/migrations`):
   ```bash
   npm install
   npm run db:deploy
   ```
4. Start the dev server (restarts on file changes):
   ```bash
   npm run dev
   ```
5. Check it: `curl localhost:4000/health` → `{"status":"ok","database":"up",...}`

## Scripts

| Script                    | What it does                                               |
| ------------------------- | ---------------------------------------------------------- |
| `npm run dev`             | Run locally with auto-restart                              |
| `npm run build` / `start` | Compile to `dist/` and run it (production)                 |
| `npm test`                | Run all tests (starts its own throwaway Postgres)          |
| `npm run typecheck`       | Check types without building                               |
| `npm run lint` / `format` | ESLint / Prettier                                          |
| `npm run db:migrate`      | Create a migration from `schema.prisma` and apply it (dev) |
| `npm run db:deploy`       | Apply existing migrations (production)                     |
| `npm run db:studio`       | Browse the database in your browser                        |

## Project structure

```
service/
├─ prisma/
│  ├─ schema.prisma          database tables: users, collections, trackers, hits
│  └─ migrations/            SQL migrations (committed, applied with db:deploy)
├─ prisma.config.ts          tells the Prisma CLI where the schema and DB are
└─ src/
   ├─ server.ts              starts the HTTP server, handles shutdown
   ├─ app.ts                 builds the Express app (middleware + routes)
   ├─ config/env.ts          reads and validates environment variables
   ├─ database/              shared Prisma client
   ├─ routes/                /api/v1 router (adds authentication)
   ├─ middlewares/           authenticate, error handler, 404 handler
   ├─ modules/               one folder per feature (routes → controller → service → repository)
   │  ├─ auth/               Google sign-in, session cookie, GET /api/v1/me
   │  ├─ users/              find-or-create the user on sign-in
   │  ├─ health/             GET /health
   │  ├─ collections/        optional groups of trackers
   │  ├─ trackers/           trackers + the pixel to insert into an email
   │  └─ tracking/           the public pixel + the "counts as opened" rules
   ├─ shared/                logger, HTTP errors, pagination
   └─ generated/prisma/      Prisma client (generated, not committed)
tests/
├─ setup/                    throwaway Postgres + fake Google sign-in
└─ *.test.ts                 one file per module, real HTTP requests + real database
```

## API

All `/api/v1` routes need auth (see below). Lists return `{ items, pagination: { limit, offset, total } }`
and accept `?limit=` (1–100, default 20) and `?offset=`.

**General**

| Method | Path                  | Description                                                |
| ------ | --------------------- | ---------------------------------------------------------- |
| GET    | `/health`             | Public. `200` if healthy, `503` if DB down                 |
| POST   | `/api/v1/auth/google` | Public. `{ idToken }` → sets the session cookie (see Auth) |
| POST   | `/api/v1/auth/logout` | Public. Ends the session (all devices), deletes the cookie |
| GET    | `/api/v1/me`          | Who you are: `{ id, email, name }`                         |

**Collections** — optional groups, e.g. one per company

| Method | Path                                | Description                                           |
| ------ | ----------------------------------- | ----------------------------------------------------- |
| POST   | `/api/v1/collections`               | `{ name, description? }`                              |
| GET    | `/api/v1/collections`               | List, newest first, with `trackerCount`/`openedCount` |
| GET    | `/api/v1/collections/:collectionId` | One collection                                        |
| PATCH  | `/api/v1/collections/:collectionId` | `{ name?, description? }`                             |
| DELETE | `/api/v1/collections/:collectionId` | Deletes the collection; its trackers are kept         |

**Trackers** — one per email

| Method | Path                          | Description                                                                                                                  |
| ------ | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/api/v1/trackers`            | All optional: `{ name, emailSubject, recipientEmails, collectionId }`. Returns the tracker, including `pixel: { url, html }` |
| GET    | `/api/v1/trackers`            | List. Filters: `?collectionId=<id>` or `none`, `?status=opened` or `not-opened`                                              |
| GET    | `/api/v1/trackers/:trackerId` | One tracker + its latest 100 hits (`id`, `outcome`, `createdAt`; never the recipient's IP or browser)                        |
| PATCH  | `/api/v1/trackers/:trackerId` | `{ name?, emailSubject?, recipientEmails?, collectionId? }` (`collectionId: null` = remove from collection)                  |
| DELETE | `/api/v1/trackers/:trackerId` | Deletes the tracker and its hits                                                                                             |

Every tracker response includes `pixel.html`, the exact `<img>` tag to insert into the email.

Someone else's collection or tracker returns `404`, exactly like one that doesn't exist.

**Notifications**: one per real open of your emails (the first open, or opened again), newest first

| Method | Path                                 | Notes                                                                              |
| ------ | ------------------------------------ | ---------------------------------------------------------------------------------- |
| GET    | `/api/v1/notifications`              | `?limit&offset`. Each item: `{ id, firstOpen, createdAt, unread, tracker: { … } }` |
| GET    | `/api/v1/notifications/unread-count` | `{ count }`: opens since you last looked (the number on the bell)                  |
| POST   | `/api/v1/notifications/seen`         | `{ seenUntil }`: marks everything up to that time as read (never moves backwards)  |

They come straight from the `hits` table (no separate table), so deleting a tracker removes its notifications.
"Unread" means opened after `users.notifications_seen_at`.

**Live events**: `GET /api/v1/live-events` is a Server-Sent Events stream (signed in by the session cookie).
Each open of one of your emails sends:

```
event: tracker-opened
data: {"type":"tracker-opened","trackerId":"…","notificationId":"…","firstOpen":true,"openedAt":"…"}
```

A comment line is sent every 25 s so proxies keep the connection open. Events are passed around in memory
(`modules/live-events/live-events.bus.ts`), which is correct while the service runs as a single instance.

**Public pixel** — this URL goes inside the email, no auth

| Method | Path                      | Returns                                                                           |
| ------ | ------------------------- | --------------------------------------------------------------------------------- |
| GET    | `/t/:trackerId/pixel.gif` | Invisible 1×1 GIF (always, even for unknown ids, so the email never looks broken) |

Rate limited to 300 requests per minute per IP. Responses are never cached, so every open reaches us.

## When does a hit count as "opened"?

Every download of the pixel is saved as a **hit** with its IP, user agent and an **outcome**.
The rules live in `src/modules/tracking/hit-rules.ts` and are checked in this order:

| #   | Situation                                          | Outcome                | Opens the tracker? |
| --- | -------------------------------------------------- | ---------------------- | ------------------ |
| 1   | `HEAD` request (URL checkers)                      | not saved              | no                 |
| 2   | Bot or security scanner (user agent)               | `IGNORED_BOT`          | no                 |
| 3   | Same IP that created the tracker (you)             | `IGNORED_OWNER`        | no                 |
| 4   | Within `TRACKING_GRACE_PERIOD_SECONDS` of creation | `IGNORED_GRACE_PERIOD` | no                 |
| 5   | First hit that passes 1–4                          | `COUNTED_AS_OPEN`      | **yes, once**      |
| 6   | Any later hit that passes 1–4                      | `ALREADY_OPENED`       | already open       |

"Only once" is enforced by the database (a single conditional `UPDATE`), so simultaneous hits can't both count.

## Auth

Users sign in with Google. There is no sign-up and no password: the first sign-in starts an empty account.

```
Web app: "Sign in with Google" → Google ID token (valid 1 hour)
   └─ POST /api/v1/auth/google { idToken }        (public)
        service checks the token is from Google, for our GOOGLE_CLIENT_ID, email verified
   ◄─ Set-Cookie: session=<token>; HttpOnly; SameSite=Strict; Secure (production)   (valid SESSION_TTL_DAYS)
      body: { user: { id, email, name }, expiresAt }   (the token is never in a response body)
Every other /api/v1 request: the browser sends the cookie by itself
POST /api/v1/auth/logout → ends every session of the user on the server, deletes the cookie
```

- **Users:** the first sign-in creates a row in `users`. Returning users are recognised by their Google ID
  (`google_id`, which never changes even if their Gmail address does); email and name are refreshed each time.
- **Session cookie:** holds a JWT signed with `SESSION_SECRET` that carries the user's ID and session version. It's
  `HttpOnly` (scripts can't read it), `SameSite=Strict` (never sent on a request another website starts, not even a
  link that navigates the tab), and `Secure` with the `__Host-` prefix in production. Changing `SESSION_SECRET`
  signs everyone out. Each request also checks the user still exists.
- **Sign-out:** adds 1 to `users.session_version`, so every token issued before stops working at once, even a copied
  one. This signs the user out on all their devices.
- **Origin check:** POST/PATCH/DELETE requests whose `Origin` is neither the service's own address nor in
  `CORS_ORIGINS` get `403`, a second line of defence against cross-site requests (including sibling subdomains).
- **Rate limits:** sign-in 20/min per IP, the pixel 300/min per IP, changes (POST/PATCH/DELETE) 60/min per user.
- **Production settings:** the service refuses to start if `NODE_ENV` isn't `production` on Render, or if
  `PUBLIC_BASE_URL` / `CORS_ORIGINS` aren't `https://`. `TRUST_PROXY_HOPS` is how many proxies add
  `X-Forwarded-For` (1 for Render alone; check it after deploying, see `DEPLOY.md`).
- **CORS:** off by default, since the web app calls the API from the same site. Origins in `CORS_ORIGINS` may call
  it with cookies; every other website is refused. When the web app forwards `/api` from its own address (Render),
  put that address in `CORS_ORIGINS` so the Origin check accepts it.
- **Ownership:** every collection and tracker has a `user_id`, and every query filters by it, so users only
  ever see their own data. Deleting a user deletes all their collections, trackers and hits.

```
users ──1:N──► collections
  └───1:N──► trackers ──1:N──► hits      (a tracker may also belong to one collection)
```

## Errors

Every error has the same shape:

```json
{ "error": { "code": "NOT_FOUND", "message": "Route GET /nope does not exist" } }
```
