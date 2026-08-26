# Task 6 report

## Summary of changes

- Extracted storyboard creation into application workflow with repository/provider contracts.
- Extracted project status DTO/signing into application workflow after owner-scoped lookup.
- Made storyboard/status routes thin service callers.
- Preserved idempotent replay, conflict recovery, storyboard failure writes, DTO response shapes, and safe route errors.

## Files changed

- `apps/app/application/ai/create-storyboard.ts`
- `apps/app/application/ai/create-storyboard.test.ts`
- `apps/app/application/ai/get-project-status.ts`
- `apps/app/application/ai/get-project-status.test.ts`
- `apps/app/app/api/ai/projects/storyboard/route.ts`
- `apps/app/app/api/ai/projects/storyboard/route.test.ts`
- `apps/app/app/api/ai/projects/[projectId]/status/route.ts`
- `apps/app/app/api/ai/projects/[projectId]/status/route.test.ts`
- `apps/app/infrastructure/ai/services.ts`
- `apps/app/infrastructure/ai/supabase-ai-asset-repository.ts`
- `apps/app/domain/ai/contracts.ts`
- `apps/app/domain/ai/errors.ts`
- `apps/app/app/api/ai/_shared.ts`
- `apps/app/application/ai/upload-reference-assets.test.ts`

## Validation performed

- `pnpm --filter app test -- application/ai/create-storyboard application/ai/get-project-status app/api/ai/projects`
- `pnpm --filter app exec eslint application/ai/create-storyboard.ts application/ai/get-project-status.ts application/ai/create-storyboard.test.ts application/ai/get-project-status.test.ts app/api/ai/projects/storyboard/route.ts "app/api/ai/projects/[projectId]/status/route.ts" app/api/ai/projects/storyboard/route.test.ts "app/api/ai/projects/[projectId]/status/route.test.ts" infrastructure/ai/services.ts domain/ai/contracts.ts domain/ai/errors.ts infrastructure/ai/supabase-ai-asset-repository.ts app/api/ai/_shared.ts`
- `pnpm --filter app exec tsc --noEmit`
- `graphify update .`

## Rule compliance notes

- Application workflows import domain contracts/types only; infrastructure composition stays in `createAiServices()`.
- Status signs output paths only after `findOwnedById()` succeeds.
- No dependencies or migrations added. Existing dirty `.opencode/**` files excluded.

## Risks or follow-up items

- Full `pnpm --filter app lint` still fails on pre-existing generated `apps/app/supabase/.temp/**` lint errors and existing `supabase-assets.ts` unused-function warning.
