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
3. The detail search only navigates to the next word route. It does not also issue a client API request. The initial server result is not copied to Redux or re-fetched during hydration. Redux providers are scoped to interactive search; there is no module-global shared store.
4. Laravel owns input normalization, language support, provider selection/credentials, sense mapping, source attribution and rate limits. Next.js validates the full nested presentation contract with Zod, displays plain React text, and permits only HTTP(S) source links. It never calls Merriam-Webster directly.

All fetches use `cache: no-store` and omit credentials. Word routes use `force-dynamic`; word links disable prefetching. RTK Query holds the currently displayed response in memory, discards unused entries immediately, never persists to browser storage, and does not poll or refetch on focus/reconnect. Static home/source pages contain no provider definitions.

The API contract contains `data: { word, language, origin, meanings: [{ part_of_speech, senses: [{ definitions, examples }], pronunciations }], source }`. The complete schema is in `src/types/dictionary.ts`; backend details are in [the public API contract](../backend/docs/public-lookup-api.md).

404 uses the not-found page; 422, 429, service failures, timeouts and malformed responses provide safe feedback. Route loading and unexpected render errors have their own boundaries. Missing examples/pronunciation are stated honestly. Pronunciation is **text only**: audio playback and external attributed quotations are not part of this release.

## CORS and future authentication

The inspected Laravel runtime inherits CORS for `api/*`: all origins, methods and headers, `supports_credentials=false`. Anonymous browser GETs work with `credentials: omit`; server fetches are not subject to browser CORS. No CORS override or API route change was needed.

Sanctum cookie authentication is a future milestone. It is not installed/configured by this slice. When implementing end-user auth, configure explicit frontend origins, credentialed CORS, stateful domains, HTTPS/shared cookie domain, CSRF bootstrap and the existing `web` User guard. Do not use Admin/Fortify login for public users. Login, saved vocabulary, learning progress, extension changes and end-user dashboards remain out of scope.

Before production, resolve trusted ingress/proxy configuration: server-rendered requests currently share the Next server IP's **30 lookups/minute** Laravel quota. Do not blindly forward client-controlled IP headers. Provider-wide quota monitoring and website deployment/licensing review also remain pending. This implementation makes no change to source licensing or permanent storage policy.

## Checks

```sh
npm run lint
npm run types:check
npm test
npm run build
```

`npm test` checks nested payload validation, URL encoding, no-store/no-cookie requests, 404/422/429/503, malformed data, missing configuration, safe links, and isolated Redux stores. `next build` does not run ESLint, so lint is a separate command. In a restricted sandbox, Turbopack workers may need permission for local sockets. If a denied worker error becomes cached, clear only generated `.next/cache` and retry with the necessary permissions.

For repeatable UI checks using original CC0 content, in separate terminals:

```sh
node tests/preview-api.mjs
LARAVEL_API_URL=http://localhost:8127/api/v1 NEXT_PUBLIC_LARAVEL_API_URL=http://localhost:8127/api/v1 npm run dev -- --hostname 127.0.0.1 --port 3100
```

The fixture serves `hello`, 429 for `busy`, 503 for `offline`, 422 for `invalid`, and 404 for other words. It is a separate loopback server, not an application mode. Stop both processes after checking. Laravel integration is covered separately by `vendor/bin/pest tests/Feature/Dictionary` from `backend/`, using isolated databases and mocked providers.

Verified desktop and 390px mobile layouts, search-to-detail navigation, pronunciation/examples/source credit, loading, not-found recovery, rate-limit and service-unavailable feedback with fixture data. No live provider request, application database write, deployment or authentication implementation was performed.

Dependency audit at implementation: `npm audit --omit=dev` reports zero vulnerabilities. The full audit reports five high-severity development dependency findings from one `braces` advisory in Next's ESLint dependency chain; no compatible patched `braces` version was available. Do not use `npm audit fix --force` to downgrade the Next lint configuration.

Lito artwork was supplied by the owner. The unmodified Merriam-Webster logo was reused from the existing extension's official branding asset and is displayed with Merriam-Webster entries. Original uploads remain untouched.
