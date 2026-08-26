import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ authenticated: vi.fn(), createStoryboard: vi.fn(), createAiServices: vi.fn() }));

vi.mock("@/infrastructure/ai/services", () => ({ createAiServices: mocks.createAiServices }));
vi.mock("@/infrastructure/ai/supabase-assets", () => ({ createSignedAssetUrls: vi.fn() }));
vi.mock("../../_shared", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../_shared")>()),
  authenticated: mocks.authenticated,
}));

import { POST } from "./route";

const product = { name: "Product", description: "Description", category: "Category", audience: "Audience", sellingPoint: "Point", offer: "Offer", cta: "CTA", keyMessage: "Message", concept: "Concept" };

describe("storyboard route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticated.mockResolvedValue({ id: "00000000-0000-4000-8000-000000000000" });
    mocks.createAiServices.mockReturnValue({ createStoryboard: mocks.createStoryboard });
  });

  it("rejects another user's reference path before persisting a project", async () => {
    const response = await POST(new Request("https://visuala.test/api/ai/projects/storyboard", {
      method: "POST",
      headers: { "content-type": "application/json", "idempotency-key": "request-1" },
      body: JSON.stringify({ product, creator: "Creator", duration: 12, referenceAssets: ["ai/11111111-1111-4111-8111-111111111111/references/file.png"] }),
    }));

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: { code: "REFERENCE_ASSET_FORBIDDEN", message: "Reference assets must belong to the authenticated user" } });
    expect(mocks.createAiServices).not.toHaveBeenCalled();
  });
});
