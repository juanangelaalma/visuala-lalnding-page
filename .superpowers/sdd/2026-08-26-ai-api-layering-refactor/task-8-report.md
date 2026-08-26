# Task 8 Report: Generation Queue Workflows

## Implementation

- Added `queueSceneImage()` and `queueProjectVideo()` application workflows.
- Moved image/video route orchestration to parse, authenticate, invoke service, serialize response.
- Preserved idempotency reuse, reference ownership validation, estimated-cost caps, awaiting-credit retry, per-scene video queueing, credit reservation, race recovery, project status updates, and response DTO shape.
- Added only required repository boundary methods: `findLatestBySceneIdAndTypes()` and `reserveCredits()`.

## Ruling impact

Prior contracts omitted queue-required generation operations. Under the approved ruling, Task 8 adds the smallest contract and Supabase adapter surface necessary for existing queue semantics. No migrations, dependencies, clients, or broader refactors were added.

## Files changed

- `apps/app/application/ai/queue-scene-image.ts`
- `apps/app/application/ai/queue-scene-image.test.ts`
- `apps/app/application/ai/queue-project-video.ts`
- `apps/app/application/ai/queue-project-video.test.ts`
- `apps/app/app/api/ai/scenes/[sceneId]/image/route.ts`
- `apps/app/app/api/ai/scenes/[sceneId]/image/route.test.ts`
- `apps/app/app/api/ai/projects/[projectId]/video/route.ts`
- `apps/app/app/api/ai/projects/[projectId]/video/route.test.ts`
- `apps/app/domain/ai/contracts.ts`
- `apps/app/domain/ai/contracts.test.ts`
- `apps/app/infrastructure/ai/supabase-ai-generation-repository.ts`
- `apps/app/infrastructure/ai/supabase-ai-generation-repository.test.ts`
- `apps/app/infrastructure/ai/services.ts`
- `apps/app/infrastructure/ai/services.test.ts`

## RED evidence

1. `pnpm --filter app test -- application/ai/queue-scene-image application/ai/queue-project-video`
   - Failed as expected: missing `./queue-scene-image` and `./queue-project-video`.
2. `pnpm --filter app test -- domain/ai/contracts.test.ts infrastructure/ai/supabase-ai-generation-repository.test.ts`
   - Failed as expected: `repository.reserveCredits is not a function`.

## GREEN evidence

- Focused: `pnpm --filter app test -- application/ai/queue-scene-image application/ai/queue-project-video domain/ai/contracts.test.ts infrastructure/ai/supabase-ai-generation-repository.test.ts app/api/ai/scenes app/api/ai/projects`
  - PASS: 10 files, 18 tests.
- Full: `pnpm --filter app test`
  - PASS: 56 files, 286 tests.
- Targeted lint: `pnpm --filter app lint "application/ai/queue-scene-image.ts" "application/ai/queue-project-video.ts" "app/api/ai/scenes/[sceneId]/image/route.ts" "app/api/ai/projects/[projectId]/video/route.ts" "domain/ai/contracts.ts" "infrastructure/ai/supabase-ai-generation-repository.ts" "infrastructure/ai/services.ts"`
  - PASS.
- Build: `pnpm --filter app build`
  - PASS: `Finished TypeScript in 9.4s`.
- `graphify update .`
  - PASS; graph updated.
- `git diff --check`
  - PASS.

## Concerns

- Full repository lint remains blocked by pre-existing generated `apps/app/supabase/.temp/start-secrets/supabase_edge_runtime_app/main/index.ts` violations. Targeted changed-file lint passes.
- Task 6 deferred duplicate reference-asset checks/message drift remain outside Task 8 scope.

## Review regression follow-up

### Added coverage

- Image: `awaiting_credit` idempotent retry, unowned reference rejection before writes, image cost cap, succeeded private-asset signing, unique-conflict recovery.
- Video: owner scope before scene loading, `awaiting_credit` retry, succeeded private-asset signing, scene cost cap, unique-conflict recovery.

### RED/GREEN evidence

- RED: `pnpm --filter app test -- application/ai/queue-scene-image.test.ts`
  - 2 expected failures: idempotent `awaiting_credit` response remained `awaiting_credit`; raced generation response used `202` rather than idempotent `200`.
- GREEN: `pnpm --filter app test -- application/ai/queue-scene-image.test.ts application/ai/queue-project-video.test.ts`
  - PASS: 2 files, 12 tests.

### Fix

- `queueSceneImage()` now routes existing and unique-conflict-recovered generations through the same credit-retry/queued DTO behavior, preserving status `200` for both idempotent outcomes.
