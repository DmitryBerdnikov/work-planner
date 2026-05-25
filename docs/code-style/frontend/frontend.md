# Frontend

Applies to all files: `apps/web/*`.

[React](./react.md)

## Stack

- Vite + React + TypeScript
- TanStack Router — routing, [router.tsx](../../../apps/web/src/app/router.tsx)
- TanStack Query — server state
- Better Auth — [auth-client.ts](../../../apps/web/src/shared/auth/auth-client.ts)
- Tailwind — tokens from [07-design-system.md](../../07-design-system.md)
- Dexie — offline support (when the layer appears in `src/`)

## `src/` Structure

| Folder | Purpose |
| --- | --- |
| `app/` | Bootstrap (`main.tsx`), providers, router, global styles |
| `pages/` | Route entry components (one file per route) |
| `shared/` | Cross-module code: HTTP transport, auth client, UI primitives, config, `cn` |
| `modules/<feature>/` | Feature logic: `model/`, `hooks/`, `ui/`, optional `api/` |
| `test/` | Vitest setup |

### `shared/`

| Subfolder | Purpose |
| --- | --- |
| `api/` | `apiRequest`, `ApiError` — transport only |
| `auth/` | Better Auth client |
| `config/` | `VITE_*` via `env.ts` |
| `ui/` | App shell, Button, other primitives |
| `lib/` | Pure helpers (`cn`) |

### `modules/<feature>/`

| Subfolder | Purpose |
| --- | --- |
| `api/` | Optional feature API wrappers when generated API needs mapping, normalization, offline behavior, or batching |
| `model/` | Query keys, constants, pure mappers (no React) |
| `hooks/` | TanStack Query, page/feature hooks |
| `ui/` | Feature-specific presentational components |
| `index.ts` | Public exports for other modules (use sparingly) |

## Import Rules

- `app/` imports from `pages/*` and `shared/*`.
- `pages/` imports from `modules/<feature>/*` and `shared/*`.
- `modules/<feature>/` imports from `shared/*` and its own subfolders.
- **Between modules:** only via `modules/<name>/index.ts`. No deep imports like `modules/clients/hooks/...` from another module.
- Generated API can be imported in `modules/<feature>/hooks/` or `modules/<feature>/model/`.
- UI components must not import generated API directly.

## Routing

- Route tree lives in `app/router.tsx`; pages are imported from `pages/*`.
- Protected / pending / auth states should be handled via route `beforeLoad` or layout (as implemented).
- Placeholder pages belong in `pages/`, not in `shared/ui/`.

## Server State (TanStack Query)

- Queries should live in `pages/` or `modules/<feature>/hooks/`, not deep inside `ui/`.
- Query keys should live in `modules/<feature>/model/` when non-trivial.
- `queryKey` should use stable arrays; mutations should use `invalidateQueries` where needed.
- Do not use the `void` operator to silence async work in frontend code. Prefer `await` in async handlers/callbacks or explicit error handling.
- API errors should display user-friendly messages, not raw `response.text()` in the UI.

## API Client

- Use `credentials: "include"` for cookie-based sessions (via `shared/api/http.ts`).
- Generated Orval functions should return success response bodies directly; non-2xx responses are thrown as `ApiError`.
- Generated Orval API lives in `shared/api/generated/` and is not edited manually.
- Add `modules/<feature>/api/` only when the module needs real API-specific behavior beyond calling generated functions.

## Styles

- No inline `style`, except for dynamic values.
- Mobile-first approach, layouts based on [07-design-system.md](../../07-design-system.md).

## Config

- Access `import.meta.env.VITE_*` only through [env.ts](../../../apps/web/src/shared/config/env.ts).

## Tests

- Page/integration: `pages/*.test.tsx`.
- Hook unit: `modules/<feature>/hooks/*.test.ts` when needed.
- Pure model: `modules/<feature>/model/*.test.ts`.
- Shared utilities: `*.test.ts` next to the file.

## New Feature Checklist

- [ ] Route component in `pages/<feature>-page.tsx`
- [ ] Module folder `modules/<feature>/` with `hooks/`, `ui/` and `model/` when keys/mappers exist
- [ ] No cross-module deep imports
- [ ] Generated API imported only from module hooks/model, not from UI
