# Backend (`apps/api`)

## Layers

| Layer       | Purpose                                                    |
| ----------- | ---------------------------------------------------------- |
| `routes/`   | HTTP: request parsing, status handling, feature invocation |
| `features/` | Business logic (clients, appointments, sync)               |
| `db/`       | Drizzle schema, client, migrations                         |
| `auth/`     | Better Auth, session middleware                            |
| `config/`   | env (Zod), no secrets in code                              |

Route handlers should not contain heavy logic — only orchestration.

## Types and Validation

- Use `type` for Hono `Variables`, request/response bodies, and local DTOs.
- API input and output should use Zod schemas from `@work-planner/shared`; do not duplicate business rules in routes.
- SQLite mapping (`snake_case`) ↔ DTO (`camelCase`) should be handled in features or mappers, not in handlers.

## Errors and Responses

- Predictable JSON format: `{ error: "..." }` (such as `unauthorized`, `account_not_active`).
- Do not expose stack traces to clients in production.

## Database and Auth

- Use a single shared SQLite connection for both Drizzle and Better Auth (avoid two `Database` instances for the same file).
- Production APIs should only work when `profile.status = active` ([middleware](../../../apps/api/src/auth/middleware.ts)).

## Tests

- Integration: Hono `app.request(...)`.
- Unit: business rules via `@work-planner/shared` helpers.
- DB: schema, migrations, constraints — tested separately from route smoke tests.

## Avoid

- Duplicating Zod schemas in the API if they already exist in `shared`.
