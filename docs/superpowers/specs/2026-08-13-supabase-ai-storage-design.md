# Supabase AI Storage Design

## Goal

Replace Cloudflare R2 with private Supabase Storage for AI reference uploads and generated AI output. The application has not run yet, so no existing objects need to be migrated.

## Scope

- Create a private `ai-assets` Supabase Storage bucket with explicit RLS policies.
- Replace the R2 server-only adapter and its configuration with a Supabase Storage adapter.
- Persist storage object paths in the existing `ai_generations.input_assets` and `ai_generations.output_assets` arrays.
- Resolve stored paths to short-lived signed URLs only when an authenticated owner requests project or generation data.
- Preserve all existing content validation, provider host validation, upload size limits, route response shapes, and AI object-key conventions.
- Remove R2-specific dependencies and documented environment variables.

## Out of Scope

- Migrating existing R2 objects or rewriting existing records.
- Changing AI provider APIs, generation orchestration, or database table columns.
- A general-purpose asset library or client-direct upload flow.

## Architecture

### Storage adapter

`apps/app/infrastructure/ai/supabase-assets.ts` will be a server-only infrastructure adapter. It uses `createSupabaseServiceRoleClient()` to upload to the private `ai-assets` bucket and returns the object path, never a public URL.

The adapter retains the current image/video/audio MIME allowlist, 100 MiB upper bound, Atlas HTTPS host allowlist, redirect rejection, 30-second download timeout, and streamed byte-limit enforcement. Upload failures are converted to generic internal errors; raw Supabase failures do not escape route handlers.

### Stored values and provider calls

`input_assets` and `output_assets` continue to be `text[]`, but their values become paths such as `ai/<user-id>/references/<uuid>.webp` and `ai/<project-id>/<generation-id>/0`.

The worker creates signed URLs from input paths before providing references or image inputs to Atlas. It copies completed provider output into Supabase Storage and persists the resulting object paths. This retains private storage while still giving Atlas temporary access to needed input assets.

### Authenticated delivery

The project status and generation responses retain their `assets: string[]` response field, but the values are newly minted, short-lived signed URLs instead of stored paths. Each route first verifies the authenticated user owns the parent `ai_projects` record, then resolves the output paths through the infrastructure adapter. Failed signing produces a user-safe internal error and never exposes object paths or provider errors.

Any route that needs an approved image must use the stored output path internally and sign it only for the provider call; it must not rely on a previously returned signed URL.

### Bucket and RLS

An append-only migration creates bucket `ai-assets` with `public = false`, a 100 MiB file limit, and the existing accepted MIME types. RLS is enabled on `storage.objects`; no `anon` or `authenticated` policies permit reads or writes. All storage operations use the service-role client, which bypasses RLS after application authorization has been performed.

## Data Flow

1. An authenticated user uploads a reference image.
2. The upload route validates it, then the server-only adapter uploads it using the service role and returns its object path.
3. The image-generation route persists that path in `input_assets`.
4. The worker signs each required input path immediately before sending it to Atlas.
5. The worker downloads a completed Atlas asset, validates and stores it, then persists its object path in `output_assets`.
6. An authenticated project owner requests project status; the route signs output paths and returns the temporary URLs as `assets`.

## Testing and Validation

- Unit-test the storage adapter with mocked service-role Storage APIs and `fetch`, including valid uploads, MIME/size rejections, rejected remote host/redirect/content types, stream limits, signing, and safe storage errors.
- Unit-test the AI status/DTO path-to-signed-URL conversion and ownership checks.
- Preserve/add upload route coverage for response shape and object key generation.
- Run focused Vitest tests, the app test suite, `pnpm app:lint`, and `pnpm app:build`.
- Consult the installed Next.js route-handler documentation before route changes.
- Run `graphify update .` after code changes.

## Risks and Decisions

- Signed URLs expire. The UI must request fresh project/generation data rather than persist or reuse URLs indefinitely.
- Service-role credentials must remain server-only; no client-side Supabase Storage access is added.
- Supabase Storage upload support for Node streams must be verified in adapter tests. If it buffers streams, the current 100 MiB bound remains enforced but memory use must be monitored.
