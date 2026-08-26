import { describe, expect, it, vi } from "vitest";
import { SupabaseAiProjectRepository } from "./supabase-ai-project-repository";

describe("SupabaseAiProjectRepository", () => {
  it("maps snake_case project row and scopes lookup to owner", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: "project-id", user_id: "user-id", product: { name: "Product", description: "Description", category: "Category", audience: "Audience", sellingPoint: "Point", offer: "", cta: "Buy", keyMessage: "Message", concept: "Concept" }, creator: "Creator", duration_seconds: 30, quality: "standard", reference_assets: [], status: "storyboard_ready", idempotency_key: "key", created_at: "created", updated_at: "updated" },
      error: null,
    });
    const eq = vi.fn().mockReturnThis();
    const repository = new SupabaseAiProjectRepository({ from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq, maybeSingle }) }) } as never);

    await expect(repository.findOwnedById("project-id", "user-id")).resolves.toMatchObject({ userId: "user-id", idempotencyKey: "key" });
    expect(eq).toHaveBeenNthCalledWith(1, "id", "project-id");
    expect(eq).toHaveBeenNthCalledWith(2, "user_id", "user-id");
  });
});
