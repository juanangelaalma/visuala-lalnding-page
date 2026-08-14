# Supabase AI Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Cloudflare R2 with private Supabase Storage while persisting AI asset paths and returning signed URLs only after owner authorization.

**Architecture:** A server-only infrastructure adapter owns all Supabase Storage uploads, remote copies, and signed URL creation. AI database arrays remain `text[]` but contain bucket object paths; routes authorize project ownership before exposing fresh signed URLs, and the worker signs paths only when an Atlas provider request needs an external URL.

**Tech Stack:** Next.js App Router, TypeScript, Supabase Storage, Supabase service-role client, Zod, Vitest, pnpm.

## Global Constraints

- Use `pnpm` only; do not create a new lockfile.
- Create an append-only timestamped migration in `apps/app/supabase/migrations`.
- Keep all Supabase Storage calls in `apps/app/infrastructure/ai`.
- Keep the `ai-assets` bucket private; do not add `anon` or `authenticated` Storage object policies.
- Never return raw Supabase or provider errors to users.
- Preserve the current MIME allowlist, 100 MiB limit, Atlas host allowlist, 30-second timeout, redirect rejection, and AI object-key conventions.
- Read the installed Next.js route-handler documentation before changing route handlers.
- Run `graphify update .` after implementation.

---

### Task 1: Private Storage Adapter and Bucket

**Files:**
- Create: `apps/app/supabase/migrations/20260813000000_create_ai_assets_storage_bucket.sql`
- Create: `apps/app/infrastructure/ai/supabase-assets.ts`
- Create: `apps/app/infrastructure/ai/supabase-assets.test.ts`
- Delete: `apps/app/infrastructure/ai/r2-assets.ts`

**Interfaces:**
- Consumes: `createSupabaseServiceRoleClient(): SupabaseClient<Database>` from `apps/app/infrastructure/supabase/service-role-client.ts`.
- Produces: `uploadAsset(body, contentType, key): Promise<string>`, `copyRemoteAsset(url, key): Promise<string>`, `createSignedAssetUrl(path): Promise<string>`, and `createSignedAssetUrls(paths): Promise<string[]>`.

- [ ] **Step 1: Write adapter tests for successful path upload and signed URL resolution**

```ts
expect(await uploadAsset(new Uint8Array([1]), "image/png", "ai/user/references/file.png"))
  .toBe("ai/user/references/file.png");
expect(upload).toHaveBeenCalledWith("ai/user/references/file.png", expect.any(Uint8Array), {
  contentType: "image/png",
  upsert: false,
});
expect(await createSignedAssetUrl("ai/project/generation/0")).toBe("https://signed.example/asset");
expect(createSignedUrl).toHaveBeenCalledWith("ai/project/generation/0", 900);
```

- [ ] **Step 2: Add rejection tests for unsafe content and Storage failures**

```ts
await expect(uploadAsset(new Uint8Array(101 * 1024 * 1024), "image/png", "ai/user/file.png"))
  .rejects.toThrow("Asset rejected");
await expect(copyRemoteAsset("https://untrusted.example/file.png", "ai/project/output/0"))
  .rejects.toThrow("Provider asset host rejected");
await expect(createSignedAssetUrl("ai/project/output/0"))
  .rejects.toThrow("Could not sign asset");
```

- [ ] **Step 3: Run the focused test to verify it fails**

Run: `pnpm --filter app test -- infrastructure/ai/supabase-assets.test.ts`

Expected: FAIL because the Supabase adapter does not exist.

- [ ] **Step 4: Add the private bucket migration**

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ai-assets',
  'ai-assets',
  false,
  104857600,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm', 'audio/mpeg', 'audio/wav']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
```

Do not create client read or write policies for `storage.objects`; its existing RLS default deny protects the private bucket.

- [ ] **Step 5: Implement `supabase-assets.ts` and remove R2 adapter**

```ts
const BUCKET = "ai-assets";
const SIGNED_URL_TTL_SECONDS = 900;

export async function uploadAsset(body: Uint8Array, contentType: string, key: string) {
  if (!allowed.has(contentType) || body.byteLength > MAX_BYTES) throw new Error("Asset rejected");
  const { error } = await createSupabaseServiceRoleClient().storage
    .from(BUCKET)
    .upload(key, body, { contentType, upsert: false });
  if (error) throw new Error("Could not store asset");
  return key;
}

