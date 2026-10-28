# Lito Dictionary web

The public website lives in `lito-dictionary/web/`, beside `backend/` and `extension/`. Built with Next.js 16.4 App Router, React 19.3, TypeScript, Tailwind CSS v4, shadcn/ui primitives, Redux Toolkit and RTK Query. Node 22.13+ is required; use the latest Node 22 LTS (`nvm use`). npm is the package manager.

## Run locally

From `web/`:

```sh
npm ci
cp .env.example .env.local # only on first setup; preserve any existing local values
npm run dev
```

Run Laravel separately from `backend/`, for example `php artisan serve` on port 8000. The website opens on port 3000. No database migration is required for public lookup. The current Laravel service needs its existing Merriam-Webster product/key configured in the backend environment. Never put provider keys in Next.js.

| Variable | Purpose | Local example |
| --- | --- | --- |
| `LARAVEL_API_URL` | Server-only API root; internal addresses are allowed | `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_LARAVEL_API_URL` | Browser-reachable API root, embedded during build | `http://localhost:8000/api/v1` |

Both values include `/api/v1`. Rebuild after changing the public value. Use HTTPS addresses in production. Missing or invalid configuration displays safe connection feedback; there is no production fixture fallback.

## Structure

```text
src/
  app/                         Pages, layout, metadata and route states
    dictionary/[word]/         Dynamic server-rendered word detail
  components/                  Shared header/footer
    ui/                        shadcn button/input, reused from the Admin project
  features/account/            Cookie transport, session/private RTK APIs, auth and settings
  features/vocabulary/         Saved words and personal examples
  features/history/            Private 30-day search history
  features/dictionary/
    api/                       Shared transport, server fetch, RTK Query endpoint
    components/                Search, word presentation, attribution, retry
  lib/                         Class names and safe external-link handling
  store/                       Per-mounted-provider Redux store
  types/                       Runtime response schema and inferred TypeScript models
public/branding/               Owner-supplied Lito assets and official source logo
```

## Request flow and rendering

1. The home page is statically rendered. Submitting its Client Component search form invokes RTK Query, which calls Laravel directly: `GET /api/v1/dictionary/lookup?word=…&language=en`. Searches are explicit submissions, not autocomplete requests. A preview shows a definition, source credit and a link to the full word page.
2. `/dictionary/[word]` is dynamic. Its Server Component calls Laravel with server-only configuration. The initial HTML contains the word, parts of speech, pronunciation, definitions, examples and source credit. Metadata and page rendering share a request-scoped React `cache()` wrapper so they do not make duplicate lookups.
3. The detail search only navigates to the next word route. It does not also issue a client API request. The initial server result is not copied to Redux or re-fetched during hydration. A single provider creates a store per browser mount; server-rendered children remain Server Components. There is no module-global shared store.
4. Laravel owns input normalization, language support, provider selection/credentials, sense mapping, source attribution and rate limits. Next.js validates the full nested presentation contract with Zod, displays plain React text, and permits only HTTP(S) source links. It never calls Merriam-Webster directly.

All public dictionary fetches use `cache: no-store` and omit credentials. Word routes use `force-dynamic`; word links disable prefetching. RTK Query holds the currently displayed response in memory, discards unused entries immediately, never persists to browser storage, and does not poll or refetch on focus/reconnect. Static home/source pages contain no provider definitions.

The API contract contains `data: { word, language, origin, meanings: [{ part_of_speech, senses: [{ definitions, examples }], pronunciations }], source }`. The complete schema is in `src/types/dictionary.ts`; backend details are in [the public API contract](../backend/docs/public-lookup-api.md).

404 uses the not-found page; 422, 429, service failures, timeouts and malformed responses provide safe feedback. Route loading and unexpected render errors have their own boundaries. Missing examples/pronunciation are stated honestly. Pronunciation is **text only**: audio playback and external attributed quotations are not part of this release.

## Accounts and private data

The website now includes `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/account`, `/vocabulary`, `/vocabulary/[id]`, and `/history`. There is no learning dashboard or extension token UI.

Account pages render public shells on the server with `noindex` and `no-referrer` metadata. Private data is fetched only in client components. Laravel remains the authority for authentication, email verification, recent authentication and ownership. Client guards improve the experience but do not grant access.

Use **localhost consistently**: website `http://localhost:3000`, API `http://localhost:8000`. In Laravel configure:

```dotenv
USER_FRONTEND_URL=http://localhost:3000
USER_FRONTEND_ORIGINS=http://localhost:3000
SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost:8000
USER_PASSKEY_RP_ID=localhost
```

