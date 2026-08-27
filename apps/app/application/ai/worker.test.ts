import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { runAiWorker } from "./worker";

describe("AI worker", () => {
  it("reverses credit only after definite provider submission failure", async () => {
    const dependencies = {
      generations: {
        claimWork: vi.fn().mockResolvedValue([{ id: "generation", projectId: "project", type: "image", logicalModelKey: "image_fast", providerGenerationId: null, prompt: "prompt", negativePrompt: null, inputAssets: [], requestedDurationSeconds: null, resolution: null }]),
        listExpiredSubmissionProjectIds: vi.fn().mockResolvedValue([]),
        saveSubmission: vi.fn(),
        savePollingResult: vi.fn(),
        reverseFailedWork: vi.fn().mockResolvedValue(undefined),
        recordFailure: vi.fn(),
      },
      assets: { signAssets: vi.fn().mockResolvedValue([]), copyRemoteAsset: vi.fn() },
      imageProvider: { generate: vi.fn().mockRejectedValue({ outcome: "rejected" }), getStatus: vi.fn() },
      videoProvider: { generate: vi.fn(), getStatus: vi.fn() },
      refreshProjectStatus: vi.fn(),
    };

    await runAiWorker({}, dependencies);

    expect(dependencies.generations.reverseFailedWork).toHaveBeenCalledWith("generation", expect.any(String), "PROVIDER_REJECTED");
  });
});
