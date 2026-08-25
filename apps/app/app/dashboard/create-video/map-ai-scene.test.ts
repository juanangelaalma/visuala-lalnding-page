import { describe, expect, it } from "vitest";
import { mapAiScene } from "./map-ai-scene";

describe("mapAiScene", () => {
  it("maps API scene fields into studio scene fields", () => {
    expect(
      mapAiScene({
        id: "scene-1",
        position: 0,
        title: "Hook",
        sceneType: "talking_to_camera",
        motionComplexity: "medium",
        imagePrompt: "Creator holds product",
        videoPrompt: "Natural movement",
        negativePrompt: "text",
        dialogue: "Try this",
        durationSeconds: 4,
        approvedImageGenerationId: null,
      }),
    ).toEqual({
      id: "scene-1",
      title: "Hook",
      duration: 4,
      visual: "Creator holds product",
      dialogue: "Try this",
      sceneType: "talking_to_camera",
      motionComplexity: "medium",
      videoPrompt: "Natural movement",
      negativePrompt: "text",
    });
  });
});
