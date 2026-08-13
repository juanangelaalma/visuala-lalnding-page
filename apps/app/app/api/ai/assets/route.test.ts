import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ authenticated: vi.fn(), uploadAsset: vi.fn() }));

vi.mock("@/infrastructure/ai/supabase-assets", () => ({ uploadAsset: mocks.uploadAsset }));
vi.mock("../_shared", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../_shared")>()),
  authenticated: mocks.authenticated,
}));

import { POST } from "./route";

describe("AI assets route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticated.mockResolvedValue({ id: "00000000-0000-4000-8000-000000000000" });
    mocks.uploadAsset.mockImplementation(async (_body, _contentType, key) => key);
  });

  it("stores uploads under the authenticated user's private reference path", async () => {
    const form = new FormData();
    form.append("images", new File([new Uint8Array([1])], "file.png", { type: "image/png" }));

    const response = await POST(new Request("https://visuala.test/api/ai/assets", { method: "POST", body: form }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ assets: [expect.stringMatching(/^ai\/00000000-0000-4000-8000-000000000000\/references\//)] });
    expect(mocks.uploadAsset).toHaveBeenCalledWith(expect.any(Uint8Array), "image/png", expect.stringMatching(/^ai\/00000000-0000-4000-8000-000000000000\/references\//));
  });
});
