import { describe, expect, it, vi } from "vitest";
import { SupabaseAiSceneRepository } from "./supabase-ai-scene-repository";

describe("SupabaseAiSceneRepository", () => {
  it("maps snake_case scene row and owner scope", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { id: "scene-id", project_id: "project-id", position: 0, title: "Title", scene_type: "hook_light_motion", motion_complexity: "low", image_prompt: "image", video_prompt: "video", negative_prompt: "negative", dialogue: "", duration_seconds: 3, approved_image_generation_id: null, created_at: "created" }, error: null });
    const projectEq = vi.fn().mockReturnValue({ maybeSingle });
    const sceneEq = vi.fn().mockReturnValue({ eq: projectEq });
    const repository = new SupabaseAiSceneRepository({ from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: sceneEq }) }) } as never);

    await expect(repository.findOwnedById("scene-id", "user-id")).resolves.toMatchObject({ projectId: "project-id", imagePrompt: "image" });
    expect(sceneEq).toHaveBeenCalledWith("id", "scene-id");
    expect(projectEq).toHaveBeenCalledWith("ai_projects.user_id", "user-id");
  });

  it("returns null when owner scope does not match", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const repository = new SupabaseAiSceneRepository({ from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }) }) }) } as never);

    await expect(repository.findOwnedById("scene-id", "other-user-id")).resolves.toBeNull();
  });

  it("propagates scene lookup errors", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: new Error("database unavailable") });
    const repository = new SupabaseAiSceneRepository({ from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }) }) }) } as never);

    await expect(repository.findOwnedById("scene-id", "user-id")).rejects.toThrow("database unavailable");
  });
});
