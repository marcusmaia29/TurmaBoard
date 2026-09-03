# Rooms and the agenda feed

The Salas screen (`/rooms`) answers one question: which rooms are free right
now, and when does the next class start in them. It is the only part of
TurmaBoard whose data does not come from Supabase.

## Why a serverless function exists

Insper publishes the institutional calendar as XML at
`https://cgi.insper.edu.br/agenda/xml/ExibeCalendario.xml`. The browser cannot
read it directly: the upstream sends no CORS headers, so a `fetch` from the
application origin is blocked.

`api/agenda.ts` is a Vercel serverless function that fetches the feed
server-side, converts it to JSON, and serves it from our own origin. It is a
read-only proxy — it holds no credentials, accepts no parameters, and writes
nothing. This is the project's only server-side code; everything else is a
static bundle talking to Supabase.

## Request contract

```text
GET /api/agenda  ->  200 { "events": AgendaEvent[], ... }
```

Only `GET` is accepted; anything else returns `405` with an `Allow` header.
The shape lives in `src/features/rooms/agenda.types.ts` and is shared by the
function and the frontend, which is why `tsconfig.api.json` includes that one
file from `src/`.

Errors are returned as `{ error: { code, message } }` with a Portuguese
`message` suitable for display:

| Status | Code | Meaning |
| --- | --- | --- |
| 405 | `METHOD_NOT_ALLOWED` | A verb other than `GET` was used |
| 502 | `UPSTREAM_ERROR` | Insper returned a non-2xx response or was unreachable |
| 502 | `RESPONSE_TOO_LARGE` | The feed exceeded the 2 MB ceiling |
| 502 | `INVALID_UPSTREAM_RESPONSE` | The XML did not parse into the expected shape |
| 504 | `UPSTREAM_TIMEOUT` | Insper did not answer within 8 seconds |

`src/features/rooms/room.service.ts` is the only caller. It validates that the
body actually carries an `events` array before handing it to the UI, so a
malformed success response fails loudly instead of rendering an empty board.

## Defensive limits

The upstream is outside our control, so the function constrains it:

- **Timeout** — 8 s, enforced with an `AbortController`.
- **Size ceiling** — 2 MB, checked against `content-length` *and* enforced while
  streaming, because a missing or lying header must not be trusted.
- **Caching** — `Vercel-CDN-Cache-Control: s-maxage=120, stale-while-revalidate=600`
  caches at the edge for two minutes and keeps serving stale data for ten more
  while it refreshes. Browsers are told `max-age=0, must-revalidate`.

The cache header is what keeps a class-wide refresh from turning into hundreds
of requests against Insper. Preserve that behavior when changing the endpoint.

## Parsing

`api/_lib/agenda.ts` holds the pure transformation, separate from the handler,
so it can be tested without network or Vercel runtime. It uses `fast-xml-parser`
and then normalizes aggressively, because the feed is inconsistent:

- dates arrive as `DD/MM/YYYY` and become `YYYY-MM-DD` keys;
- times arrive with varying width and become zero-padded `HH:MM`;
- entity escapes are decoded;
- event nodes are located by walking the tree for `CalendarioEvento` rather than
  assuming a fixed depth;
- each event gets a stable FNV-1a hash id, so React keys survive a refetch.

Treat every field as untrusted and possibly missing. The parser must never throw
on unexpected input — it returns what it could understand.

## Local development

`npm run dev` runs Vite alone, which does not serve `api/`. A request to
`/api/agenda` matches the SPA rewrite, returns `index.html`, and the Salas
screen shows its error state. That is expected, not a bug.

To exercise the endpoint locally, run the Vercel CLI instead:

```powershell
npx vercel dev
```

## Testing

| File | Covers |
| --- | --- |
| `src/features/rooms/agenda.parser.test.ts` | XML normalization and edge cases |
| `src/features/rooms/agenda.api.test.ts` | Handler behavior, limits, error mapping |
| `src/features/rooms/room.utils.test.ts` | Availability derived from the events |
| `src/features/rooms/RoomsPage.test.tsx` | Rendering and states |

Tests must not reach the network. Stub `fetch` and feed the parser fixture XML,
including malformed input — that path is the one most likely to break in
production, since it depends on a feed nobody here controls.

`tsconfig.api.json` type-checks `api/` separately from the browser app, and
`npm run build` runs both projects through `tsc -b`.
