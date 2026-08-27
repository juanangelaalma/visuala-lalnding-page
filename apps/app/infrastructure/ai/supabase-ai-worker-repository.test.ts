import { describe, expect, it, vi } from "vitest";
import { SupabaseAiWorkerRepository } from "./supabase-ai-worker-repository";

describe("SupabaseAiWorkerRepository", () => {
  it("maps claimed work to the domain worker shape", async () => {
    const rpc = vi.fn().mockResolvedValue({
      error: null,
      data: [{ id: "generation", project_id: "project", type: "image", logical_model_key: "image_reference_default", provider_generation_id: null, prompt: "prompt", negative_prompt: null, input_assets: ["ai/project/input"], requested_duration_seconds: null, resolution: null }],
    });
    const repository = new SupabaseAiWorkerRepository({ rpc } as never);

    await expect(repository.claimWork("worker", 3)).resolves.toEqual([expect.objectContaining({ projectId: "project", inputAssets: ["ai/project/input"] })]);
    expect(rpc).toHaveBeenCalledWith("claim_ai_generation_work", { p_worker: "worker", p_limit: 3, p_lease_seconds: 300 });
  });
});
