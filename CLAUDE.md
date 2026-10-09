# Stacklab – Project conventions

Interactive, local-first learning platform for IT topics. Author: SynKeles44. License: MIT.

**Always read [ROADMAP.md](ROADMAP.md) first** – it holds the phase plan, task status, decisions and the
"last done / next" log. Update it after every completed step.

## Layout

- `backend/` – Laravel REST API (PHP 8.5, Laravel 13, PostgreSQL, Sanctum tokens)
- `frontend/` – React 19 + TypeScript + Vite + Bun, Tailwind v4, **shadcn/ui only** as component library,
  React Router (Data Mode only), Zod, Motion, CodeMirror 6, xterm.js
- `sandbox/` – practice terminal container (Node gateway, node-pty, checks API)
- `content/` – all learning content (Markdown + YAML), imported by `php artisan stacklab:import`
- `docker/` – nginx, php and proxy configs
- `workspace/` – learner's local practice folder (gitignored, one subfolder per course)

## Rules

- Code, identifiers, commits, code comments: **English**. UI texts and learning content: **German**.
- Conventional Commits (`feat:`, `fix:`, `docs:`, `content:` …).
- No secrets, hostnames, account IDs or business data from other projects in content or code. Examples use placeholders
  like `example.com`, `123456789012`, `<dein-token>`.
- Content must pass `make validate` (runs `php artisan stacklab:validate`).
- UI components: add via shadcn CLI into `frontend/src/components/ui`; never add a second component library.
- Frontend: no `any`; validate API responses with Zod schemas in `frontend/src/lib/api`.

## Content format

See [CONTRIBUTING.md](CONTRIBUTING.md) and [content/README.md](content/README.md).

## Commands

- `make setup` / `docker compose up` – everything (build, migrate, import content, build frontend)
- `make dev` – Vite dev server with HMR on :5173
- `make test` – backend + frontend tests
- `make validate` – content validation
- `make import` – re-import content after editing