export async function createSignedAssetUrl(path: string) {
  const { data, error } = await createSupabaseServiceRoleClient().storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) throw new Error("Could not sign asset");
  return data.signedUrl;
}
```

Retain the current `copyRemoteAsset` fetch/stream checks, replacing only the final S3 upload with a Supabase Storage upload. Return `key`, never a URL.

- [ ] **Step 6: Run adapter tests to verify they pass**

Run: `pnpm --filter app test -- infrastructure/ai/supabase-assets.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the storage foundation**

```bash
git add apps/app/supabase/migrations/20260813000000_create_ai_assets_storage_bucket.sql apps/app/infrastructure/ai
git commit -m "feat: store AI assets in Supabase"
```

### Task 2: Persist Private Paths and Sign Provider Inputs

**Files:**
- Modify: `apps/app/application/ai/schemas.ts`
- Modify: `apps/app/application/ai/schemas.test.ts`
- Modify: `apps/app/app/api/ai/assets/route.ts`
- Modify: `apps/app/app/api/ai/projects/storyboard/route.ts`
- Modify: `apps/app/app/api/ai/scenes/[sceneId]/image/route.ts`
- Modify: `apps/app/app/api/ai/projects/[projectId]/video/route.ts`
- Modify: `apps/app/application/ai/worker.ts`
- Create: `apps/app/app/api/ai/assets/route.test.ts`

**Interfaces:**
- Consumes: Task 1 adapter functions; uploaded reference paths follow `ai/<user-id>/references/<uuid>.<extension>`.
- Produces: Database `input_assets` and `output_assets` containing private object paths; Atlas receives fresh signed URLs only.

- [ ] **Step 1: Add failing schema tests for private reference paths**

```ts
expect(storyboardInputSchema.safeParse({ referenceAssets: ["ai/00000000-0000-4000-8000-000000000000/references/file.png"] }).success).toBe(true);
expect(storyboardInputSchema.safeParse({ referenceAssets: ["https://storage.example/file.png"] }).success).toBe(false);
expect(storyboardInputSchema.safeParse({ referenceAssets: ["ai/other/path.png"] }).success).toBe(false);
```

- [ ] **Step 2: Run schema tests to verify failure**

Run: `pnpm --filter app test -- application/ai/schemas.test.ts`

Expected: FAIL because reference schemas currently require URLs.

- [ ] **Step 3: Implement path validation and ownership checks**

```ts
const assetPathSchema = z.string().regex(/^ai\/[0-9a-f-]{36}\/references\/[\w.-]+$/i);

function ownsReferencePath(path: string, userId: string) {
  return path.startsWith(`ai/${userId}/references/`);
}
```

Use the authenticated user ID to reject reference paths not owned by the caller before they are persisted. Update the asset route to import `uploadAsset` from `supabase-assets`; its `{ assets }` response now contains object paths.

- [ ] **Step 4: Update worker behavior for signed provider inputs**

```ts
const references = await createSignedAssetUrls(row.input_assets);
const result = row.type === "image"
  ? await new AtlasImageAdapter().generate({ logicalModelKey, prompt, references })
  : await new AtlasVideoAdapter().generate({ logicalModelKey, prompt, image: references[0], duration, resolution });
```

Keep `copyRemoteAsset` output paths in `output_assets`. Do not persist `references` or `image` signed URLs to `provider_request`.

- [ ] **Step 5: Add and run upload-route tests**

```ts
expect(response.status).toBe(201);
await expect(response.json()).resolves.toEqual({ assets: ["ai/user/references/file.png"] });
expect(uploadAsset).toHaveBeenCalledWith(expect.any(Uint8Array), "image/png", expect.stringMatching(/^ai\/user\/references\//));
```

Run: `pnpm --filter app test -- application/ai/schemas.test.ts app/api/ai/assets/route.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit private-path flow**

```bash
git add apps/app/application/ai apps/app/app/api/ai
git commit -m "feat: persist private AI asset paths"
```

### Task 3: Authorized Signed-URL Responses

**Files:**
- Modify: `apps/app/app/api/ai/_shared.ts`
- Create: `apps/app/app/api/ai/_shared.test.ts`
- Modify: `apps/app/app/api/ai/projects/[projectId]/status/route.ts`
- Modify: `apps/app/app/api/ai/scenes/[sceneId]/image/route.ts`
- Modify: `apps/app/app/api/ai/projects/[projectId]/video/route.ts`
- Create: `apps/app/app/api/ai/projects/[projectId]/status/route.test.ts`
- Create: `apps/app/app/api/ai/scenes/[sceneId]/image/route.test.ts`
- Create: `apps/app/app/api/ai/projects/[projectId]/video/route.test.ts`

**Interfaces:**
- Consumes: `createSignedAssetUrls(paths): Promise<string[]>` from Task 1, only after a route confirms `ai_projects.user_id` equals the authenticated user ID.
- Produces: Async `generationDto(row): Promise<{ assets: string[]; ... }>` with signed URLs and no exposed object paths.

- [ ] **Step 1: Write failing DTO tests**

```ts
await expect(generationDto({ ...generation, output_assets: ["ai/project/generation/0"] }))
  .resolves.toMatchObject({ assets: ["https://signed.example/output"] });
