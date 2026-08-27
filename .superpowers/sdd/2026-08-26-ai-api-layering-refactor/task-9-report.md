# Task 9 Report: Service Factory and Worker Injection

## Implementation

- Retained `createAiServices()` at the infrastructure composition boundary in `apps/app/infrastructure/ai/services.ts`.
- Refactored `runAiWorker(input, dependencies)` to accept injected persistence, storage, provider, and project-refresh dependencies.
- Preserved lease claiming, bounded worker limits, stale submission project refresh, provider submission ambiguity handling, polling, result persistence, remote asset copying, reversal after definite submission failure, and project status refresh.
- Updated the worker route to use the infrastructure factory; it remains an HTTP authorization/response adapter.
- Confirmed `failure()` maps `AiDomainError` to its stable `{ error: { code, message } }` response and preserves the safe fallback JSON unchanged.
- Formatted the previously minified worker route. Other AI route/schema files within scope were already formatted.

## Files Changed

- `apps/app/application/ai/worker.ts`
- `apps/app/application/ai/worker.test.ts`
- `apps/app/infrastructure/ai/services.ts`
- `apps/app/infrastructure/ai/services.test.ts`
- `apps/app/app/api/ai/worker/route.ts`
- `apps/app/app/api/ai/worker/route.test.ts`
- `.superpowers/sdd/2026-08-26-ai-api-layering-refactor/task-9-report.md`

## RED-GREEN Evidence

### RED

Command:

```bash
pnpm --filter app test -- application/ai/worker app/api/ai/worker
```

Output before dependency injection:

```text
FAIL application/ai/worker.test.ts
ZodError: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY undefined
```

This proved the worker still constructed its concrete service-role client instead of using the injected dependency object.

### GREEN

Command:

```bash
pnpm --filter app test -- application/ai/worker app/api/ai/worker infrastructure/ai/services
```

Output:

```text
Test Files  3 passed (3)
Tests  4 passed (4)
```

The worker test verifies definite provider rejection invokes `reverseFailedWork` with `PROVIDER_REJECTED`.

## Validation

Focused AI suite:

```bash
pnpm --filter app test -- application/ai app/api/ai infrastructure/ai
```

```text
Test Files  25 passed (25)
Tests  72 passed (72)
```

Full app suite:

```bash
pnpm --filter app test
```

```text
Test Files  56 passed (56)
Tests  295 passed (295)
```

Scoped lint:

```bash
pnpm --filter app exec eslint "app/api/ai/**/*.ts" "features/ai/schemas/**/*.ts" "application/ai/worker.ts" "infrastructure/ai/services.ts"
```

Passed with no output.

Graph refresh:

```bash
graphify update .
```

Completed: `5871 nodes, 7693 edges, 472 communities`.

Typecheck attempted:

```bash
pnpm --filter app exec tsc --noEmit
```

Failed on pre-existing application AI test mocks that do not implement recently expanded `AiGenerationRepository` methods (`findLatestBySceneIdAndTypes`, `reserveCredits`). The Task 9 factory status typing issue identified in that run was corrected; typecheck remains blocked by those unrelated test fixtures.

Root lint attempted:

```bash
pnpm app:lint
```

Failed on pre-existing generated `apps/app/supabase/.temp/start-secrets/supabase_edge_runtime_app/main/index.ts` violations. Scoped Task 9 lint passed.

## Self-Review

- No application AI module imports infrastructure.
- Routes contain no direct Supabase/provider calls.
- Factory owns all concrete worker composition.
- Worker retains ambiguity safety: accepted-but-unpersisted submissions record `SUBMISSION_UNKNOWN`; only definite unsent/rejected submissions reverse credits.
- `AiDomainError` mapping exists at the shared HTTP boundary; unexpected errors retain the exact existing safe fallback.
- No dependency, migration, or client change.

## Concerns / Follow-up

- Full TypeScript typecheck remains blocked by unrelated incomplete repository test doubles.
- Root lint remains blocked by unrelated generated Supabase temporary source.
- Existing unrelated `.opencode` deletions and untracked plan/spec files were excluded from the Task 9 commit.

## Review Fixes

- Moved all worker Supabase RPC/table persistence and project-refresh logic from `infrastructure/ai/services.ts` into focused `SupabaseAiWorkerRepository`.
- Moved the worker work item, persistence port, and dependency contract to `domain/ai/contracts.ts`; `application/ai/worker.ts` now consumes domain-only contracts and provider interfaces.
- Added worker regressions proving image/video private paths are signed before provider submission, and persistence failure after provider acceptance records `SUBMISSION_UNKNOWN` without credit reversal.
- Added repository mapping coverage for claimed worker work.

### Review Fix RED

```bash
pnpm --filter app test -- infrastructure/ai/supabase-ai-worker-repository
```

```text
FAIL Cannot find module './supabase-ai-worker-repository'
```

### Review Fix GREEN

```bash
pnpm --filter app test -- application/ai/worker infrastructure/ai/supabase-ai-worker-repository
```

```text
Test Files  2 passed (2)
Tests  5 passed (5)
```

### Review Fix Validation

```bash
pnpm --filter app test -- application/ai app/api/ai infrastructure/ai
pnpm --filter app test
```

Both passed. Full typecheck remains blocked by the same pre-existing incomplete `AiGenerationRepository` test doubles noted above.
