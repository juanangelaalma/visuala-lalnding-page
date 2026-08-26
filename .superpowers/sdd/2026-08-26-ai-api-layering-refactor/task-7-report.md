# Task 7 report — scene mutation workflows

## Status

Completed. Existing Task 7 implementation was committed as `d445257 refactor: extract AI scene workflows`. This follow-up adds the missing composition assertion exposed by the full application test suite.

## Implementation

- Extracted `updateScene`, `deleteScene`, and `approveSceneImage` into `application/ai` use cases.
- Routes validate request data, authenticate, invoke `createAiServices()`, and serialize HTTP responses only.
- Use cases enforce owner scope, clear approved image IDs after image-input changes, reject deletion with generation history, and permit approval only for successful durable image generations belonging to the target scene.
- Added service composition coverage for all Task 7 workflows.

## Tests and results

- Focused: `pnpm --filter app test -- application/ai/scene-workflows.test.ts app/api/ai/scenes infrastructure/ai/services.test.ts`
  - PASS: 5 files, 11 tests.
- Full app: `pnpm --filter app test`
  - PASS: 54 files, 287 tests.
- Scoped lint: `pnpm --filter app exec eslint ...Task 7 source and test files...`
  - PASS.
- Full lint: `pnpm --filter app lint`
  - BLOCKED by pre-existing generated file `apps/app/supabase/.temp/start-secrets/supabase_edge_runtime_app/main/index.ts`: 154 errors, plus an unrelated warning in `infrastructure/ai/supabase-assets.ts`.

## RED/GREEN evidence

- RED evidence for the initial Task 7 tests is unavailable in this session: `d445257` already contained both implementation and tests when work began.
- GREEN evidence: focused suite passed after the composition test update; full app suite passed 287/287.
- Follow-up RED/GREEN: full suite initially failed because `infrastructure/ai/services.test.ts` expected only two service methods. The assertion was expanded to cover the Task 7 service methods; its focused test then passed, followed by full-suite green.

## Files changed

- `apps/app/application/ai/update-scene.ts`
- `apps/app/application/ai/delete-scene.ts`
- `apps/app/application/ai/approve-scene-image.ts`
- `apps/app/application/ai/scene-workflows.test.ts`
- `apps/app/app/api/ai/scenes/[sceneId]/route.ts`
- `apps/app/app/api/ai/scenes/[sceneId]/route.test.ts`
- `apps/app/app/api/ai/scenes/[sceneId]/approve/route.ts`
- `apps/app/app/api/ai/scenes/[sceneId]/approve/route.test.ts`
- `apps/app/features/ai/schemas/ai-request-schemas.ts`
- `apps/app/infrastructure/ai/services.ts`
- `apps/app/infrastructure/ai/services.test.ts`
- `.superpowers/sdd/2026-08-26-ai-api-layering-refactor/task-7-report.md`

## Self-review

- Verified no scene route imports Supabase or provider implementations.
- Verified application workflows depend only on domain contracts and structured `AiDomainError` values.
- Verified owner checks precede destructive mutation and approval update.
- Verified route dynamic `params` await pattern against installed Next 16 route-handler documentation.
- Verified Task 7 diff has no whitespace errors.
- Excluded unrelated dirty `.opencode` deletions and untracked specification/plan files.

## Concerns

- Full lint remains blocked by generated Supabase temporary runtime output outside Task 7 scope.
- The initial Task 7 commit predates this session, so first-cycle RED execution cannot be independently demonstrated.

## Review fix — structured approval error assertion

- Corrected `application/ai/scene-workflows.test.ts` so the incomplete-generation approval safeguard asserts `{ code: "NOT_APPROVABLE", status: 409 }`, matching the structured `AiDomainError` contract required by the Task 7 brief.
- Command: `pnpm --filter app test -- application/ai/scene-workflows.test.ts`
- Output: `Test Files  1 passed (1)`; `Tests  3 passed (3)`; exit status `0`.
