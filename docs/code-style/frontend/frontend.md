# Frontend

Applies to all files: `apps/web/*`.

[React](./react.md)

## Stack

- Vite + React + TypeScript
- TanStack Router — routing, [router.tsx](../../../apps/web/src/router.tsx)
- TanStack Query — server state
- Better Auth — [auth-client.ts](../../../apps/web/src/auth/auth-client.ts)
- Tailwind — tokens from [07-design-system.md](../../07-design-system.md)
- Dexie — offline support (when the layer appears in `src/`)

## `src/` Structure

| Folder | Purpose |
| --- | --- |
| `views/` | Pages tied to routes |
| `ui/` | Reusable presentational components |
| `hooks/` | Reusable logic |
| `api/` | `fetch`, without UI |
| `auth/` | auth client |
| `config.ts` | `VITE_*`, base API URL |

## Routing

- Route tree lives in `router.tsx`; type-safe `Register` is an exception where `interface` is allowed (see general).
- Protected / pending / auth states should be handled via route `beforeLoad` or layout (as implemented).
- Placeholder pages belong in `views/`, not in `ui/`.

## Server State (TanStack Query)

- Queries should live in views or `hooks/use-*.ts`, not deep inside `ui/*`.
- `queryKey` should use stable arrays; mutations should use `invalidateQueries` where needed.
- API errors should display user-friendly messages, not raw `response.text()` in the UI.

## API Client

- Use `credentials: "include"` for cookie-based sessions.
- Response types should align with `@work-planner/shared` or narrow local types in `api/`.

## Styles

- No inline `style`, except for dynamic values.
- Mobile-first approach, layouts based on [07-design-system.md](../../07-design-system.md).

## Config

- Access `import.meta.env.VITE_*` only through [config.ts](../../../apps/web/src/config.ts).

## Tests (non-React)

- Unit tests for pure utilities: `*.test.ts` next to the file.