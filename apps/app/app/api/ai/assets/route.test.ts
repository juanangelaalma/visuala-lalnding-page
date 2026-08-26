import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ authenticated: vi.fn(), uploadReferenceAssets: vi.fn() }));

vi.mock("@/infrastructure/ai/services", () => ({ createAiServices: () => ({ uploadReferenceAssets: mocks.uploadReferenceAssets }) }));
vi.mock("../_shared", () => ({
  authenticated: mocks.authenticated,
  ApiError: class ApiError extends Error {
    constructor(public status: number, public code: string, message: string) {
      super(message);
    }
  },
  failure: (error: { status?: number; code?: string; message?: string }) => Response.json(
    { error: { code: error.code ?? "INTERNAL_ERROR", message: error.message ?? "The request could not be completed" } },
    { status: error.status ?? 500 },
  ),
}));

import { POST } from "./route";

describe("AI assets route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticated.mockResolvedValue({ id: "00000000-0000-4000-8000-000000000000" });
    mocks.uploadReferenceAssets.mockResolvedValue({ assets: ["ai/00000000-0000-4000-8000-000000000000/references/file.png"] });
  });

  it("stores uploads under the authenticated user's private reference path", async () => {
    const form = new FormData();
    form.append("images", new File([new Uint8Array([1])], "file.png", { type: "image/png" }));

    const response = await POST(new Request("https://visuala.test/api/ai/assets", { method: "POST", body: form }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ assets: [expect.stringMatching(/^ai\/00000000-0000-4000-8000-000000000000\/references\//)] });
    expect(mocks.uploadReferenceAssets).toHaveBeenCalledWith({
      ownerId: "00000000-0000-4000-8000-000000000000",
      files: [expect.objectContaining({ body: expect.any(Uint8Array), contentType: "image/png", extension: "png" })],
    });
  });
});
