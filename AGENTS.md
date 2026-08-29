<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Clarifications

When asking for clarification or a decision, use the `question` tool with explicit options. Include a recommended option when appropriate.

## Repository Knowledge Graph

This repository has a knowledge graph in `graphify-out/`.

- When the user types `/graphify`, invoke `skill: "graphify"` before doing anything else.
- For codebase questions, query the graph first when `graphify-out/graph.json` exists: `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"`.
- Use `graphify-out/wiki/index.md` for broad navigation when available.
- Dirty graph files are expected. Skip graphify only for graph-output problems or when explicitly requested.
- After modifying code, run `graphify update .`.

## Workspace Structure

Visuala is a pnpm/Turbo monorepo:

- `apps/app`: authenticated product and admin app.
- `apps/web`: marketing site.
- `packages/ui`: shared, reusable UI components.
- `packages/config`, `packages/tailwind`: shared configuration.

Use `pnpm` only. Prefer existing root or package scripts. Do not add another package manager or lockfile.

## `apps/app` Architecture

Follow this dependency direction:

```text
app / routes / UI / actions → application → domain
                                      ← infrastructure
```

- `app/**`: App Router routes, pages, layouts, route handlers, and route-local `_components` or `_sections`.
- `features/**`: feature UI, client components, server actions, schemas, and feature-specific types.
- `application/**`: use cases and business logic. Use verb-first names such as `create-billing-checkout.ts`.
- `domain/**`: domain models, types, errors, and repository contracts.
- `infrastructure/**`: Supabase and external adapters implementing domain contracts.
- `shared/**`: cross-feature configuration and genuinely shared application utilities.

Keep Supabase calls inside `infrastructure/**`. Application code depends on domain repository interfaces, never concrete infrastructure classes. Map database `snake_case` to domain/UI `camelCase` at repository boundaries.

Server actions belong in `features/**/actions`, start with `"use server"`, validate input with Zod schemas in `features/**/schemas`, and return small user-safe states. Do not expose raw infrastructure errors.

Admin pages, layouts, and mutations must use the existing `requireAdmin()` authorization helper. Prefer existing auth and service factories over duplicated checks.

## Components: Reusable First

Before creating a component:

1. Search `packages/ui/src` and its public exports in `packages/ui/src/index.ts`.
2. Reuse an existing component when it matches.
3. If the component is generic and useful across apps or features, add it to `packages/ui/src`, export it from `index.ts`, and keep app-specific data/behavior outside the shared package.
4. Keep a component inside its feature or route when it is specific to one product flow, domain, or screen.
5. Do not duplicate a shared primitive in `apps/app`.

Use existing patterns such as `apps/app/features/billing/components`: compose focused components (`BillingCheckoutForm`, `PaymentMethodSelector`, `PaymentStatusBanner`, and action panels) instead of putting an entire screen, state machine, data transformation, and presentation into one file. Split files by responsibility; prefer one main component per file. Extract only meaningful, cohesive pieces—do not create abstractions without reuse or a clear responsibility.

React components should be server components by default. Add `"use client"` only for browser state, events, or effects. Keep mutation logic in server actions, not client components. Make props explicit, minimal, and reusable; avoid feature-specific coupling in shared components.

## Clean Code

Follow the project’s TypeScript Clean Code guidance in `.opencode/skills/typescript-clean-code/` and inspect the closest existing implementation before coding.

- Single Responsibility: each component, module, function, and use case has one reason to change.
- Small functions: ideally 2–5 lines, rarely over 20; extract meaningful responsibilities.
- One thing per function; keep one abstraction level; avoid deeply nested conditionals.
- Maximum three function arguments; use a named parameter object when more are needed.
- Avoid boolean flag arguments; split behavior into named functions or components.
- Use intention-revealing, searchable, consistent names. Avoid generic names such as `utils`, `data`, `info`, or `Manager`.
- Separate queries from commands. Make side effects explicit.
- Prefer composition over large components. A component with unrelated sections, multiple responsibilities, or long conditional branches must be split into focused components/hooks/modules.
- Keep modules cohesive and dependencies pointed toward abstractions. Mock domain interfaces in unit tests.
- Do not add comments unless explicitly requested. Prefer clearer names and structure.

For Clean Code changes, consult the relevant `references/*/rules.md` and `examples.md` before implementation. Use billing as the local reference for separated application use cases, schemas, actions, infrastructure adapters, and focused components.

## Database and API

Database changes belong in timestamped migrations under `apps/app/supabase/migrations`. Enable RLS, define explicit policies, constraints, and indexes for new tables. Prefer append-only migrations after application.

Route handlers use `Response.json(...)`, stable user-safe response shapes, intentional cache headers, and no internal error details. Local/static video handlers in `apps/web` use Node runtime, range requests, correct `206`/`416` responses, and cache headers.

## Testing and Validation

Use Vitest for unit, application, and domain tests; Playwright for E2E. Add focused tests for important use cases, schemas, domain logic, and critical flows without requiring live Supabase for unit tests.

Before finishing code changes, run the applicable tests plus lint and typecheck commands discovered in the repository, commonly:

```text
pnpm lint
pnpm typecheck
```

Keep changes small and focused. Never commit unless explicitly requested.
