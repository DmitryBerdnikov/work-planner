# Work Planner — notes for AI agents

Core project information, technology stack, environment configuration, and available commands can be found in: [README.md](README.md)

## Defaults

- Match existing patterns in `apps/web/src` before adding new abstractions.
- Minimize diff scope; reuse `packages/shared` for contracts and business rules.

## Local Dev Servers

- Treat local dev servers as long-lived session processes.
- At the start of browser/API verification, first check whether the expected servers are already available:
  - frontend: `http://127.0.0.1:5173`
  - API: `http://127.0.0.1:3000`
- If a required server is already running, reuse it instead of starting another process.
- If a required server is not running, start it with the normal dev command:
  - frontend: `pnpm --filter @work-planner/web dev`
  - API: `pnpm --filter @work-planner/api dev`
- Do not stop standard dev servers after verification unless the user explicitly asks.
- Do not start duplicate Vite/API processes on fallback ports like `5174` or `5175` without first checking the standard URL.
- If a port is busy, inspect the existing server with browser/health checks before starting a replacement.
