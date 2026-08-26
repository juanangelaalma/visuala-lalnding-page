import { describe, expect, it, vi } from "vitest";
import { getProjectStatus } from "./get-project-status";

describe("getProjectStatus", () => {
  it("does not sign output assets until owned project exists", async () => {
    const signAssets = vi.fn();
    const deps = {
      projects: { findOwnedById: vi.fn().mockResolvedValue(null), findOwnedByIdempotencyKey: vi.fn(), create: vi.fn(), updateStatus: vi.fn() },
      scenes: { listByProjectId: vi.fn(), createMany: vi.fn(), findOwnedById: vi.fn(), update: vi.fn(), delete: vi.fn() },
      generations: { listByProjectId: vi.fn(), findByProjectIdempotencyKey: vi.fn(), findById: vi.fn(), hasGenerationHistoryForScene: vi.fn(), create: vi.fn(), updateStatus: vi.fn() },
      assets: { upload: vi.fn(), signAssets },
    };

    await expect(getProjectStatus({ ownerId: "user-id", projectId: "project-id" }, deps)).rejects.toMatchObject({ status: 404 });

    expect(signAssets).not.toHaveBeenCalled();
  });
});
