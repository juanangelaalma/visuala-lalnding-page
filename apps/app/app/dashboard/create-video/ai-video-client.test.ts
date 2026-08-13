import { describe, expect, it, vi } from "vitest";
import { analyzeAndUpload, createStoryboard, generateVideo, type AiProduct, type AiScene } from "./ai-video-client";

const product: AiProduct = {
  name: "Test cleanser",
  description: "Gentle daily cleanser",
  category: "Beauty",
  audience: "Adults",
  sellingPoint: "Gentle cleansing",
  offer: "",
  cta: "Try it today",
  keyMessage: "Clean skin",
  concept: "Creator review",
};

const scene: AiScene = {
  id: "scene-1",
  position: 0,
  title: "Hook",
  sceneType: "talking_to_camera",
  motionComplexity: "medium",
  imagePrompt: "Creator holds the product",
  videoPrompt: "Natural handheld movement",
  negativePrompt: "text, watermark",
  dialogue: "Try this product",
  durationSeconds: 4,
  approvedImageGenerationId: null,
};

describe("AI video frontend/backend feature integration", () => {
  it("persists scenes, generates and approves images, then renders and polls the video", async () => {
    let statusRequest = 0;
    const requests: Array<{ url: string; method: string; body: unknown }> = [];
    const fetcher = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      requests.push({ url, method: init?.method ?? "GET", body: typeof init?.body === "string" ? JSON.parse(init.body) : init?.body ?? null });

      if (url.endsWith("/analyze")) return Response.json({ product });
      if (url.endsWith("/assets")) return Response.json({ assets: ["ai/user-1/references/0f694b76-9e3f-44e9-8c7a-8b57e9bb74b0.png"] }, { status: 201 });
      if (url.endsWith("/storyboard")) return Response.json({ project: { id: "project-1" }, scenes: [scene] }, { status: 201 });
      if (url.endsWith("/status")) {
        statusRequest++;
        const generation = statusRequest === 1
          ? { id: "image-1", sceneId: scene.id, type: "image", status: "succeeded", assets: ["https://assets.test/image.webp"], errorCode: null }
          : { id: "video-1", sceneId: scene.id, type: "video", status: "succeeded", assets: ["https://assets.test/video.mp4"], errorCode: null };
        return Response.json({ project: { id: "project-1", status: "generating_scenes" }, scenes: [scene], generations: [generation] });
      }
      if (url.endsWith("/image")) return Response.json({ generation: { id: "image-1", sceneId: scene.id, type: "image", status: "queued", assets: [], errorCode: null } }, { status: 202 });
      if (url.endsWith("/video")) return Response.json({ generations: [{ id: "video-1", sceneId: scene.id, type: "video", status: "queued", assets: [], errorCode: null }] }, { status: 202 });
      return Response.json({ scene });
    }) as typeof fetch;
    const progress: number[] = [];
    const analyzed = await analyzeAndUpload([new File(["image"], "product.png", { type: "image/png" })], fetcher);
    const storyboard = await createStoryboard({ product: analyzed.product, creator: "nadia", duration: 18, quality: "standard", referenceAssets: analyzed.assets }, fetcher, "storyboard-request-1");

    const result = await generateVideo({
      projectId: storyboard.project.id,
      scenes: storyboard.scenes,
      referenceAssets: analyzed.assets,
      onProgress: (value) => progress.push(value),
      idempotencyKey: "render-request-1",
    }, fetcher, async () => undefined);

    expect(result.videoUrl).toBe("https://assets.test/video.mp4");
    expect(progress).toEqual([15, 30, 55, 70, 100]);
    expect(requests.map(({ url, method }) => `${method} ${url}`)).toEqual([
      "POST /api/ai/analyze",
      "POST /api/ai/assets",
      "POST /api/ai/projects/storyboard",
      "PATCH /api/ai/scenes/scene-1",
      "POST /api/ai/scenes/scene-1/image",
      "GET /api/ai/projects/project-1/status",
      "POST /api/ai/scenes/scene-1/approve",
      "POST /api/ai/projects/project-1/video",
      "GET /api/ai/projects/project-1/status",
    ]);
    expect(requests[0].body).toBeInstanceOf(FormData);
    expect(requests[2].body).toMatchObject({ product, creator: "nadia", quality: "standard", referenceAssets: ["ai/user-1/references/0f694b76-9e3f-44e9-8c7a-8b57e9bb74b0.png"] });
    expect(requests[3].body).toMatchObject({ imagePrompt: scene.imagePrompt, durationSeconds: 4 });
    expect(requests[4].body).toMatchObject({ references: ["ai/user-1/references/0f694b76-9e3f-44e9-8c7a-8b57e9bb74b0.png"], idempotencyKey: "render-request-1:image:scene-1", maxEstimatedCostUsd: 0.1 });
    expect(requests[6].body).toEqual({ generationId: "image-1" });
    expect(requests[7].body).toEqual({ idempotencyKey: "render-request-1:video", maxEstimatedCostUsd: 5 });
  });
});