expect(createSignedAssetUrls).toHaveBeenCalledWith(["ai/project/generation/0"]);
```

- [ ] **Step 2: Make `generationDto` asynchronous and path-aware**

```ts
export async function generationDto(row: GenerationRow) {
  return {
    id: row.id,
    sceneId: row.scene_id,
    type: row.type,
    status: row.status,
    assets: await createSignedAssetUrls(row.output_assets),
    errorCode: row.error_code,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}
```

- [ ] **Step 3: Update each response call site after authorization**

```ts
const generations = await Promise.all((data ?? []).map(generationDto));
return Response.json({ generations });
```

Apply this only after the existing parent-project owner query succeeds. Preserve empty assets for queued generations and return `failure(error)` so signing errors are user-safe 500 responses.

- [ ] **Step 4: Add route tests for authorization and non-disclosure**

```ts
expect(response.status).toBe(200);
await expect(response.json()).resolves.toMatchObject({ generations: [{ assets: ["https://signed.example/output"] }] });
expect(JSON.stringify(await response.clone().json())).not.toContain("ai/project/generation/0");
expect(nonOwnerResponse.status).toBe(404);
```

- [ ] **Step 5: Run response tests**

Run: `pnpm --filter app test -- app/api/ai/_shared.test.ts app/api/ai/projects/[projectId]/status/route.test.ts app/api/ai/scenes/[sceneId]/image/route.test.ts app/api/ai/projects/[projectId]/video/route.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit signed delivery**

```bash
git add apps/app/app/api/ai
git commit -m "feat: sign private AI asset responses"
```

### Task 4: Remove R2 Configuration and Validate

**Files:**
- Modify: `apps/app/package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `apps/app/.env.local.example`
- Modify: `apps/app/README.md`
- Modify: `apps/app/app/dashboard/create-video/ai-video-client.test.ts`

**Interfaces:**
- Consumes: private upload paths and signed status response URLs from previous tasks.
- Produces: no R2 package/configuration remains; environment documentation identifies server-only Supabase service-role requirements and signed URL expiry.

- [ ] **Step 1: Update client fixtures and documentation**

Replace upload response fixture values with `ai/<user-id>/references/<uuid>.png`. Keep status response fixture values as signed HTTPS URLs. Document `SUPABASE_SERVICE_ROLE_KEY`, the private `ai-assets` bucket, object-path persistence, and 15-minute signed URLs. Remove all `R2_*` variables.

- [ ] **Step 2: Remove the R2 SDK and update the lockfile**

Run: `pnpm remove --filter app @aws-sdk/client-s3`

Expected: `apps/app/package.json` and `pnpm-lock.yaml` remove the direct R2 SDK dependency without altering unrelated packages.

- [ ] **Step 3: Check installed route-handler guidance**

Read: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/02-route-segment-config/index.md`

Confirm the unchanged `POST` route conventions remain valid and do not add caching to authenticated asset responses.

- [ ] **Step 4: Run focused and full validation**

Run: `pnpm --filter app test -- infrastructure/ai/supabase-assets.test.ts application/ai/schemas.test.ts app/api/ai/_shared.test.ts app/api/ai/assets/route.test.ts app/api/ai/projects/[projectId]/status/route.test.ts app/api/ai/scenes/[sceneId]/image/route.test.ts app/api/ai/projects/[projectId]/video/route.test.ts app/dashboard/create-video/ai-video-client.test.ts`

Expected: PASS.

Run: `pnpm --filter app test`

Expected: PASS.

Run: `pnpm app:lint`

Expected: PASS.

Run: `pnpm app:build`

Expected: PASS.

- [ ] **Step 5: Refresh the codebase graph and commit**

Run: `graphify update .`

Run:

```bash
git add apps/app/package.json pnpm-lock.yaml apps/app/.env.local.example apps/app/README.md apps/app/app/dashboard/create-video/ai-video-client.test.ts graphify-out
git commit -m "chore: remove R2 AI storage configuration"
```