Keep local cookies host-only; configure mail delivery to receive reset/verification links. The three pending User migrations must be reviewed/applied through the normal backend process before accounts work. This frontend milestone does **not** apply them to the application database. See [backend setup and routes](../backend/docs/user-api.md).

Browser mutations bootstrap `/sanctum/csrf-cookie`, then include cookies and the decoded `XSRF-TOKEN` in `X-XSRF-TOKEN`. Private CORS allows exact frontend origins and credentials. Public lookup retains wildcard, credential-free CORS. The client does not store tokens or passwords in Redux/localStorage, follow credentialed redirects, retry mutations automatically, or send User cookies from Server Components.

RTK Query has separate public, session and private-resource APIs. Typed Zod validation checks private resource envelopes and cursor pages. Account authentication forms call the shared transport directly so passwords never become Redux action/cache arguments. Auth/profile changes perform a full navigation to destroy private memory; BroadcastChannel tells other open tabs to reload without transmitting account details. Focus/visibility and 401/403 responses recheck the session and discard private resource caches. Forms remain mounted but hidden during session rechecks. Private cache entries are dropped when unused, and there is no persistence or offline queue.

Saving a word creates only a word/language bookmark, including when a provider has no definition. Opening a saved word links to fresh anonymous dictionary lookup. Personal examples render as escaped plain text. Submitted searches record separate history events only when a verified session is already known; typing, links, prefetch, public server rendering and anonymous searches never record history. A failed history request does not block lookup. The history screen filters expired rows and refreshes periodically; Laravel enforces the 30-day boundary and scheduled cleanup.

Verification emails now open `/verify-email` with Laravel’s signed target intact. The client accepts only the configured API origin and exact verification route before sending cookies. Password reset links open `/reset-password`. Passkeys use the browser’s native WebAuthn JSON conversion API, with feature detection and password fallback. Enrollment and sensitive changes require recent password or passkey confirmation. Platform/hardware authenticator compatibility needs manual verification on supported target browsers; no custom cryptography or new dependency was added.

Production domains, HTTPS/Secure cookie settings, cross-subdomain CSRF cookie visibility and Admin cookie isolation require review before deployment. Localhost cookies are shared across ports, so signing out of the shared Laravel session can also sign out Admin.

Before production, resolve trusted ingress/proxy configuration: server-rendered requests currently share the Next server IP's **30 lookups/minute** Laravel quota. Do not blindly forward client-controlled IP headers. Provider-wide quota monitoring and website deployment/licensing review also remain pending. This implementation makes no change to source licensing or permanent storage policy.

## Checks

```sh
npm run lint
npm run types:check
npm test
npm run build
```

`npm test` checks public and private payload validation, URL encoding, credential-free public requests, cookie/CSRF private requests, safe error messages, no mutation retries, trusted verification targets, return paths, and private Redux cache isolation/reset. `next build` does not run ESLint, so lint is a separate command. In a restricted sandbox, Turbopack workers may need permission for local sockets. If a denied worker error becomes cached, clear only generated `.next/cache` and retry with the necessary permissions.

For repeatable UI checks using original CC0 content, in separate terminals:

```sh
node tests/preview-api.mjs
LARAVEL_API_URL=http://localhost:8127/api/v1 NEXT_PUBLIC_LARAVEL_API_URL=http://localhost:8127/api/v1 npm run dev -- --hostname 127.0.0.1 --port 3100
```

The fixture serves `hello`, 429 for `busy`, 503 for `offline`, 422 for `invalid`, and 404 for other words. It is a separate loopback server, not an application mode. Stop both processes after checking. Laravel integration is covered separately by `vendor/bin/pest tests/Feature/Dictionary` from `backend/`, using isolated databases and mocked providers.

Verified desktop and 390px mobile layouts, search-to-detail navigation, pronunciation/examples/source credit, loading, not-found recovery, rate-limit and service-unavailable feedback with fixture data. These original public-slice checks used no live provider requests. Account milestone verification is recorded in [project status](../backend/docs/project-status.md); application data remains untouched.

Dependency audit at implementation: `npm audit --omit=dev` reports zero vulnerabilities. The full audit reports five high-severity development dependency findings from one `braces` advisory in Next's ESLint dependency chain; no compatible patched `braces` version was available. Do not use `npm audit fix --force` to downgrade the Next lint configuration.

Lito artwork was supplied by the owner. The unmodified Merriam-Webster logo was reused from the existing extension's official branding asset and is displayed with Merriam-Webster entries. Original uploads remain untouched.
