import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createAuthServices: vi.fn(), analyzeProduct: vi.fn() }));

vi.mock("@/application/auth/services", () => ({ createAuthServices: mocks.createAuthServices }));
vi.mock("@/application/ai/services", () => ({ createAiServices: () => ({ analyzeProduct: mocks.analyzeProduct }) }));
vi.mock("@/infrastructure/ai/supabase-assets", () => ({ createSignedAssetUrls: vi.fn() }));

import { POST } from "./route";

describe("analyze route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createAuthServices.mockResolvedValue({ authProvider: { getCurrentUser: vi.fn().mockResolvedValue(null) } });
  });

  it("returns 401 when request has no user", async () => {
    const form = new FormData();
    form.append("images", new File([new Uint8Array([1])], "product.png", { type: "image/png" }));

    const response = await POST(new Request("https://visuala.test/api/ai/analyze", { method: "POST", body: form }));

    expect(response.status).toBe(401);
  });

  it("sends parsed images to analysis use case", async () => {
    mocks.createAuthServices.mockResolvedValue({ authProvider: { getCurrentUser: vi.fn().mockResolvedValue({ id: "user" }) } });
    mocks.analyzeProduct.mockResolvedValue({ product: { name: "Coffee" } });
    const form = new FormData();
    form.append("images", new File([new Uint8Array([1])], "product.png", { type: "image/png" }));

    const response = await POST(new Request("https://visuala.test/api/ai/analyze", { method: "POST", body: form }));

    expect(response.status).toBe(200);
    expect(mocks.analyzeProduct).toHaveBeenCalledWith(expect.objectContaining({ images: [{ mimeType: "image/png", base64: "AQ==" }] }));
  });
});
