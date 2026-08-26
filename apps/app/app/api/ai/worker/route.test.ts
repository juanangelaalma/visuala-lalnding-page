import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/application/ai/worker", () => ({ runAiWorker: vi.fn() }));
vi.mock("@/infrastructure/ai/supabase-assets", () => ({ createSignedAssetUrls: vi.fn() }));

import { POST } from "./route";

describe("AI worker route", () => {
  const secret = process.env.AI_WORKER_SECRET;

  afterEach(() => {
    process.env.AI_WORKER_SECRET = secret;
  });

  it("rejects request without bearer secret", async () => {
    process.env.AI_WORKER_SECRET = "worker-secret";

    const response = await POST(new Request("https://visuala.test/api/ai/worker", { method: "POST" }));

    expect(response.status).toBe(401);
  });

  it("rejects request with wrong bearer secret", async () => {
    process.env.AI_WORKER_SECRET = "worker-secret";

    const response = await POST(new Request("https://visuala.test/api/ai/worker", { method: "POST", headers: { authorization: "Bearer wrong-secret" } }));

    expect(response.status).toBe(401);
  });
});
