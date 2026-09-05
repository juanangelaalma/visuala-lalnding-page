# Product Demo Studio Progress

## Current implementation

- Separate Product Demo menu and dashboard at `/dashboard/product-demo`.
- User-owned project persistence: `product_demo_projects`.
- Persisted setup screens:
  - Product Brief
  - Brand Setup
  - Video Plan
- AI storyboard generation through Gemini.
- Persisted storyboard scenes: `product_demo_scenes`.
- Storyboard Review supports copy edits, reorder, duplicate, delete, and add scene; edits save before generation.
- Frontend generation progress screen.
- Preview then Export flow.
- Phase 2 editor UI remains in code but is intentionally unlinked.

## Current flow

```text
Product Demo Dashboard
→ Product Brief
→ Brand Setup
→ Video Plan
→ AI Storyboard
→ Storyboard Review
→ Generation Progress
→ Video Preview
→ Export
```

## Verified

- Typecheck passes.
- Lint passes with one existing warning: `apps/app/coverage/block-navigation.js` unused eslint-disable directive.
- Knowledge graph updated.
- Gates: 3/3 met in `GATES.md`.

## Next checklist

- [ ] Apply Product Demo migrations in target Supabase environment.
- [ ] Load saved project data into setup screens on revisit.
- [ ] Persist project name, optional Product Brief fields, and Brand logo asset upload.
- [ ] Add storyboard regeneration per scene.
- [ ] Create real generation-job model and worker status polling.
- [ ] Implement Remotion + FFmpeg renderer for MP4/WebM output.
- [ ] Store rendered files in object storage.
- [ ] Replace mock Preview and Export with real rendered video/download.
- [ ] Add focused tests for schemas, ownership, storyboard persistence, and generation flow.

## Deferred: Phase 2

- High-level generated-video editor.
- Post-generation copy, layout, motion intensity, and product-focus controls.
- AI rewrite and scene variation actions.
