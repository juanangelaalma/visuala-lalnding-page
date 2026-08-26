import { describe, expect, it, vi } from "vitest";
import { SupabaseAiGenerationRepository } from "./supabase-ai-generation-repository";

describe("SupabaseAiGenerationRepository", () => {
  it("maps snake_case generation row", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "generation-id", project_id: "project-id", scene_id: null, parent_generation_id: null, type: "image", logical_model_key: "image_storyboard_economy", provider: "atlas", provider_model_id: "model", status: "queued", attempt_number: 1, prompt: null, negative_prompt: null, input_assets: [], output_assets: [], estimated_cost_usd: null, credits_charged: 0, idempotency_key: "key", error_code: null, error_message: null, created_at: "created", completed_at: null }, error: null });
    const repository = new SupabaseAiGenerationRepository({ from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }) }) } as never);

    await expect(repository.findById("generation-id")).resolves.toMatchObject({ projectId: "project-id", logicalModelKey: "image_storyboard_economy", outputAssets: [] });
  });
});
