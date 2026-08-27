# Final Fix Report: AI API Layering Refactor

## Summary of changes

- Removed storage signing and dead `generationDto` / `sceneDto` exports from `app/api/ai/_shared.ts`.
- Added a regression test that imports the shared API helper while its former storage module throws if loaded.
- Removed storyboard-route reference authorization. `createStoryboard()` remains the single enforcement point.
- Extracted the identical generation response serialization into `application/ai/generation-dto.ts`. It accepts domain data plus the narrow `signAssets` contract; it has no infrastructure import.
- Added PATCH support and regression coverage for `sceneType` and `motionComplexity`.

## Files changed

- `apps/app/app/api/ai/_shared.ts`
- `apps/app/app/api/ai/_shared.test.ts`
- `apps/app/app/api/ai/projects/storyboard/route.ts`
- `apps/app/app/api/ai/projects/storyboard/route.test.ts`
- `apps/app/application/ai/generation-dto.ts`
- `apps/app/application/ai/get-project-status.ts`
- `apps/app/application/ai/get-project-status.test.ts`
- `apps/app/application/ai/queue-scene-image.ts`
- `apps/app/application/ai/queue-project-video.ts`
- `apps/app/application/ai/update-scene.ts`
- `apps/app/application/ai/scene-workflows.test.ts`
- `apps/app/features/ai/schemas/ai-request-schemas.ts`

## TDD evidence

- RED: `pnpm --filter app test -- application/ai/scene-workflows.test.ts` failed because PATCH input omitted `sceneType` and `motionComplexity`.
- RED: focused import test failed because `application/ai/generation-dto.ts` did not exist; the storage-throwing shared-helper test initially exposed its obsolete import.
- GREEN: focused tests passed: 11 tests across four files.

## Validation performed

- `pnpm --filter app test -- app/api/ai application/ai/get-project-status.test.ts application/ai/queue-scene-image.test.ts application/ai/queue-project-video.test.ts application/ai/scene-workflows.test.ts`: initial failure only from obsolete route-test expectation; updated for use-case authorization, then passed focused regression suite.
- `pnpm --filter app test`: passed, 57 files and 301 tests.
- `pnpm app:build`: passed; Next.js compilation and TypeScript checks completed.
- `pnpm lint`: blocked by pre-existing generated `apps/app/supabase/.temp/start-secrets/supabase_edge_runtime_app/main/index.ts` violations: 154 errors and 33 warnings. Also reports the existing unused `rejectInvalidAsset` warning in `infrastructure/ai/supabase-assets.ts`.
- `git diff --check`: passed.

## Rule compliance notes

- No dependencies, migrations, client changes, or unrelated `.opencode` / `docs/superpowers` work included.
- Storage signing remains behind the domain asset repository contract.
- Route keeps HTTP-only responsibilities; ownership enforcement remains in `createStoryboard()`.
- Shared serializer uses domain types plus `Pick<AiAssetRepository, "signAssets">`, without infrastructure imports.

## Risks or follow-up items

- Root lint remains unavailable until generated Supabase `.temp` output is excluded or regenerated lint-clean.
- `graphify update .` completed: 5,911 nodes, 7,766 edges, and 476 communities. Generated graph output remains unrelated and unstaged.
