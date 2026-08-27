import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { runAiWorker } from "./worker";

const work = (input: Partial<{ type: "image" | "video"; inputAssets: string[]; providerGenerationId: string | null }> = {}) => ({
  id: "generation",
  projectId: "project",
  type: "image" as const,
  logicalModelKey: "image_fast",
  providerGenerationId: null,
  prompt: "prompt",
  negativePrompt: null,
  inputAssets: [],
  requestedDurationSeconds: 5,
  resolution: "720p",
  ...input,
});

const dependencies = (claimed = [work()]) => ({
  generations: {
    claimWork: vi.fn().mockResolvedValue(claimed),
    listExpiredSubmissionProjectIds: vi.fn().mockResolvedValue([]),
    saveSubmission: vi.fn().mockResolvedValue(undefined),
    savePollingResult: vi.fn().mockResolvedValue(undefined),
    reverseFailedWork: vi.fn().mockResolvedValue(undefined),
    recordFailure: vi.fn().mockResolvedValue(undefined),
    refreshProjectStatus: vi.fn().mockResolvedValue(undefined),
  },
  assets: { signAssets: vi.fn().mockResolvedValue([]), copyRemoteAsset: vi.fn() },
  imageProvider: { generate: vi.fn().mockResolvedValue({ externalId: "provider", status: "queued", raw: {} }), getStatus: vi.fn() },
  videoProvider: { generate: vi.fn().mockResolvedValue({ externalId: "provider", status: "queued", raw: {} }), getStatus: vi.fn() },
});

describe("AI worker", () => {
  it("reverses credit only after definite provider submission failure", async () => {
    const deps = dependencies();
    deps.imageProvider.generate.mockRejectedValue({ outcome: "rejected" });

    await runAiWorker({}, deps);

    expect(deps.generations.reverseFailedWork).toHaveBeenCalledWith("generation", expect.any(String), "PROVIDER_REJECTED");
  });

  it("signs private image output paths before submission", async () => {
    const deps = dependencies([work({ inputAssets: ["ai/project/image/0"] })]);
    deps.assets.signAssets.mockResolvedValue(["https://signed.example/image"]);

    await runAiWorker({}, deps);

    expect(deps.imageProvider.generate).toHaveBeenCalledWith(expect.objectContaining({ references: ["https://signed.example/image"] }));
  });

  it("signs private video output paths before submission", async () => {
    const deps = dependencies([work({ type: "video", inputAssets: ["ai/project/image/0"] })]);
    deps.assets.signAssets.mockResolvedValue(["https://signed.example/image"]);

    await runAiWorker({}, deps);

    expect(deps.videoProvider.generate).toHaveBeenCalledWith(expect.objectContaining({ image: "https://signed.example/image" }));
  });

  it("records ambiguous submission without reversing credits", async () => {
    const deps = dependencies();
    deps.generations.saveSubmission.mockRejectedValue(new Error("write failed"));

    await runAiWorker({}, deps);

    expect(deps.generations.recordFailure).toHaveBeenCalledWith(expect.objectContaining({ code: "SUBMISSION_UNKNOWN", unknownAfterSend: true }));
    expect(deps.generations.reverseFailedWork).not.toHaveBeenCalled();
  });
});
