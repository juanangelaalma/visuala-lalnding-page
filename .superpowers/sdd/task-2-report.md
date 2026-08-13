# Task 2 Report: Persist Private Paths and Sign Provider Inputs

## Changes

- Replaced URL validation for storyboard and image reference assets with private `ai/<uuid>/references/<file>` path validation.
- Enforced authenticated-user ownership for storyboard and direct image reference paths before their persistence.
- Switched the AI asset upload route from the removed R2 adapter to `uploadAsset` in the Task 1 Supabase adapter.
- Kept private paths in generation `input_assets` and removed input reference/image values from persisted `provider_request` payloads.
- Updated the worker to create fresh signed URLs immediately before Atlas image and video submissions, while retaining private paths in database records.
- Added schema, upload-route, and worker tests.

## TDD Evidence

### RED

`pnpm --filter app test -- application/ai/schemas.test.ts`

Result: failed as expected with 2 assertion failures. Private reference paths were rejected by the URL schema, and remote URLs were accepted.

`pnpm --filter app test -- app/api/ai/assets/route.test.ts`

Result: failed as expected during module loading because the route still imported the intentionally removed `@/infrastructure/ai/r2-assets` module.

`pnpm --filter app test -- application/ai/worker.test.ts`

Result: failed as expected after temporarily removing signing from the worker: `createSignedAssetUrls` had zero calls.

### GREEN

`pnpm --filter app test -- application/ai/schemas.test.ts`

Result: 1 file passed, 6 tests passed.

`pnpm --filter app test -- application/ai/schemas.test.ts app/api/ai/assets/route.test.ts`

Result: 2 files passed, 7 tests passed.

`pnpm --filter app test -- application/ai/worker.test.ts`

Result: 1 file passed, 1 test passed.

## Validation

- `pnpm --filter app test -- application/ai/schemas.test.ts app/api/ai/assets/route.test.ts application/ai/worker.test.ts`
  - Passed: 3 files, 8 tests.
- `pnpm --filter app lint -- application/ai/schemas.ts application/ai/worker.ts app/api/ai/assets/route.ts app/api/ai/projects/storyboard/route.ts 'app/api/ai/scenes/[sceneId]/image/route.ts' 'app/api/ai/projects/[projectId]/video/route.ts' app/api/ai/assets/route.test.ts application/ai/worker.test.ts`
  - Passed with no output/errors.
- `pnpm --filter app test`
  - Passed: 33 files, 228 tests.
- `git diff --check`
  - Passed with no whitespace errors.
- `pnpm exec graphify update .`
  - Completed; graph rebuilt with 5,478 nodes and 6,915 edges. HTML visualization was skipped because the graph exceeded its 5,000-node limit.

## Files

- `apps/app/application/ai/schemas.ts`
- `apps/app/application/ai/schemas.test.ts`
- `apps/app/application/ai/worker.ts`
- `apps/app/application/ai/worker.test.ts`
- `apps/app/app/api/ai/assets/route.ts`
- `apps/app/app/api/ai/assets/route.test.ts`
- `apps/app/app/api/ai/projects/storyboard/route.ts`
- `apps/app/app/api/ai/scenes/[sceneId]/image/route.ts`
- `apps/app/app/api/ai/projects/[projectId]/video/route.ts`

## Self-Review

- Confirmed no `r2-assets` imports remain under `apps/app`.
- Confirmed persisted image/video `provider_request` values do not include reference or image paths/URLs.
- Confirmed signed URLs are created only in the worker just before Atlas submission.
- Confirmed output copying continues to save the private path returned by `copyRemoteAsset`.
- Kept database and UI boundary changes out of scope; this task does not implement Task 3 delivery signing.

## Concerns

- The scope has no existing route-level fixtures for testing the two ownership rejection branches or persisted request payloads; behavior is covered directly by the route changes and focused worker/schema tests.
- Existing untracked `apps/scraper/` and Superpowers plan/spec files remain untouched and are excluded from the Task 2 commit.

## Review Finding Fixes

### Changes

- Added a storyboard-route test for an otherwise-valid private reference object path owned by another user. It verifies a `403` response with `REFERENCE_ASSET_FORBIDDEN` and verifies the Supabase service client is never created, so no project is persisted.
- Added a scene-image-route test for an otherwise-valid private reference object path owned by another user. It verifies a `403` response with `REFERENCE_ASSET_FORBIDDEN` and verifies no generation insert occurs.
- Added a worker video-submission test verifying Atlas receives the freshly signed URL as `image`, and never receives the private object path.

### TDD Evidence

No production changes were necessary: the existing Task 2 ownership checks and worker signing behavior satisfied all three newly requested coverage cases on their first focused test run. Therefore no RED/fix cycle was applicable under the requested condition to record RED only when a production change is necessary.

### Validation

- `pnpm --filter app test -- app/api/ai/projects/storyboard/route.test.ts 'app/api/ai/scenes/[sceneId]/image/route.test.ts' application/ai/worker.test.ts`
  - Passed: 3 files, 4 tests.
- `pnpm --filter app lint -- app/api/ai/projects/storyboard/route.test.ts 'app/api/ai/scenes/[sceneId]/image/route.test.ts' application/ai/worker.test.ts`
  - Passed with no output/errors.
- `pnpm --filter app test`
  - Passed: 35 files, 231 tests.
